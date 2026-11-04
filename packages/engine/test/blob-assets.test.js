/* Blob illustrations must carry their own colours.

   The handoff's SVGs style their shapes with classes (`class="st0"`) defined in a
   `<style>` block inside `<defs>`. Several arrived with the classes and WITHOUT the
   block, so every shape fell back to black — a silhouette where an illustration
   should be, with nothing in the console and nothing in any test to say so.

   Three were unrecoverable and were dropped (docs/ASSETS.md). Target.svg survived
   that sweep because nothing I had screenshotted happened to show it, and it then
   shipped black on the placement intro and both onboarding steps until the owner
   caught it. This is the check that would have caught it instead. */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BLOBS = new URL('../../ui/blobs/', import.meta.url).pathname;
const files = readdirSync(BLOBS).filter(f => f.endsWith('.svg'));

describe('every blob can actually render in colour', () => {
  it('has blobs at all', () => expect(files.length).toBeGreaterThan(50));

  it('never references a class it does not define', () => {
    const broken = files.filter(f => {
      const svg = readFileSync(join(BLOBS, f), 'utf8');
      const used = [...svg.matchAll(/class="([^"]+)"/g)].flatMap(m => m[1].split(/\s+/));
      if (!used.length) return false;
      const styled = svg.match(/<style[\s\S]*?<\/style>/);
      if (!styled) return true;                       // classes with no style block
      return used.some(c => !styled[0].includes(`.${c}`));
    });
    expect(broken, `these would render as black silhouettes: ${broken.join(', ')}`).toEqual([]);
  });

  it('defines a fill for something, not just geometry', () => {
    const colourless = files.filter(f => {
      const svg = readFileSync(join(BLOBS, f), 'utf8');
      return !/fill\s*[:=]\s*['"]?#|fill="[a-z]/i.test(svg);
    });
    expect(colourless, `no fill anywhere: ${colourless.join(', ')}`).toEqual([]);
  });
});
