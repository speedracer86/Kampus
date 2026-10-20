/* The kid/parent boundary. Carried over from the pre-§0 library because Step 8
   (Grown-ups) restyles it rather than rebuilding it — §0 never drew the PIN gate.
   It is a kid-stopper, not security: the real boundary is row-level security on
   the server (docs/DEPLOYMENT.md). */
import { color, radius, font } from './tokens.js';
import { Button, Blob } from './primitives.jsx';

const pBase = { fontFamily: font.family, boxSizing: 'border-box' };

export function PinGate({ pin = '1234', onPass = () => {}, onCancel, blobDir = 'blobs/' }) {
  const [entered, setEntered] = React.useState('');
  const [wrong, setWrong] = React.useState(false);
  const press = (d) => {
    if (wrong) setWrong(false);
    const next = entered + d;
    if (next.length < 4) return setEntered(next);
    if (next === pin) return onPass();
    setEntered(''); setWrong(true);
  };
  return <div style={{ ...pBase, background: color.ground, minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
    <div style={{ textAlign: 'center', maxWidth: 320 }}>
      <Blob name="Access" size={90} dir={blobDir} />
      <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-.02em', margin: '12px 0 6px' }}>Grown-ups only</div>
      <div style={{ fontSize: 14, color: color.muted, marginBottom: 20 }}>{wrong ? 'Not it. Try again.' : 'Enter the 4-digit PIN.'}</div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 22 }}>
        {[0, 1, 2, 3].map(i => <span key={i} style={{ width: 16, height: 16, borderRadius: radius.full,
          border: `2px solid ${wrong ? color.red : color.ink}`, background: i < entered.length ? color.ink : 'transparent' }} />)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 64px)', gap: 10, justifyContent: 'center' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((k, i) => k === null ? <span key={i} />
          : <button key={i} onClick={() => k === 'del' ? setEntered(entered.slice(0, -1)) : press(String(k))}
            style={{ ...pBase, width: 64, height: 56, borderRadius: radius.md, border: 'none', background: color.surface,
              fontSize: k === 'del' ? 14 : 20, fontWeight: 700, cursor: 'pointer', color: color.ink }}>{k === 'del' ? '⌫' : k}</button>)}</div>
      {onCancel && <Button variant="ghost" size="sm" style={{ marginTop: 18 }} onClick={onCancel}>← Back to the kid side</Button>}</div></div>;
}
