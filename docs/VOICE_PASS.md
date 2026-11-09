# The Voice Pass — work order (bank owner → Claude Code, Nov 2026)

Karla gets a real voice. The family verdict was "thin, a lot of reading, and the
voice is robotic"; the student has **auditory processing delays** and rushes
reading. The accommodation is NOT audio instead of text — it is both channels
locked together: **say-it-show-it**. While Karla speaks a line, that line's text
is highlighted and exactly one visual act happens on the math. Nothing else on
screen moves or sounds while she talks.

The owner approved a working demo of the interaction (one bar beat, phrase
highlight + pieces appearing/shading on the spoken line). This document is the
build order for the production version.

## What already landed (bank side — do not re-author)

- `packages/curriculum/src/speak.js` — the speak-script bank. Per skill:
  `steps` aligned 1:1 with `teachStepsFor(skill)`, `more` aligned 1:1 with
  `SECOND_EXAMPLES[skill]`. Each step is `{ lines: [{ say, cue }] }` — short
  spoken beats (≤120 chars, APD rule) each paired with ONE visual cue. The cue
  vocabulary is documented in the file and enforced by
  `packages/curriculum/test/speak.test.js`.
- The seam: `year.js` attaches `speak` (joined text — speechSynthesis reads it
  today) and `speakLines` (the cue-tagged lines) to every teach step that has a
  script.
- **Tranche 1 is authored**: the four reference skills (eqFrac, unitRate,
  addInt, twoStep), base + second examples. Build the entire pipeline against
  these; the remaining 75 skills arrive from the owner's session as bank
  patches that change `speak.js` only — nothing in your pipeline should need
  touching when they land.

## Secrets — first, before anything else

1. Add `.env` to `.gitignore` (repo root). Verify with `git status` that it is
   untracked BEFORE any commit.
2. The owner has created `.env` at the repo root containing
   `ELEVENLABS_API_KEY=…` (key is scoped to text-to-speech + voices:read only).
3. Add `ELEVENLABS_VOICE_ID=…` to `.env` once the owner reports the winning
   voice from the family audition. **That voice is Hope.** Hope is the
   ElevenLabs voice; Karla is the character who speaks in it. They are not two
   characters and not a rename: a work order asking for "Hope everywhere" is
   asking for the recorded voice to reach a screen, not for Karla to be renamed.
   Nothing kid-facing ever says "Hope". **Do not generate audio until the voice id
   is set** — clips in the wrong voice are wasted credits.
4. Never print the key or the raw `.env` in logs, test output, or commits.

## 1 · The generation script — `scripts/generate-voice.mjs`

- Reads `SPEAK` from `@kampus/curriculum`. One API call **per line** (clip per
  line, not per step): line-level clips make the say-it-show-it sync trivial —
  a line's cue fires when its clip starts — and keep every utterance short,
  which is the APD requirement anyway. Character-level timestamps are NOT
  needed in v1; skip `/with-timestamps` unless free.
- Endpoint: `POST /v1/text-to-speech/{ELEVENLABS_VOICE_ID}` with a current
  low-cost model (flash/turbo tier), output `mp3_44100_64`. Mono, small.
- Output layout: `packages/ui/voice/<skill>/<t|m><stepIndex>-<lineIndex>.mp3`
  plus `packages/ui/voice/manifest.json`:
  `{ [skill]: { steps: [[{file, sha}]], more: [[{file, sha}]] } }` where `sha`
  is a hash of the `say` text — regeneration skips lines whose sha is
  unchanged, so a bank patch only pays for the lines it edited.
- `--dry` flag: list what would be generated (skill/step/line counts, total
  characters, estimated credits) with **zero** API calls. Run and commit the
  dry-run output in the PR description before the first real run.
- Voice assets ship in the repo like blobs do: extend the sync step
  (`scripts/sync-blobs.mjs` or a sibling `sync-voice.mjs` on predev/prebuild)
  to copy `packages/ui/voice` → `apps/web/public/voice`. Tranche 1 is ~45
  clips, a few hundred KB total.

## 2 · Playback — the say-it-show-it runner (packages/ui)

In `TeachSteps` / the voice row, when `manifest.json` has clips for the current
step:

- Play the step's line clips **sequentially**. As each line plays: render the
  step's `speakLines` says (small, under the prompt) with the CURRENT line
  highlighted (§0 held/gold tint), and fire its `cue`.
- Cue wiring, minimal v1 (no new animation system): `row.N` reveals walk row N;
  `bar.pieces`/`bar.shade`/`bar.pulse` drive the existing bar states;
  `line.start`/`line.hop`/`line.land` the existing line states; `card.N`
  spotlights a faceoff card (outline pulse); `prompt`/`takeaway`/`pick`
  highlight what they name. Reuse each layout's existing transitions — a cue is
  a trigger, not a new renderer.
- Controls stay the three that exist: **Again** replays the step's lines;
  **Slower** sets `audio.playbackRate = 0.8` (pitch is preserved by default in
  modern browsers) — one rate for voice AND cue pacing, they are one thing;
  **Quiet** stops playback.
- **Fallback**: any step without clips (offline, or a tranche not yet authored)
  keeps today's behavior — speechSynthesis on `step.speak || step.prompt`.
- **The ducking law (APD)**: while a clip plays, nothing else may emit sound,
  and nothing but the active cue may animate. Encode it where the future
  sound-and-juice pass will trip over it — a single `audioBus` owner in ui that
  refuses parallel play.
- **ADHD laws unchanged**: audio NEVER gates. Next's enabled state must be
  byte-identical to today's logic; a kid can tap through with Quiet on.

## 3 · Tests

- Unit (curriculum): `speak.test.js` already pins alignment + cue validity.
- Unit (ui or engine): manifest shape ↔ SPEAK shape (every authored line has a
  clip entry after generation; no orphan clips).
- Webapp spec: on a grade-6 day-1 lesson (eqFrac — tranche 1), the teach step
  renders the speak lines, the voice row offers Again/Slower/Quiet, an
  `<audio>`/playback element exists when the manifest covers the step, and
  **Next's gating is unchanged with audio present**. Can't assert sound in CI;
  assert the wiring.
- Keep `npm test`, build, `test:webapp`, `test:layouts` green as always.

## 4 · Order of work

1. `.gitignore` + `.env` checks (above).
2. `generate-voice.mjs --dry` against tranche 1 — commit nothing yet, report
   counts.
3. Wait for `ELEVENLABS_VOICE_ID` in `.env` (owner's audition).
4. Generate tranche 1, commit clips + manifest.
5. Playback + cues + fallback.
6. Suites, push. beta.mykampus.ai then speaks for the four reference skills —
   the owner's family re-tests on eqFrac (The Kitchen) first.

## Cost

Tranche 1 ≈ 45 lines ≈ 3.5k characters — pennies. Tranches 1-2 came to roughly
20,300 credits of the 30,000-credit promo: tranche 1 cost double because
`output_format` was sent in the body, where ElevenLabs ignores it, and 128 kbps
came back. Tranche 2 was clean. About 9,700 remain against an estimated ~12,000
for the last 37 skills plus the re-teach scripts — see the decisions below.

## Decisions — owner, 5 Nov 2026

**Credits: spend nothing to chase the promo.** The Nov 8 deadline is for new
signups. When tranche 3 lands, generate in priority order — **grades 3-5 first**,
inside the ~9,700 remaining, because the band-a auto-read kids need the voice
most; grade 8 waits for the plan's renewal in ~3 weeks. Nothing kid-facing is
blocked by the split: grades 6-7 are fully voiced and no grade-8 pilot kid exists.

Landed for it: `scripts/voice-plan.mjs` plus `--grades`, `--only` and `--budget`
on the generator. A budget takes **whole skills** in priority order while it
holds and reports what it deferred; it never cuts inside a skill, because half a
skill's clips plays real voice on one step and the robot voice on the next, inside
one lesson. The manifest is rebuilt from the whole bank but lists only clips that
exist on disk, so a partial run neither wipes the skills it skipped nor promises a
clip the budget deferred.

**ReteachView: voice it.** The kid on that panel has just missed the prove-it —
lowest moment in the lesson, most overloaded kid, and the last teaching surface
still silent. Same line clips, same row cues, same both-direction gating law. The
re-teach scripts arrive **inside the tranche-3 bank patch**, so it is one patch,
one generation run, one commit.

Landed ahead of it (everything that does not depend on the scripts):

- `ReteachView` takes `voice` / `muted` / `onEvent`, renders `SayItShowIt` when the
  bank has a script, and handles `row.N` and `prompt`. A row cue **highlights**,
  it does not reveal — the rows are a reference she is reading after a miss, and
  hiding four of them to reveal them one at a time takes information away at the
  worst moment.
- The seam: `year.js` attaches the script to `lesson.reteach` from
  `speakFor(skill).reteach`, accepting either one step or a list of one. The
  generator reads its kinds off the bank, so if tranche 3 names that key something
  else, that one line is the only change needed anywhere.
- Nothing on the panel can be solved, so the gating law here is about `onContinue`:
  no cue, clip or audio state touches it. `tests/test_layouts.mjs` mounts the panel
  silent and scripted and counts the continues — zero without a tap.
- `tests/fixtures/teach-gallery.jsx` carries both panels; `?voice=1` arms the
  scripted one with fake clip paths.

Still not voiced and not in scope: nothing else. After tranche 3 wires in,
re-read this file and the gating gotcha against the code once more before calling
the voice pass complete.

## The renewal generation run — ask for timestamps

When credits renew and the deferred clips are generated (grade 8, subFrac,
unitFracDiv, and the grade-6/7 `reteach` kind), request **character timestamps**
on the new clips and store per-word times in the manifest entry:

```
{ file, sha, dur, words: [{ word, start, end }] }
```

Playback already accepts them. `sweepPlan()` in say-it-show-it.jsx prefers
`meta.words` when its word count matches the line and falls back to the
proportional estimate otherwise, so the sweep becomes exact for the clips that
have timings and keeps working for the ones that do not — no change anywhere
else, and no need to regenerate what is already correct.

Two things to get right when writing it:

- ElevenLabs returns alignment as CHARACTERS, not words. Fold them: a word's
  start is the first character's start, its end the last character's end.
- Mismatched timings are refused by design (a bank edit that changed the words
  but kept the old timings would sweep the wrong words confidently), so after a
  bank patch the affected lines must be regenerated, not just re-timed.

This was deliberately NOT written ahead of the run. The last piece of
unexercised ElevenLabs code in this repo sent `output_format` in the body, where
it is silently ignored, and cost a tranche twice over. Write it against a real
response, with `--dry` first.

## Field tracing — `?voicetrace=1`

The voice path has produced four defects that exist only on a real page: a
reader silencing another component's line, an autoplay that never arms, a sweep
with no boundary events, and an invitation the browser voice never offered.
Three of them cost several rounds of guessing; the one that was traced was named
in a single run.

So the trace ships. Add `?voicetrace=1` to any beta URL and the console logs
every queue claim, autoplay attempt, failure reason, and invitation
arm/fire/withdraw:

```
[voice] 175 queued a read, depth 1
[voice] 175 queue head: clear clip-speaking: false tts-active: false waited: 1
[voice] 175 play (auto) "Wait — look at this firs" clip: false
[voice] 177 tts settle blocked active now 0
[voice] 177 invitation armed by blocked
```

It is off by default and costs nothing when off — one regex against
`location.search`, read once. When a kid's browser does something ours does not,
pull the trace before changing code.

### What the trace answers first

- **`queue head: waiting` forever** — something is stuck speaking. The numbers
  say which: `clip-speaking` is the audio bus, `tts-active` the utterance count.
- **No `play (auto)` line at all** — the effect never ran, or its condition was
  false (band, muted, or an owner that is not reading).
- **`play (auto)` then nothing** — the voice accepted it and said nothing back;
  look for `tts start` and whether the chosen voice is `local: false`.

## Coming from the owner's session (not yours to write)

- Tranche 3 of `speak.js`: the remaining 37 skills plus the re-teach scripts, same
  language laws, same tryIt rule. It lands in the working tree like tranche 2 did
  — `speak.js` and `speak.test.js`, manifest tests red until the generation run
  turns them green. Roughly 12,000 characters expected; `--dry` gives the number.
