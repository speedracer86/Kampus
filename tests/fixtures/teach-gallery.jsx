/* A test-only gallery that mounts the four §0b teach layouts with the authored
   reference steps, so "all four layouts render on desktop and phone, and a wrong
   pick shows the hint without blocking" can be checked directly instead of being
   driven through four different days of the year.

   Built by tests/test_layouts.mjs with esbuild; never part of the app bundle. */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { REFERENCE_STEPS } from '@kampus/curriculum';
import { TEACH_LAYOUTS } from '@kampus/ui/teach-layouts';
import { ReteachView } from '@kampus/ui/lesson';
import { rich, plainSpeech } from '@kampus/ui/question';
import { sweepPlan, wordAt } from '@kampus/ui/say-it-show-it';
import { color } from '@kampus/ui/tokens';

// The library reads React off the global, exactly as the app's jsxInject supplies it.
window.React = React;

/* One panel per layout, taken from the reference skill that authored it. */
const PANELS = [
  { layout: 'bar', skill: 'eqFrac', step: REFERENCE_STEPS.eqFrac.find(s => s.layout === 'bar') },
  { layout: 'faceoff', skill: 'unitRate', step: REFERENCE_STEPS.unitRate.find(s => s.layout === 'faceoff') },
  { layout: 'line', skill: 'addInt', step: REFERENCE_STEPS.addInt.find(s => s.layout === 'line') },
  { layout: 'walk', skill: 'twoStep', step: REFERENCE_STEPS.twoStep.find(s => s.layout === 'walk') },
];

function Panel({ layout, skill, step, phone }) {
  const [solved, setSolved] = React.useState(false);
  const Layout = TEACH_LAYOUTS[layout];
  return <section data-layout={layout} data-solved={solved ? 'yes' : 'no'}
    style={{ background: color.surface, borderRadius: 28, padding: phone ? 20 : 32, marginBottom: 24 }}>
    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.14em', color: color.muted, textTransform: 'uppercase' }}>
      {layout} · {skill}</div>
    <h2 style={{ fontSize: phone ? 23 : 34, fontWeight: 600, letterSpacing: '-.025em', margin: '10px 0 22px' }}>{step.prompt}</h2>
    <Layout step={step} solved={solved} phone={phone} onSolve={setSolved} />
  </section>;
}

/* The re-teach panel, twice.

   It is the one teaching surface with no scripts yet (they arrive in the tranche-3
   bank patch), so the plumbing is checked here rather than through a lesson: the
   silent panel proves the no-script path still renders exactly as it ships today,
   and the voiced one proves a cue highlights its row without touching the only
   control on the panel. Clips are fake paths; tests/test_layouts.mjs stubs Audio.

   `?voice=1` arms the voiced panel. Without it there are no clips at all, so the
   two viewport passes never ask the page for an mp3 that does not exist. */
const RETEACH = {
  kicker: 'Another way to see it',
  title: 'Two-thirds of the pan, in twelfths',
  lede: 'Same brownies, thinner slices.',
  rows: [
    { lead: '', how: 'three pieces became twelve', value: '×4' },
    { lead: '', how: 'so two pieces became', value: '8' },
    { lead: '', how: 'which is', value: '8/12' },
  ],
};
const RETEACH_LINES = [
  { say: 'Look at the bottom row first.', cue: 'prompt' },
  { say: 'Three pieces became twelve. That is times four.', cue: 'row.1' },
  { say: 'So the two shaded pieces became eight.', cue: 'row.2' },
];
const FAKE_CLIPS = ['/voice/fake/r0-0.mp3', '/voice/fake/r0-1.mp3', '/voice/fake/r0-2.mp3'];

function ReteachPanels({ phone }) {
  const armed = new URLSearchParams(location.search).get('voice') === '1';
  const voiced = {
    ...RETEACH,
    speak: RETEACH_LINES.map(l => l.say).join(' '),
    speakLines: RETEACH_LINES,
    voiceRef: { kind: 'reteach', index: 0 },
  };
  // A manifest shaped exactly as the generator writes one, pointing at the fakes.
  const manifest = { eqFrac: { reteach: [FAKE_CLIPS.map(f => ({ file: f.replace('/voice/', ''), sha: '0' }))] } };
  // Counted, not assumed: the one way off this panel must fire only on a tap.
  // If a clip, a cue or an autoplay ever advanced the kid, this is where it shows.
  window.__continued = window.__continued || 0;
  const onContinue = () => { window.__continued++; };
  return <>
    <section data-reteach="silent">
      <ReteachView teach={RETEACH} phone={phone} label="2 fresh ones →" onContinue={onContinue} />
    </section>
    {armed && <section data-reteach="voiced">
      <ReteachView teach={voiced} phone={phone} label="2 fresh ones →" onContinue={onContinue}
        voice={{ manifest, base: '/voice/', skill: 'eqFrac' }} />
    </section>}
  </>;
}

/* The markup the question text actually carries.

   `rich()` raises superscripts and `plainSpeech()` says them out loud, and both
   matter for the same string: 2<sup>6</sup> rendered flat reads as 26, and spoken
   flat reads as "twenty-six" — a wrong answer in a confident voice. The webapp
   suite can only check this where it happens to drive a question that has one, so
   the transform is checked here against the shapes curriculum.js really emits.

   The nested case is in the list because nothing in the bank nests them YET. */
const FR = (n, d) => `<span class="fr"><span class="fn">${n}</span><span class="fd">${d}</span></span>`;
const RICH_CASES = [
  { raw: '7<sup>2</sup> = ?', said: '7 to the 2 = ?' },
  // The sweep's catch: stripped, this read "13 = ?15" on a grade-4 screen.
  { raw: `${FR(1, 3)} &nbsp;=&nbsp; ${FR('?', 15)}`, said: '1 over 3 = ? over 15' },
  { raw: `${FR(2, 4)} &nbsp;or&nbsp; ${FR(3, 5)}`, said: '2 over 4 or 3 over 5' },
  { raw: 'Someone bought 3 cups for $12.<br>What\u2019s one cup?', said: 'Someone bought 3 cups for $12. What\u2019s one cup?' },
  { raw: 'Split 20 in the ratio 2:3.<br>How many is the <b>smaller</b> share?', said: 'Split 20 in the ratio 2:3. How many is the smaller share?' },
  { raw: '2<sup>6</sup> means multiply 2 by itself 6 times.', said: '2 to the 6 means multiply 2 by itself 6 times.' },
  { raw: '4,500 = 4.5 × 10<sup>?</sup>', said: '4,500 = 4.5 × 10 to the ?' },
  { raw: '<b>Halve</b> it, then add 2.', said: 'Halve it, then add 2.' },
  { raw: '<b>2<sup>6</sup></b> is the one to beat.', said: '2 to the 6 is the one to beat.' },
  { raw: 'Nothing <i>special</i> here.', said: 'Nothing special here.' },
];

function RichCases() {
  // Read back by tests/test_layouts.mjs: the spoken form is a string, so it is
  // compared as one rather than scraped off the screen.
  window.__plain = RICH_CASES.map(c => plainSpeech(c.raw));
  window.__sweep = sweepProbe();
  window.__plainWant = RICH_CASES.map(c => c.said);
  return <section data-rich style={{ position: 'absolute', left: -9999, top: 0 }}>
    {RICH_CASES.map((c, i) => <div key={i} data-rich-case={i}>{rich(c.raw)}</div>)}
  </section>;
}

/* The word sweep's two timing sources, checked as data rather than as pixels.

   The webapp spec proves the sweep MOVES on screen; this proves it would move in
   the right places, and that an exact timing set is preferred when one exists —
   which is how the renewal run's timestamps will arrive. */
function sweepProbe() {
  const say = 'Here is a pan of brownies, cut into three equal pieces.';
  const prop = sweepPlan(say, null);
  const words = say.split(/\s+/);
  const exactMeta = { words: words.map((w, i) => ({ word: w, start: i * 0.25 })) };
  const exact = sweepPlan(say, exactMeta);
  // Timings for a DIFFERENT line length must be refused, not stretched over this one.
  const mismatched = sweepPlan(say, { words: [{ word: 'Here', start: 0 }] });
  return {
    nWords: prop.words.length,
    propExact: prop.exact,
    startsRise: prop.starts.every((v, i) => i === 0 ? v === 0 : v > prop.starts[i - 1]),
    // "brownies," (9) must get a wider slice than "a" (1).
    longerWordGetsLongerSlice: (() => {
      const i = prop.words.indexOf('a'), j = prop.words.indexOf('brownies,');
      return (prop.starts[j + 1] - prop.starts[j]) > (prop.starts[i + 1] - prop.starts[i]);
    })(),
    exactUsed: exact.exact && exact.starts[2] === 0.5,
    mismatchRefused: mismatched.exact === false,
    // No duration yet: sweep nothing rather than guess.
    noDuration: wordAt(prop, 0.4, NaN),
    firstWord: wordAt(prop, 0, 10),
    lastWord: wordAt(prop, 10, 10),
    monotonic: (() => {
      let last = -1;
      for (let t = 0; t <= 10; t += 0.2) { const k = wordAt(prop, t, 10); if (k < last) return false; last = k; }
      return true;
    })(),
    exactIgnoresDuration: wordAt(exact, 0.6, NaN),
  };
}

function Gallery() {
  const phone = window.innerWidth < 860;
  return <div style={{ background: color.ground, minHeight: '100vh', padding: phone ? 16 : 40,
    fontFamily: 'Inter Tight, system-ui, sans-serif' }}>
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {PANELS.map(p => <Panel key={p.layout} {...p} phone={phone} />)}
      <ReteachPanels phone={phone} />
      <RichCases />
    </div>
  </div>;
}

createRoot(document.getElementById('root')).render(<Gallery />);
