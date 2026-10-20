/* The three hands-on steps inside a lesson's teach phase (STYLE_GUIDE §0, "Mission flow").
   Each one is a small self-contained puzzle that gates Next: the kid cannot move on by
   reading, only by doing. All three are controlled the same way — they own the fiddly
   interaction state, and report solved/unsolved up through onSolve(boolean). */
import { color, radius, font, numeral } from './tokens.js';
import { Kicker } from './primitives.jsx';

const iBase = { fontFamily: font.family, boxSizing: 'border-box' };
const money = (n) => `$${n.toFixed(2)}`;

/**
 * Step 2 — the 20-block tap-to-shade bar. Each block is 5%.
 * Ink while under target, green when exact, red blocks + a red readout when over.
 */
export function ShadeBar({ targetPct = 10, total, onSolve = () => {}, blocks = 20 }) {
  const [n, setN] = React.useState(0);
  const per = 100 / blocks;
  const pct = n * per;
  const exact = pct === targetPct;
  const over = pct > targetPct;
  React.useEffect(() => { onSolve(exact); }, [exact]);

  const fillFor = (i) => {
    if (i >= n) return color.surface;
    return over ? color.red : exact ? color.green : color.ink;
  };
  return <div style={{ ...iBase }}>
    <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
      {Array.from({ length: blocks }, (_, i) => <button key={i} aria-label={`${(i + 1) * per}%`}
        onClick={() => setN(i + 1 === n ? i : i + 1)}
        style={{ ...iBase, flex: 1, height: 64, border: `1.5px solid ${i < n ? 'transparent' : color.rule}`,
          borderRadius: 8, background: fillFor(i), cursor: 'pointer', padding: 0 }} />)}
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
      <span style={{ ...numeral(40), color: over ? color.loss : exact ? color.greenDeep : color.ink }}>{pct}%</span>
      {typeof total === 'number' && <span style={{ ...numeral(28), color: over ? color.loss : exact ? color.greenDeep : color.muted }}>
        {money(total * pct / 100)}</span>}
      <span style={{ fontSize: 15, fontWeight: 600, color: over ? color.loss : exact ? color.greenDeep : color.muted }}>
        {over ? 'Too far — take some back.' : exact ? 'That’s it.' : `Shade ${targetPct}%.`}</span>
    </div>
  </div>;
}

/**
 * Step 3 — split the bill. Tap the note to break it into ten 10% discs, tap a disc to
 * cut it into two halves, then collect exactly the target share.
 */
export function SplitTheBill({ total = 48, targetPct = 15, onSolve = () => {} }) {
  const [split, setSplit] = React.useState(false);
  const [discs, setDiscs] = React.useState([]);     // [{id, value, picked}]
  const tenth = total / 10;
  const target = total * targetPct / 100;

  const doSplit = () => {
    setSplit(true);
    setDiscs(Array.from({ length: 10 }, (_, i) => ({ id: `d${i}`, value: tenth, picked: false })));
  };
  const cut = (id) => setDiscs(ds => ds.flatMap(d => d.id === id && !d.half
    ? [{ id: id + 'a', value: d.value / 2, picked: false, half: true }, { id: id + 'b', value: d.value / 2, picked: false, half: true }]
    : [d]));
  const toggle = (id) => setDiscs(ds => ds.map(d => d.id === id ? { ...d, picked: !d.picked } : d));

  const picked = discs.filter(d => d.picked).reduce((s, d) => s + d.value, 0);
  const exact = split && Math.abs(picked - target) < 0.005;
  const over = picked - target > 0.005;
  React.useEffect(() => { onSolve(exact); }, [exact]);

  if (!split) return <div style={{ ...iBase }}>
    <button onClick={doSplit} style={{ ...iBase, cursor: 'pointer', border: `1.5px solid ${color.rule}`, background: color.surface,
      borderRadius: radius.lg, padding: '28px 36px', display: 'block' }}>
      <Kicker style={{ marginBottom: 6 }}>The bill</Kicker>
      <span style={{ ...numeral(56) }}>{money(total)}</span>
    </button>
    <div style={{ fontSize: 15, fontWeight: 600, color: color.muted, marginTop: 12 }}>Tap the bill to split it into ten.</div>
  </div>;

  return <div style={{ ...iBase }}>
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
      {discs.map(d => <button key={d.id} onClick={() => toggle(d.id)} onDoubleClick={() => !d.half && cut(d.id)}
        style={{ ...iBase, width: d.half ? 60 : 72, height: d.half ? 60 : 72, borderRadius: radius.full, cursor: 'pointer',
          border: 'none', fontSize: d.half ? 13 : 14, fontWeight: 700,
          background: d.picked ? (over ? color.red : exact ? color.green : color.ink) : color.greenTint,
          color: d.picked ? '#fff' : color.greenDeep }}>{money(d.value)}</button>)}
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
      <span style={{ ...numeral(40), color: over ? color.loss : exact ? color.greenDeep : color.ink }}>{money(picked)}</span>
      <span style={{ fontSize: 15, fontWeight: 600, color: over ? color.loss : exact ? color.greenDeep : color.muted }}>
        {over ? 'That’s more than the tip.' : exact ? `That’s ${targetPct}%.` : `Collect ${targetPct}% — double-tap a disc to cut it in half.`}</span>
    </div>
  </div>;
}

/**
 * Step 4 — spot the mistake. Three lines of a friend's working; tap the wrong one.
 * Right line: green "Found it". Wrong line: red "Checks out" — it really does.
 */
export function SpotTheMistake({ lines = [], onSolve = () => {} }) {
  const [tapped, setTapped] = React.useState(null);
  const found = tapped !== null && lines[tapped]?.wrong;
  React.useEffect(() => { onSolve(!!found); }, [found]);

  return <div style={{ ...iBase }}>
    {lines.map((l, i) => {
      const isTapped = tapped === i;
      const right = isTapped && l.wrong;
      const wrong = isTapped && !l.wrong;
      return <button key={i} onClick={() => setTapped(i)} disabled={found && !right}
        style={{ ...iBase, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, width: '100%',
          textAlign: 'left', cursor: found && !right ? 'default' : 'pointer', marginBottom: 10,
          background: right ? color.greenTint : wrong ? color.redTint : color.surface,
          border: `1.5px solid ${right ? color.green : wrong ? color.red : color.rule}`,
          borderRadius: radius.lg, padding: '18px 22px', fontSize: 20, fontWeight: 600, color: color.ink }}>
        <span>{l.text}</span>
        {isTapped && <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
          color: right ? color.greenDeep : color.loss }}>{right ? 'Found it' : 'Checks out'}</span>}
      </button>;
    })}
    <div style={{ fontSize: 15, fontWeight: 600, color: found ? color.greenDeep : color.muted, marginTop: 4 }}>
      {found ? lines[tapped].why || 'That’s the one.' : 'One of these lines is wrong. Tap it.'}</div>
  </div>;
}

/** Registry so a lesson step can name its interactive as data. */
export const INTERACTIVES = { shade: ShadeBar, split: SplitTheBill, mistake: SpotTheMistake };
