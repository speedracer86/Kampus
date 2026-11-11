/* Voice cache Worker — GET /?text=<one spoken line>
 *
 * Karla reads the question screens, and the question text is GENERATED: there is
 * no bank to pre-generate clips from, because the numbers differ every draw. So
 * clips are made on first hearing and kept: the first kid to meet "3/5 = ?/15"
 * pays for it, and every kid after her is served from R2.
 *
 * The key is a Worker secret. It is never in the client, never in a URL, and
 * never in a response — a text-to-speech key in a bundle is a key anyone can
 * spend.
 *
 * What it deliberately does NOT do:
 *   - speak anything over 200 characters. A question is one sentence; a long
 *     body is either a bug or someone using this as a free TTS endpoint.
 *   - accept markup. The client sends text that has already been through
 *     plainSpeech(); anything that still looks like a tag is stripped here too,
 *     because a cache key built from "<b>" is a different key for the same
 *     sentence and would pay twice.
 *   - fail loudly at the kid. Every error path returns a status the client
 *     treats as "no clip" — it falls back to the browser voice and the lesson
 *     continues. Audio never gates, here least of all.
 *
 * Deployment is the owner's step (see README.md). Until then the app sends no
 * VITE_VOICE_CACHE and nothing here is reached: the question screens use the
 * browser voice, which is what they do today.
 */

const MAX_CHARS = 200;
/* THE DAILY CEILING, in characters minted (cache hits cost nothing and are not
   counted). This endpoint is PUBLIC and mints a paid ElevenLabs call for every
   string it has not seen before, so the cache alone protects only repeats — a
   loop feeding it novel text would spend the credit balance and the cache would
   never once be hit. The cap is what stands between a public URL and the bill.

   Sized for pilot-scale legitimate use. A kid meets roughly forty novel lines a
   day across a lesson, free practice and the stand; question text runs about
   eighty characters, so a working kid costs on the order of 3,000 characters a
   day. 20,000 is six or seven kids at full tilt — comfortably past a pilot —
   while bounding the worst day to something a monthly allowance survives.

   Raise it with a plain Worker var, no code change:
       npx wrangler deploy --var DAILY_CHAR_CAP:50000
   or set it in wrangler.toml. Spend is counted per UTC day in KV under
   `spend:YYYY-MM-DD`, which is also what the cap reads. */
const DEFAULT_DAILY_CHAR_CAP = 20000;
const MODEL = 'eleven_flash_v2_5';
/* A QUERY parameter, not a body field. Sent in the body ElevenLabs ignores it
   and bills the account default back at twice the size — which is exactly how a
   tranche of this project's clips came back at 128 kbps. */
const FORMAT = 'mp3_44100_64';
const CACHE_SECONDS = 60 * 60 * 24 * 365;

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
};

/** No clip. The client falls back to the browser voice; it is not an error to a kid. */
const noClip = (why, status = 404) =>
  new Response(JSON.stringify({ ok: false, why }), {
    status, headers: { 'content-type': 'application/json; charset=utf-8', ...cors },
  });

/* The same normalisation the client applies, repeated rather than trusted: two
   spellings of one sentence are two cache entries and two bills. */
function normalize(raw) {
  return String(raw || '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    /* Matching plainSpeech(): a stripped tag leaves a space, so "<b>$7</b>."
       collapses to "$7 ." and keys a SECOND cache entry for a sentence the
       client already spells "$7." — two clips and two bills for one line. Not
       before "?", which in these strings is usually the blank to fill
       ("? over 15") rather than the end of a sentence. */
    .replace(/\s+([.,!])/g, '$1')
    .trim();
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

/**
 * ElevenLabs aligns by CHARACTER. A sweep highlights words, so the characters
 * are folded: a word starts when its first character does and ends when its
 * last one does.
 */
function foldToWords(text, alignment) {
  const chars = alignment?.characters;
  const starts = alignment?.character_start_times_seconds;
  const ends = alignment?.character_end_times_seconds;
  if (!Array.isArray(chars) || !Array.isArray(starts) || chars.length !== starts.length) return null;
  const words = [];
  let current = null;
  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    if (/\s/.test(ch)) { if (current) { words.push(current); current = null; } continue; }
    if (!current) current = { word: '', start: starts[i], end: ends?.[i] ?? starts[i] };
    current.word += ch;
    current.end = ends?.[i] ?? current.end;
  }
  if (current) words.push(current);
  // The sweep refuses timings whose word count does not match the line, so a
  // fold that disagrees with a plain split is worth nothing and is dropped here.
  const plain = text.split(/\s+/).filter(Boolean);
  return words.length === plain.length ? words : null;
}

const spendKey = () => `spend:${new Date().toISOString().slice(0, 10)}`;
const capOf = (env) => Number(env.DAILY_CHAR_CAP) || DEFAULT_DAILY_CHAR_CAP;

/** One day's spend, counted so it can be read without reading logs. */
async function recordSpend(env, chars) {
  if (!env.VOICE_KV) return;
  try {
    const now = Number(await env.VOICE_KV.get(spendKey())) || 0;
    await env.VOICE_KV.put(spendKey(), String(now + chars), { expirationTtl: 60 * 60 * 24 * 40 });
  } catch { /* never let accounting break playback */ }
}

/**
 * Would minting this line pass today's ceiling?
 *
 * WITHOUT KV THERE IS NO CAP, AND THAT IS REFUSED. A counter that cannot be
 * read cannot bound anything, and "we could not check, so we spent it" is how
 * an uncapped endpoint explains itself afterwards. No namespace bound means no
 * minting — the client falls back to the browser voice, which is the same thing
 * that happens before this Worker is deployed at all.
 *
 * The read-then-mint window means a burst of simultaneous misses can cross the
 * line together. That is a backstop against runaway, not a ledger: it bounds
 * the day to roughly the cap, not exactly it.
 */
async function withinCap(env, chars) {
  if (!env.VOICE_KV) return { ok: false, why: 'no spend counter bound' };
  let spent = 0;
  try {
    spent = Number(await env.VOICE_KV.get(spendKey())) || 0;
  } catch {
    return { ok: false, why: 'spend counter unreadable' };
  }
  const cap = capOf(env);
  if (spent + chars > cap) return { ok: false, why: `daily cap reached (${spent}/${cap})` };
  return { ok: true };
}

/* Exported for tests: the fold and the normalisation are where the subtle bugs
   live, and neither needs the network. */
export { normalize, foldToWords, sha256, withinCap, capOf, DEFAULT_DAILY_CHAR_CAP };

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'GET') return noClip('method', 405);

    const url = new URL(request.url);
    const text = normalize(url.searchParams.get('text'));
    if (!text) return noClip('no text', 400);
    if (text.length > MAX_CHARS) return noClip(`over ${MAX_CHARS} characters`, 413);
    if (!env.VOICE_BUCKET) return noClip('no bucket bound', 503);

    const voice = env.ELEVENLABS_VOICE_ID || '';
    const key = `${await sha256(`${voice}|${text}`)}`;
    const audioKey = `clips/${key}.mp3`;
    const timesKey = `clips/${key}.json`;

    const wantsTimes = url.searchParams.get('times') === '1';
    const served = (body, type, extra = {}) => new Response(body, {
      headers: { 'content-type': type, 'cache-control': `public, max-age=${CACHE_SECONDS}, immutable`, ...cors, ...extra },
    });

    // Cache first, always.
    const hit = await env.VOICE_BUCKET.get(wantsTimes ? timesKey : audioKey);
    if (hit) return served(hit.body, wantsTimes ? 'application/json; charset=utf-8' : 'audio/mpeg', { 'x-voice-cache': 'hit' });
    if (wantsTimes) return noClip('no timings for this line');

    if (!env.ELEVENLABS_API_KEY || !voice) return noClip('not configured', 503);

    /* Only a MISS can spend, so the cap is checked here and not above: a cache
       hit costs nothing and must keep working long after the day's ceiling is
       reached. Over the line returns "no clip" like every other refusal — the
       kid gets the browser voice and the lesson does not notice. */
    const budget = await withinCap(env, text.length);
    if (!budget.ok) return noClip(budget.why, 429);

    /* One call, with character timestamps so the sweep can be exact. The audio
       comes back base64 inside the JSON on this endpoint, not as a body. */
    let res;
    try {
      res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps?output_format=${FORMAT}`,
        {
          method: 'POST',
          headers: { 'xi-api-key': env.ELEVENLABS_API_KEY, 'content-type': 'application/json' },
          body: JSON.stringify({ text, model_id: MODEL, voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
        },
      );
    } catch { return noClip('upstream unreachable', 502); }
    // The status is safe to report; the body can echo request details, so it is not.
    if (!res.ok) return noClip(`upstream ${res.status}`, 502);

    let payload;
    try { payload = await res.json(); } catch { return noClip('upstream shape', 502); }
    const b64 = payload?.audio_base64;
    if (typeof b64 !== 'string' || !b64) return noClip('upstream shape', 502);

    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const words = foldToWords(text, payload?.alignment || payload?.normalized_alignment);

    ctx.waitUntil((async () => {
      try {
        await env.VOICE_BUCKET.put(audioKey, bin, { httpMetadata: { contentType: 'audio/mpeg' } });
        if (words) {
          await env.VOICE_BUCKET.put(timesKey, JSON.stringify({ text, words }), {
            httpMetadata: { contentType: 'application/json' },
          });
        }
      } catch { /* a cache that failed to write still served this kid */ }
      await recordSpend(env, text.length);
    })());

    return served(bin, 'audio/mpeg', { 'x-voice-cache': 'miss' });
  },
};
