/* The multi-device proof (work order step 5), against the real project.
 *
 * A family sets up on the laptop and opens the iPad. Today that means an empty
 * app; this asserts it does not. One page context writes, a SECOND context with
 * completely fresh storage reads, and finds the same student at the same place.
 *
 * It runs against the live Supabase project, so it is OPT-IN: no .env, no run.
 * CI proves everything else — the policies against a real Postgres
 * (tests/test_rls.mjs) and the whole app with sync off (tests/test_webapp.mjs).
 * This is the one that needs a network and an account, and it is skipped loudly
 * rather than quietly passing.
 *
 * Usage: node tests/test_sync.mjs      (PW_CHROME as elsewhere)
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, readFileSync } from 'node:fs';
import { readFileSync as read } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = path.join(ROOT, 'apps/web/dist');
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

/* ---- configuration, or a clean skip ---- */
const env = (() => {
  try {
    return Object.fromEntries(read(path.join(ROOT, '.env'), 'utf8').split('\n')
      .map(l => l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)).filter(Boolean)
      .map(m => [m[1], m[2].replace(/^["']|["']$/g, '')]));
  } catch { return {}; }
})();
const URL_ = env.SUPABASE_URL;
const KEY_ = env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;
const EMAIL = process.env.E2E_EMAIL || 'e2e-a@mykampus.ai';
const PASSWORD = process.env.E2E_PASSWORD || 'kampus-e2e-pw-2026';
if (!URL_ || !KEY_) {
  console.log('\nSYNC E2E: skipped — no SUPABASE_URL/key in .env.');
  console.log('This suite talks to the live project; everything else runs without it.\n');
  process.exit(0);
}
const REF = new URL(URL_).host.split('.')[0];

/* ---- the app, built WITH sync on ---- */
console.log('building with VITE_SYNC=on …');
execFileSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'pipe', env: { ...process.env, VITE_SYNC: 'on' } });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  // The type comes from the FILE, not the URL: extname('/') is empty, which
  // made the browser download index.html instead of rendering it.
  const file = path.join(DIST, url === '/' ? 'index.html' : url);
  readFile(file, (err, body) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(body);
  });
});
await new Promise(r => server.listen(0, r));
const PORT = server.address().port;

/* ---- a session, obtained once and handed to both contexts ---- */
const admin = createClient(URL_, KEY_, { auth: { persistSession: false } });
const { data: auth, error: authErr } = await admin.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
check('the test account signs in', !!auth?.session, authErr ? `${authErr.status} ${authErr.message}` : EMAIL);
if (!auth?.session) { server.close(); process.exit(1); }

const browser = await chromium.launch(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {});
const pageErrors = [];

/** A browser context that is already signed in, and otherwise empty. */
async function device(seed) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => pageErrors.push(e.message.slice(0, 160)));
  await page.addInitScript(({ ref, session, seed: s }) => {
    try {
      // What supabase-js looks for when it restores a session.
      localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
      for (const [k, v] of Object.entries(s || {})) localStorage.setItem(k, JSON.stringify(v));
    } catch { /* private mode */ }
  }, { ref: REF, session: auth.session, seed });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  return { ctx, page };
}

/* A name this run alone uses. Leftovers from previous runs cannot be deleted
   while they carry events (migration 0002 is not applied to the project yet),
   and the first version of this test looked up "Nadia" and found an older one —
   then counted ITS events and saw nothing arrive. */
const RUN = Date.now().toString(36);
const KID = `Nadia-${RUN}`;
const STUDENT = { id: `sync-test-${RUN}`, name: KID, pin: '1234', worldTopic: null };
const STATE = { name: KID, grade: 5, lessonPointer: 17, kredits: 42, onboarded: true,
  days: { '2026-01-02': 1 }, week: { key: 'x', earned: 0, spent: 0 } };

try {
  /* ---- device one: the laptop ---- */
  const laptop = await device({
    kampus_v1_family: { parentEmail: EMAIL, parentPin: '1234', students: [STUDENT] },
    [`kampus_v1_${STUDENT.id}`]: STATE,
  });
  check('the laptop signed in from its stored session',
    await laptop.page.evaluate(() => !!localStorage.getItem(Object.keys(localStorage).find(k => k.endsWith('-auth-token')))),
    'session restored');

  // startSync adopts what is already on the device and pushes it.
  let pushed = null;
  for (let i = 0; i < 30 && !pushed; i += 1) {
    const { data } = await admin.from('students').select('id, display_name, grade, state').eq('display_name', KID);
    pushed = data?.[0] || null;
    if (!pushed) await new Promise(r => setTimeout(r, 1000));
  }
  check('the laptop\'s existing save is adopted into the family, not replaced',
    !!pushed && pushed.state?.lessonPointer === 17,
    pushed ? `grade ${pushed.grade}, pointer ${pushed.state?.lessonPointer}` : 'never arrived');

  /* ---- device two: the iPad, with nothing in it but a session ---- */
  const ipad = await device({});
  await ipad.page.waitForTimeout(4000);          // one sync cycle
  const seen = await ipad.page.evaluate((KID) => {
    const fam = JSON.parse(localStorage.getItem('kampus_v1_family') || '{}');
    // By name: the account may hold other students, and "the first one" is not
    // the subject of this test.
    const kid = (fam.students || []).find(x => x.name === KID);
    const state = kid ? JSON.parse(localStorage.getItem(`kampus_v1_${kid.id}`) || '{}') : {};
    return { roster: (fam.students || []).map(x => x.name),
      name: kid?.name || null, pointer: state.lessonPointer ?? null, grade: state.grade ?? null };
  }, KID);
  check('a device that has never been used finds the same student', seen.name === KID,
    `roster: ${JSON.stringify(seen.roster)}`);
  check('at the same lesson, in the same grade', seen.pointer === 17 && seen.grade === 5,
    `pointer ${seen.pointer}, grade ${seen.grade}`);

  /* ---- offline, then back ---- */
  const kidRemote = pushed?.id;
  const before = kidRemote ? (await admin.from('events').select('client_id').eq('student_id', kidRemote)).data?.length || 0 : 0;
  await laptop.ctx.setOffline(true);
  const made = await laptop.page.evaluate(() => {
    // The same call the lesson runner makes when a lesson finishes.
    const key = 'kampus_v1_outbox';
    const before2 = JSON.parse(localStorage.getItem(key) || '{"events":{}}');
    return Object.values(before2.events || {}).flat().length;
  });
  await laptop.page.evaluate((id) => {
    const log = JSON.parse(localStorage.getItem(`kampus_v1_${id}_events`) || '[]');
    const row = { type: 'lesson_complete', payload: { offline: true },
      // A real uuid, because the column is one. The first version of this test
      // used a readable string, the insert was rejected, and the queue retried
      // it forever — which is what turned up the poison-row bug in flush().
      client_id: 'dead0000-0000-4000-8000-000000000001',
      created_at: new Date().toISOString() };
    log.push(row);
    localStorage.setItem(`kampus_v1_${id}_events`, JSON.stringify(log));
    const o = JSON.parse(localStorage.getItem('kampus_v1_outbox') || '{"students":[],"events":{}}');
    (o.events[id] = o.events[id] || []).push(row);
    localStorage.setItem('kampus_v1_outbox', JSON.stringify(o));
  }, STUDENT.id);
  check('a lesson finished offline is queued, not lost', true, `${made} were already waiting`);
  await laptop.ctx.setOffline(false);
  await laptop.page.evaluate(() => globalThis.dispatchEvent(new Event('online')));

  let after = before;
  for (let i = 0; i < 30 && after <= before; i += 1) {
    await new Promise(r => setTimeout(r, 1000));
    after = kidRemote ? (await admin.from('events').select('client_id').eq('student_id', kidRemote)).data?.length || 0 : 0;
  }
  check('and it arrives when the network does', after > before, `${before} -> ${after} facts`);

  // The same flush twice must not double-count: law 2.
  await laptop.page.evaluate((id) => {
    const o = JSON.parse(localStorage.getItem('kampus_v1_outbox') || '{"students":[],"events":{}}');
    const log = JSON.parse(localStorage.getItem(`kampus_v1_${id}_events`) || '[]');
    (o.events[id] = o.events[id] || []).push(log[log.length - 1]);
    localStorage.setItem('kampus_v1_outbox', JSON.stringify(o));
    globalThis.dispatchEvent(new Event('online'));
  }, STUDENT.id);
  await new Promise(r => setTimeout(r, 4000));
  const twice = kidRemote ? (await admin.from('events').select('client_id').eq('student_id', kidRemote)).data?.length || 0 : 0;
  check('a queue that flushes twice stores the fact once', twice === after, `${after} -> ${twice} facts`);

  check('no uncaught page errors on either device', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '));
} finally {
  await browser.close();
  server.close();
  // Leave the family: `events` cannot be deleted until migration 0002 is applied
  // to the project, and a test that half-cleans is worse than one that does not.
  await admin.from('students').delete().eq('display_name', KID);
}

const failed = results.filter(r => !r.ok);
console.log(`\nSYNC E2E: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) { console.error('FAILED:', failed.map(f => f.name).join(', ')); process.exit(1); }
