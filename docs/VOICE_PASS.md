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
   voice from the family audition. **Do not generate audio until the voice id
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

Tranche 1 ≈ 45 lines ≈ 3.5k characters — pennies. The full 79-skill bank fits
comfortably inside the 30,000-credit $1 promo the owner's account is showing
(ends Nov 8) — take that before it lapses.

## Coming from the owner's session (not yours to write)

- Tranches 2+ of `speak.js` (grades 6+7 next, then 3–5 and 8) — speak-script
  authoring is bank content and stays owner-authored like all of
  `packages/curriculum`.
- A decision on voicing the re-teach / plan-B panels (ReteachView is rows, not
  TeachSteps — likely tranche 3).
