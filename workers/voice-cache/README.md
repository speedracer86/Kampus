# Voice cache Worker

Karla reads the question screens. Question text is **generated** — the numbers
differ on every draw — so there is no bank to pre-generate clips from. This
Worker makes a clip the first time a sentence is ever heard and keeps it in R2;
every kid after the first is served from cache.

```
GET /?text=One%20costs%20%247.        -> audio/mpeg
GET /?text=...&times=1                -> {"text","words":[{word,start,end}]}
```

## What it costs

One ElevenLabs call per *distinct sentence*, ever. Question text repeats far more
than it looks: the same skill at the same tier draws from a small set of shapes,
so the cache fills quickly and then stops spending. Daily character spend is
counted into KV under `spend:YYYY-MM-DD` so the bill can be read without reading
logs.

## Guards

- **200 characters.** A question is one sentence. Anything longer is a bug, or
  someone using this as a free text-to-speech endpoint.
- **Markup is stripped here too.** The client already sends `plainSpeech()`
  output; repeating it means two spellings of one sentence cannot become two
  cache entries and two bills.
- **The key is a Worker secret.** Never in the client, never in a URL, never in
  a response.
- **Every failure returns "no clip".** The client falls back to the browser
  voice and the lesson continues. Audio never gates.

## Deploy (owner's step, with `workers/preview`)

```bash
cd workers/voice-cache
npx wrangler r2 bucket create kampus-voice
npx wrangler kv namespace create VOICE_KV     # then paste the id into wrangler.toml
npx wrangler secret put ELEVENLABS_API_KEY
npx wrangler secret put ELEVENLABS_VOICE_ID
npx wrangler deploy
```

Then set `VITE_VOICE_CACHE` to the deployed URL for the web app.

**Until it is deployed, nothing here is reached.** The app sends no
`VITE_VOICE_CACHE`, the question screens use the browser voice — which still
sweeps, because the utterance reports the character it has reached — and the
timings simply become exact when the Worker lights up. Shipping without it is a
supported state, not a broken one.

## Not exercised yet

The ElevenLabs call itself has never run. The response shape is checked before
anything is cached (`audio_base64` must be a non-empty string, and the character
alignment must fold to exactly the line's word count or the timings are dropped)
so a wrong assumption fails closed rather than caching rubbish. The last piece of
unexercised ElevenLabs code in this repo sent `output_format` in the body, where
it is silently ignored, and cost a tranche twice over: here it is a query
parameter. Watch the first deploy's spend line.
