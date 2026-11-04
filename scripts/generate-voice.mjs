/* Karla's clips — the voice generator (docs/VOICE_PASS.md §1).

   One API call per LINE, not per step. Line-level clips make say-it-show-it sync
   trivial — a line's cue fires when its clip starts — and keep every utterance
   short, which is the auditory-processing requirement anyway.

   Regeneration is content-addressed: each line's `say` text is hashed into the
   manifest, so a bank patch pays only for the lines it actually edited. The other
   seventy-five skills land as changes to speak.js alone and nothing here needs
   touching when they do.

   Usage:
     node scripts/generate-voice.mjs --dry     counts and cost, ZERO api calls
     node scripts/generate-voice.mjs           generate what changed
     node scripts/generate-voice.mjs --force   regenerate everything

   Secrets: ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID come from .env at the repo
   root, which is gitignored. Neither is ever printed — not in logs, not in
   errors, not in the manifest. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPEAK } from '@kampus/curriculum';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = path.join(ROOT, 'packages/ui/voice');
const MANIFEST = path.join(OUT, 'manifest.json');

const DRY = process.argv.includes('--dry');
const FORCE = process.argv.includes('--force');
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

const sha = (text) => createHash('sha256').update(text).digest('hex').slice(0, 16);

/** Every line in the bank, flattened with the path it will be written to. */
function plan() {
  const rows = [];
  for (const [skill, entry] of Object.entries(SPEAK)) {
    for (const [kind, prefix] of [['steps', 't'], ['more', 'm']]) {
      (entry[kind] || []).forEach((step, si) => {
        (step.lines || []).forEach((line, li) => {
          rows.push({
            skill, kind, stepIndex: si, lineIndex: li,
            say: line.say, cue: line.cue,
            file: `${skill}/${prefix}${si}-${li}.mp3`,
            sha: sha(line.say),
          });
        });
      });
    }
  }
  return rows;
}

const loadManifest = () => (existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {});

/** Rebuild the manifest from the plan, preserving nothing stale. */
function buildManifest(rows) {
  const m = {};
  for (const r of rows) {
    m[r.skill] = m[r.skill] || { steps: [], more: [] };
    const arr = m[r.skill][r.kind];
    arr[r.stepIndex] = arr[r.stepIndex] || [];
    arr[r.stepIndex][r.lineIndex] = { file: r.file, sha: r.sha };
  }
  return m;
}

/** Lines whose text changed since the last run (or all, with --force). */
function stale(rows, manifest) {
  if (FORCE) return rows;
  return rows.filter(r => {
    const got = manifest[r.skill]?.[r.kind]?.[r.stepIndex]?.[r.lineIndex];
    if (!got || got.sha !== r.sha) return true;
    return !existsSync(path.join(OUT, r.file));     // manifest says done, file is gone
  });
}

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
const rows = plan();
const manifest = loadManifest();
const todo = stale(rows, manifest);
const chars = rows.reduce((n, r) => n + r.say.length, 0);
const todoChars = todo.reduce((n, r) => n + r.say.length, 0);

const bySkill = {};
for (const r of rows) {
  bySkill[r.skill] = bySkill[r.skill] || { lines: 0, chars: 0, steps: new Set() };
  bySkill[r.skill].lines++;
  bySkill[r.skill].chars += r.say.length;
  bySkill[r.skill].steps.add(`${r.kind}${r.stepIndex}`);
}

console.log(`\nSpeak bank: ${Object.keys(SPEAK).length} skills authored\n`);
for (const [skill, s] of Object.entries(bySkill)) {
  console.log(`  ${skill.padEnd(10)} ${String(s.steps.size).padStart(2)} steps · ${String(s.lines).padStart(3)} lines · ${String(s.chars).padStart(5)} chars`);
}
const longest = rows.reduce((a, b) => (a.say.length > b.say.length ? a : b));
console.log(`\n  total        ${rows.length} lines · ${chars} chars`);
console.log(`  longest line ${longest.say.length} chars (${longest.file})`);
console.log(`  to generate  ${todo.length} lines · ${todoChars} chars${FORCE ? ' (--force)' : ''}`);
// ElevenLabs bills one credit per character on the flash/turbo tiers.
console.log(`  est. credits ${todoChars} (~${(todoChars / 30000 * 100).toFixed(1)}% of a 30,000 promo)\n`);

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
writeFileSync(MANIFEST, `${JSON.stringify(buildManifest(rows), null, 2)}\n`);
console.log(`\nWrote ${todo.length} clips (${(bytes / 1024).toFixed(0)} KB) and manifest.json\n`);
