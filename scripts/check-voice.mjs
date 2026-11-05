/* Verify the generated clips are what we asked for.

   The first run silently produced 128 kbps because `output_format` was sent in the
   JSON body, where ElevenLabs ignores it. Nothing failed, nothing warned, and the
   only symptom was a directory twice the size it should have been — so the format
   is now read back out of the files rather than trusted.

   Usage: node scripts/check-voice.mjs */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const VOICE = path.join(ROOT, 'packages/ui/voice');
const MANIFEST = path.join(VOICE, 'manifest.json');
const WANT_KBPS = 64;

const BITRATES = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
const RATES = [44100, 48000, 32000];

/** Read the first MPEG frame header out of an mp3. */
function mp3Info(file) {
  const b = readFileSync(file);
  let i = b.indexOf(0xff);
  while (i >= 0 && i + 3 < b.length && (b[i + 1] & 0xe0) !== 0xe0) i = b.indexOf(0xff, i + 1);
  if (i < 0) return null;
  return {
    kbps: BITRATES[(b[i + 2] >> 4) & 0xf],
    hz: RATES[(b[i + 2] >> 2) & 0x3],
    bytes: b.length,
  };
}

if (!existsSync(MANIFEST)) {
  console.error('No manifest. Run scripts/generate-voice.mjs first.');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const listed = [];
for (const [skill, entry] of Object.entries(manifest)) {
  // Every kind the manifest carries, not a list of the kinds that existed when
  // this was written. Listed, it called tranche 3's whole `reteach` kind eleven
  // orphan clips: the manifest was right and the checker was blind to it. The
  // generator and the manifest guard read their kinds off the data for the same
  // reason (scripts/voice-plan.mjs).
  for (const kind of Object.keys(entry)) {
    (entry[kind] || []).forEach(step => (step || []).forEach(line => listed.push({ skill, ...line })));
  }
}

const onDisk = [];
for (const dir of readdirSync(VOICE)) {
  const full = path.join(VOICE, dir);
  if (!statSync(full).isDirectory()) continue;
  for (const f of readdirSync(full)) if (f.endsWith('.mp3')) onDisk.push(`${dir}/${f}`);
}

const problems = [];
let bytes = 0;

for (const row of listed) {
  const file = path.join(VOICE, row.file);
  if (!existsSync(file)) { problems.push(`missing: ${row.file}`); continue; }
  const info = mp3Info(file);
  if (!info) { problems.push(`not an mp3: ${row.file}`); continue; }
  bytes += info.bytes;
  if (info.kbps !== WANT_KBPS) problems.push(`${row.file}: ${info.kbps} kbps, wanted ${WANT_KBPS}`);
  if (info.bytes < 1000) problems.push(`${row.file}: ${info.bytes} bytes — too small to be speech`);
}

const orphans = onDisk.filter(f => !listed.some(r => r.file === f));
orphans.forEach(f => problems.push(`orphan clip, in no manifest entry: ${f}`));

console.log(`\n  manifest lines ${listed.length}`);
console.log(`  clips on disk  ${onDisk.length}`);
console.log(`  total size     ${(bytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`  bitrate        ${WANT_KBPS} kbps expected\n`);

if (problems.length) {
  console.error(`${problems.length} problem(s):`);
  for (const p of problems.slice(0, 12)) console.error(`  ${p}`);
  process.exit(1);
}
console.log('  all clips present, correct format, no orphans\n');
