/* Karla's clips — the voice generator (docs/VOICE_PASS.md §1).

   One API call per LINE, not per step. Line-level clips make say-it-show-it sync
   trivial — a line's cue fires when its clip starts — and keep every utterance
   short, which is the auditory-processing requirement anyway.

   Regeneration is content-addressed: each line's `say` text is hashed into the
   manifest, so a bank patch pays only for the lines it actually edited. Bank
   tranches land as changes to speak.js alone and nothing here needs touching when
   they do — including a tranche that adds a NEW KIND of script (the re-teach
   scripts coming in tranche 3): the kinds are read off the bank, not listed.

   Usage:
     node scripts/generate-voice.mjs --dry              counts and cost, ZERO api calls
     node scripts/generate-voice.mjs                    generate what changed
     node scripts/generate-voice.mjs --force            regenerate everything
     node scripts/generate-voice.mjs --grades 3,4,5     only those grades
     node scripts/generate-voice.mjs --only eqFrac      only those skills
     node scripts/generate-voice.mjs --budget 9700      stop before spending more
                                                        than that many credits

   `--budget` exists because credits run out mid-bank. It takes whole skills in
   priority order (youngest grade first) while the budget holds and reports what it
   deferred; it never cuts inside a skill, because a half-voiced skill plays clips
   on one step and the robot voice on the next, inside one lesson.

   Secrets: ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID come from .env at the repo
   root, which is gitignored. Neither is ever printed — not in logs, not in
   errors, not in the manifest. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPEAK } from '@kampus/curriculum';
import { plan, stale, select, buildManifest, flags } from './voice-plan.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = path.join(ROOT, 'packages/ui/voice');
const MANIFEST = path.join(OUT, 'manifest.json');

const { dry: DRY, force: FORCE, grades, only, budget } = flags(process.argv.slice(2));
/* Mono-ish 64 kbps is plenty for a voice and halves what a kid on a phone
   downloads (docs/VOICE_PASS.md §1). Verified in the written files, not assumed:
   see the bitrate check in scripts/check-voice.mjs. */
const FORMAT = 'mp3_44100_64';

/* ---- .env, read here rather than depending on a dotenv package ------------- */
function env() {
  const file = path.join(ROOT, '.env');
  const out = { ...process.env };
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

const onDisk = (file) => existsSync(path.join(OUT, file));
const loadManifest = () => (existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {});

async function speak(row, { key, voice, model }) {
  // output_format is a QUERY parameter, not a body field. Sent in the body it is
  // silently ignored and the account default (128 kbps) comes back instead — which
  // is how the first run produced clips at twice the size the work order asked for.
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=${FORMAT}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({
      text: row.say,
      model_id: model,
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!res.ok) {
    // The body can echo request details; the status is what is useful and what is
    // safe to print. Never surface headers.
    throw new Error(`ElevenLabs returned ${res.status} for ${row.file}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const dest = path.join(OUT, row.file);
  mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, buf);
  return buf.length;
}

/* ---- run ------------------------------------------------------------------- */
const rows = plan(SPEAK);                 // the whole bank, in priority order
const manifest = loadManifest();
const changed = stale(rows, manifest, { force: FORCE, exists: onDisk });
const { take: todo, deferred } = select(changed, { grades, only, budget });

const chars = (set) => set.reduce((n, r) => n + r.say.length, 0);
const skillsIn = (set) => [...new Set(set.map(r => r.skill))];

/* By grade, because that is the order credits are spent in. */
const byGrade = new Map();
for (const r of rows) {
  const g = byGrade.get(r.grade) || { skills: new Set(), lines: 0, chars: 0, todo: 0, todoChars: 0 };
  g.skills.add(r.skill); g.lines++; g.chars += r.say.length;
  byGrade.set(r.grade, g);
}
for (const r of todo) {
  const g = byGrade.get(r.grade);
  g.todo++; g.todoChars += r.say.length;
}

console.log(`\nSpeak bank: ${Object.keys(SPEAK).length} skills authored, ${rows.length} lines\n`);
console.log('  grade  skills  lines   chars   to generate');
for (const g of [...byGrade.keys()].sort((a, b) => a - b)) {
  const s = byGrade.get(g);
  console.log(`  ${String(g === 99 ? '—' : g).padStart(5)}  ${String(s.skills.size).padStart(6)}  `
    + `${String(s.lines).padStart(5)}  ${String(s.chars).padStart(6)}   ${s.todo ? `${s.todo} lines · ${s.todoChars} chars` : '—'}`);
}

const kinds = [...new Set(rows.map(r => r.kind))];
const longest = rows.reduce((a, b) => (a.say.length > b.say.length ? a : b), { say: '', file: '—' });
console.log(`\n  script kinds in the bank: ${kinds.join(', ')}`);
console.log(`  longest line ${longest.say.length} chars (${longest.file})`);
if (grades.length || only.length || budget) {
  console.log(`  filters: ${[grades.length ? `grades ${grades.join(',')}` : null,
    only.length ? `only ${only.join(',')}` : null, budget ? `budget ${budget}` : null].filter(Boolean).join(' · ')}`);
}
console.log(`  to generate  ${todo.length} lines · ${chars(todo)} chars · ${skillsIn(todo).length} skills${FORCE ? ' (--force)' : ''}`);
if (deferred.length) {
  console.log(`  deferred     ${deferred.length} lines · ${chars(deferred)} chars · ${skillsIn(deferred).length} skills`
    + ` (${skillsIn(deferred).slice(0, 6).join(', ')}${skillsIn(deferred).length > 6 ? ', …' : ''})`);
}
// ElevenLabs bills one credit per character on the flash/turbo tiers.
console.log(`  est. credits ${chars(todo)}\n`);

if (DRY) {
  console.log('--dry: no API calls made, nothing written.\n');
  process.exit(0);
}

const e = env();
const key = e.ELEVENLABS_API_KEY;
const voice = e.ELEVENLABS_VOICE_ID;
const model = e.ELEVENLABS_MODEL || 'eleven_flash_v2_5';

if (!key) { console.error('ELEVENLABS_API_KEY is not set (.env at the repo root). Nothing generated.'); process.exit(2); }
if (!voice) {
  // The work order is explicit: clips in the wrong voice are wasted credits.
  console.error('ELEVENLABS_VOICE_ID is not set. Waiting on the family audition — run --dry until it is.');
  process.exit(2);
}
if (!todo.length) { console.log('Everything is current. Nothing to do.\n'); process.exit(0); }

let bytes = 0;
for (const [i, row] of todo.entries()) {
  process.stdout.write(`  [${i + 1}/${todo.length}] ${row.file} … `);
  bytes += await speak(row, { key, voice, model });
  console.log('ok');
}
mkdirSync(OUT, { recursive: true });
// The full plan, filtered to clips that are actually on disk: a budgeted or
// grade-filtered run leaves the skills it skipped unvoiced rather than listed.
writeFileSync(MANIFEST, `${JSON.stringify(buildManifest(rows, { exists: onDisk }), null, 2)}\n`);
const unvoiced = Object.keys(SPEAK).filter(s => !skillsIn(rows.filter(r => onDisk(r.file))).includes(s));
console.log(`\nWrote ${todo.length} clips (${(bytes / 1024).toFixed(0)} KB) and manifest.json`);
if (unvoiced.length) console.log(`Still unvoiced (falls back to speechSynthesis): ${unvoiced.length} skills — ${unvoiced.join(', ')}`);
console.log('');
