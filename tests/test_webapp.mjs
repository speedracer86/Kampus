/* The end-to-end runner.

   This file used to be the whole suite: 1,300 lines and twenty sections in one
   `try`, run strictly in order. At 149 checks it took longer than a two-minute
   foreground run, which is the point where a suite stops being something you run
   and starts being something you schedule.

   So the checks moved to tests/webapp/*.spec.mjs and the machinery to
   tests/webapp/harness.mjs. The specs are independent — each opens its own pages,
   and a Playwright page carries its own storage — so they run CONCURRENTLY against
   one static host and one browser. Each buffers its own output and the runner
   prints it as a block when that spec lands, because five specs writing to stdout
   at once is unreadable.

   The summary line is unchanged on purpose: CI greps it, and so do I.

   Usage: npm run test:webapp     (PW_CHROME points at an existing Chromium) */
import { start, stop, createCheck, pageErrors } from './webapp/harness.mjs';

const SPECS = ['core', 'business', 'onboarding', 'teach', 'money'];

/** Run only the specs named on the command line, or all of them. */
const only = process.argv.slice(2).filter(a => !a.startsWith('-'));
const chosen = only.length ? SPECS.filter(s => only.includes(s)) : SPECS;
if (only.length && chosen.length !== only.length) {
  console.error(`Unknown spec(s): ${only.filter(o => !SPECS.includes(o)).join(', ')}`);
  console.error(`Available: ${SPECS.join(', ')}`);
  process.exit(2);
}

const results = [];
const started = Date.now();
await start();

try {
  await Promise.all(chosen.map(async (name) => {
    const { check, results: own, lines } = createCheck();
    const t0 = Date.now();
    let crashed = null;
    try {
      const { default: run } = await import(`./webapp/${name}.spec.mjs`);
      await run(check);
    } catch (e) {
      // A spec that throws must fail loudly rather than silently contributing
      // nothing — an empty block looks exactly like a spec with no checks.
      crashed = e;
      check(`${name}: the spec ran to the end`, false, String(e?.message || e).slice(0, 160));
    }
    const failed = own.filter(r => !r.ok).length;
    console.log(`\n── ${name} ${'─'.repeat(Math.max(0, 28 - name.length))} ${own.length - failed}/${own.length} · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    console.log(lines.join('\n'));
    if (crashed) console.error(crashed);
    results.push(...own);
  }));

  const { check } = createCheck();
  const tail = [];
  const aggregate = (name, ok, detail = '') => {
    results.push({ name, ok, detail });
    tail.push(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  };
  aggregate('no uncaught page errors anywhere', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '));
  console.log(`\n── all specs ─────────────────`);
  console.log(tail.join('\n'));
} finally {
  await stop();
}

const failed = results.filter(r => !r.ok);
console.log(`\nWEBAPP E2E: ${results.length - failed.length}/${results.length} passed · ${((Date.now() - started) / 1000).toFixed(1)}s`);
if (failed.length) { console.error('FAILED:', failed.map(f => f.name).join(', ')); process.exit(1); }
