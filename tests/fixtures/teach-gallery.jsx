/* A test-only gallery that mounts the four §0b teach layouts with the authored
   reference steps, so "all four layouts render on desktop and phone, and a wrong
   pick shows the hint without blocking" can be checked directly instead of being
   driven through four different days of the year.

   Built by tests/test_layouts.mjs with esbuild; never part of the app bundle. */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { REFERENCE_STEPS } from '@kampus/curriculum';
import { TEACH_LAYOUTS } from '@kampus/ui/teach-layouts';
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

function Gallery() {
  const phone = window.innerWidth < 860;
  return <div style={{ background: color.ground, minHeight: '100vh', padding: phone ? 16 : 40,
    fontFamily: 'Inter Tight, system-ui, sans-serif' }}>
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {PANELS.map(p => <Panel key={p.layout} {...p} phone={phone} />)}
    </div>
  </div>;
}

createRoot(document.getElementById('root')).render(<Gallery />);
