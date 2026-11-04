/* Every measured event must have something that emits it.

   This exists because six names sat in EVENTS for weeks with no emitter anywhere:
   stand_open, day_closed, approve, earn, snag_shown, field_submitted. A metric
   whose event nobody records does not read "no data" — it reads ZERO, which on a
   parent-facing weekly report is not a gap but a false statement about a kid who
   may have done everything asked of her.

   The vocabulary is a promise to record. This checks the promise is kept, and
   forces anything still unrecorded to be declared here with a reason rather than
   quietly reading zero. */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { EVENTS } from '../src/metrics.js';

const ROOT = new URL('../../../', import.meta.url).pathname;
const SOURCES = ['apps/web/src', 'packages/ui/src'];

/**
 * Names with no emitter yet, each with the reason. Shrinking this list is the
 * point; adding to it requires saying why in the same breath.
 */
const NOT_YET_EMITTED = {
  // The field-assignment feature has an engine (field.js: ASSIGNMENTS,
  // weeklyAssignment, buildFieldQuestion) and no screen whatsoever, so there is
  // nowhere honest to emit this from. Tracked in docs/PRODUCT_AUDIT.md.
  field_submitted: 'the field-assignment feature has no screen yet',
};

const files = [];
const walk = (p) => {
  for (const e of readdirSync(p)) {
    const full = join(p, e);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(js|jsx)$/.test(e)) files.push(full);
  }
};
SOURCES.forEach(s => walk(join(ROOT, s)));
// Comments and HANDLERS are not emitters. `if (type === 'ask')` reads an event;
// it does not produce one, and counting it let an unrecorded event look covered.
const source = files.map(f => readFileSync(f, 'utf8')).join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*/g, '')
  .replace(/type\s*===\s*['`][a-z_]+['`]/g, '');

describe('the event vocabulary is a promise to record', () => {
  it('emits every event it claims to measure', () => {
    const missing = Object.values(EVENTS).filter(name => {
      if (NOT_YET_EMITTED[name]) return false;
      // Emitted either as a stored type or through a component's onEvent.
      return !new RegExp(`['\`]${name}['\`]`).test(source);
    });
    expect(missing, `no emitter for: ${missing.join(', ')}`).toEqual([]);
  });

  it('declares anything it cannot record yet, with a reason', () => {
    for (const [name, why] of Object.entries(NOT_YET_EMITTED)) {
      expect(Object.values(EVENTS), `${name} is declared unemitted but is not in EVENTS`).toContain(name);
      expect(why.length, `${name} needs a reason`).toBeGreaterThan(10);
    }
  });

  it('does not let a name sit in the unemitted list once it IS emitted', () => {
    const stale = Object.keys(NOT_YET_EMITTED).filter(name => new RegExp(`['\`]${name}['\`]`).test(source));
    expect(stale, `emitted now — drop from NOT_YET_EMITTED: ${stale.join(', ')}`).toEqual([]);
  });
});
