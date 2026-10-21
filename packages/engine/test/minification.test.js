/* The production build must resolve every skill the bank sequences.

   This suite exists because of a shipped bug: skill-index resolved generators by
   `fn.name`, a bundler's minifier renames functions, and so EVERY lesson came back
   empty in the production build while dev, vitest and CI were all green. Nothing in
   the ordinary suite could see it, because vitest does not minify.

   Two layers protect it now and both are tested here:
     1. explicit object-literal registries (R, EXPANSION_GENERATORS), whose keys are
        strings and survive any bundler;
     2. esbuild `keepNames` in apps/web/vite.config.js, which covers the generators
        that only exist as factory output (multFactG(9) returns a function named
        multFact — there is no standalone binding to list).
   Layer 2 is a build flag someone could delete, so its necessity is asserted. */
import { describe, it, expect } from 'vitest';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { YEAR } from '@kampus/curriculum';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const bankSkills = [...new Set(Object.keys(YEAR).flatMap(g => YEAR[g].flatMap(u => u.skills || [])))];

/** Bundle the skill index the way a build would, then ask it to resolve each skill. */
async function resolveUnder({ minify, keepNames }) {
  const out = await build({
    entryPoints: ['packages/engine/src/skill-index.js'],
    absWorkingDir: root, bundle: true, minify, keepNames,
    format: 'esm', write: false, platform: 'neutral',
  });
  const b64 = Buffer.from(out.outputFiles[0].text).toString('base64');
  const mod = await import(`data:text/javascript;base64,${b64}`);
  return bankSkills.filter(s => !mod.hasGenerator(s));
}

describe('the shipping bundle can still teach', () => {
  it('resolves every bank skill unminified', async () => {
    expect(await resolveUnder({ minify: false, keepNames: false })).toEqual([]);
  }, 30000);

  it('resolves every bank skill as the web app actually builds it (minified + keepNames)', async () => {
    expect(await resolveUnder({ minify: true, keepNames: true })).toEqual([]);
  }, 30000);

  it('keepNames is load-bearing — without it, factory-made generators are lost', async () => {
    // Not a wish: if this ever comes back empty, the flag is no longer needed and the
    // comment in vite.config.js should be revisited. While it is non-empty, the flag
    // is the only thing standing between production and empty lessons.
    const lost = await resolveUnder({ minify: true, keepNames: false });
    expect(lost.length).toBeGreaterThan(0);
  }, 30000);

  it('the web build sets keepNames', () => {
    const cfg = readFileSync(new URL('../../../apps/web/vite.config.js', import.meta.url), 'utf8');
    expect(cfg).toMatch(/keepNames:\s*true/);
  });
});
