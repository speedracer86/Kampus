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

function Gallery() {
  const phone = window.innerWidth < 860;
  return <div style={{ background: color.ground, minHeight: '100vh', padding: phone ? 16 : 40,
    fontFamily: 'Inter Tight, system-ui, sans-serif' }}>
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {PANELS.map(p => <Panel key={p.layout} {...p} phone={phone} />)}
      <ReteachPanels phone={phone} />
    </div>
  </div>;
}

createRoot(document.getElementById('root')).render(<Gallery />);
