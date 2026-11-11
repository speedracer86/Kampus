# Kampus: Polish round, task packet for Claude Code / Cowork (Oct 21 2026)

Hand this file plus the whole `design_handoff_kampus/` folder to Claude Code (implementation) or Cowork (planning and review). Repo: `speedracer86/Kampus` (main). UI lives in `packages/ui/src/`, logic in `packages/engine/`, curriculum in `packages/curriculum/`.

## Read first
1. `STYLE_GUIDE.md` **§0** (binding visual direction) and **§0b** (this round's specs).
2. `Polish.dc.html`: open it in a browser with `support.js` next to it. Artboards 16a–20b are clickable. "State & data per screen" at the bottom has the data shapes.
3. `README.md` → "Polish round" for the wiring summary.

The HTML files are **design references**, not production code. Rebuild them in the existing React app with `packages/ui/src/tokens.js` + `primitives.jsx`. Don't add new colors: every value is already in §0 or §0b.

## Rules that must survive implementation
- No timers on questions. Blitz is opt-in only.
- Wrong answers cost nothing. Copy: "Not yet. Here is the step: …"
- Real money is paid for effort only, never for scores.
- Never say "Common Core". Say "covers everything your state expects for grade N."
- Grade 7–8 is the band to nail. Nothing may read "for little kids".

---

## Status (Oct 2026)

Every task in this packet is done and the sections are removed; what shipped is
recorded in `packages/ui/CHANGES.md` under "Round 3", and the ROUND3.md work order
that scheduled them has been deleted.

- **Task 0** world rename — one string table in `tokens.js`, grep to zero.
- **Task 1** teach steps — the four layouts, takeaway band, notes and voice bands in
  `packages/ui/src/teach-layouts.jsx`. Authoring stayed split as ROUND3 directed: four
  authored reference skills, every other panel converted mechanically from the bank.
  **Closed Oct 23**: the bank owner delivered authored steps for all 75 remaining
  skills plus a depth pass (a second worked example per skill, and plan-B
  representations for ten wall skills). No skill is on the mechanical fallback now;
  the converter stays only as a safety net for a future unauthored skill.
- **Task 2** week plan — from the real 128-day sequence.
- **Task 3** grade stack — placed ≠ passed, the earlier-grades fold, graduation.
- **Task 4** wishlist tiles — plus `workers/preview/`, which is scaffolded and
  committed; **deploying it is the owner's step**, and until then every tile takes the
  documented 4s miss path, which the e2e checks.
- **Also open** — `pin-gate.jsx` is restyled to §0a and now wraps the shared `PinPad`.
  The three broken blobs were dropped rather than recolored: their class meanings
  differ per file and the deliverable's copies are equally broken, so the original
  colours are not recoverable. See `docs/ASSETS.md`.

Two §0a/§0b values were overridden where they conflicted with §0, both after looking
at a rendered screenshot; the reasons are in `CHANGES.md`.
