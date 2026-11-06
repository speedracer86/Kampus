/* The voice-cache Worker's logic, without the network.

   Placed here for the same reason as voice-plan.test.js: this is voice-pipeline
   tooling, and this is where the unit runner lives. What is pinned is everything
   that can be wrong without anyone noticing — the cache key, the character fold,
   and the guards that keep a question screen from becoming a free text-to-speech
   endpoint. The ElevenLabs call itself is not exercised; see the README. */
import { describe, it, expect } from 'vitest';
import worker, { normalize, foldToWords, sha256 } from '../../../workers/voice-cache/index.js';

const bucket = (seed = {}) => {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async (k) => (store.has(k) ? { body: store.get(k) } : null),
    put: async (k, v) => { store.set(k, v); },
  };
};
const call = (text, env = {}, extra = '') => worker.fetch(
  new Request(`https://v/?text=${encodeURIComponent(text)}${extra}`),
  { VOICE_BUCKET: bucket(), ...env },
  { waitUntil: () => {} },
);

describe('the cache key', () => {
  it('ignores markup, entities and spacing, so one sentence is one bill', async () => {
    expect(normalize('  One   costs <b>$7</b>.&nbsp; ')).toBe('One costs $7.');
    expect(await sha256('v|One costs $7.')).toBe(await sha256('v|One costs $7.'));
  });

  it('is idempotent on what the client actually sends', () => {
    // The client sends plainSpeech() output. If normalising it again changed it,
    // the Worker would key a second entry for every sentence the app ever spoke.
    for (const said of ['One costs $7.', '1 over 3 = ? over 15', 'Someone bought 3 cups for $12. What\u2019s one cup?',
      '2 to the 6 = ?', 'Split 20 in the ratio 2:3. How many is the smaller share?']) {
      expect(normalize(said), said).toBe(said);
    }
  });

  it('drops a whole SVG rather than its tags, so axis labels are not spoken', () => {
    expect(normalize('You land on -2. <svg><text>0</text><text>-9</text></svg>')).toBe('You land on -2.');
  });

  it('changes with the voice, so a new voice does not serve the old one', async () => {
    expect(await sha256('voiceA|hello')).not.toBe(await sha256('voiceB|hello'));
  });
});

describe('character timings fold into words', () => {
  const align = (text, per = 0.1) => ({
    characters: [...text],
    character_start_times_seconds: [...text].map((_, i) => i * per),
    character_end_times_seconds: [...text].map((_, i) => (i + 1) * per),
  });

  it('starts a word at its first character and ends at its last', () => {
    const words = foldToWords('one two', align('one two'));
    expect(words.map(w => w.word)).toEqual(['one', 'two']);
    expect(words[0].start).toBeCloseTo(0);
    expect(words[1].start).toBeCloseTo(0.4);
    expect(words[1].end).toBeCloseTo(0.7);
  });

  it('refuses timings that do not match the line, rather than stretching them', () => {
    // The sweep rejects a mismatch too; dropping it here means it is never cached.
    expect(foldToWords('one two three', align('one two'))).toBeNull();
    expect(foldToWords('one two', { characters: ['o'], character_start_times_seconds: [] })).toBeNull();
    expect(foldToWords('one two', null)).toBeNull();
  });

  it('handles runs of spaces without inventing empty words', () => {
    expect(foldToWords('a  b', align('a  b')).map(w => w.word)).toEqual(['a', 'b']);
  });
});

describe('the guards', () => {
  it('refuses a line over 200 characters', async () => {
    const res = await call('x'.repeat(201));
    expect(res.status).toBe(413);
  });

  it('refuses an empty request', async () => {
    expect((await call('   ')).status).toBe(400);
  });

  it('says "no clip" rather than erroring when it is not configured', async () => {
    const res = await call('One costs $7.');
    expect(res.status).toBe(503);              // the client falls back to the browser voice
    expect((await res.json()).ok).toBe(false);
  });

  it('never calls the API for a sentence it already has', async () => {
    const b = bucket();
    const key = await sha256('|One costs $7.');
    b.store.set(`clips/${key}.mp3`, new Uint8Array([1, 2, 3]));
    const res = await worker.fetch(new Request(`https://v/?text=${encodeURIComponent('One costs $7.')}`),
      // No key at all: a hit must be served without one, which is the proof it
      // did not reach for the network.
      { VOICE_BUCKET: b }, { waitUntil: () => {} });
    expect(res.status).toBe(200);
    expect(res.headers.get('x-voice-cache')).toBe('hit');
    expect(res.headers.get('content-type')).toBe('audio/mpeg');
  });

  it('serves timings as JSON when asked, and 404s when it has none', async () => {
    const b = bucket();
    const key = await sha256('|One costs $7.');
    b.store.set(`clips/${key}.json`, JSON.stringify({ text: 'One costs $7.', words: [] }));
    const hit = await worker.fetch(new Request(`https://v/?text=${encodeURIComponent('One costs $7.')}&times=1`),
      { VOICE_BUCKET: b }, { waitUntil: () => {} });
    expect(hit.headers.get('content-type')).toContain('application/json');
    const miss = await call('Something else entirely.', {}, '&times=1');
    expect(miss.status).toBe(404);
  });

  it('answers a preflight without doing anything', async () => {
    const res = await worker.fetch(new Request('https://v/', { method: 'OPTIONS' }), {}, { waitUntil: () => {} });
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });
});
