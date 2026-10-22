/* The PIN pad (§0a). Used in four places: setting a parent PIN, confirming it,
   a kid unlocking her profile, and the Grown-ups gate.

   The ADHD laws apply here too, and they are the reason for two absences: there are
   NO lockouts and NO countdowns. A wrong PIN clears the dots, says so once, and lets
   her try again. A child locked out of her own app by a timer learns only that the
   app is against her. */
import { color, radius, font, numeral } from './tokens.js';
import { useWidth } from './util.jsx';

const pBase = { fontFamily: font.family, boxSizing: 'border-box' };
export const PIN_LENGTH = 4;

/**
 * @param {object} p
 * @param {'enter'|'set'} [p.mode] 'set' asks for it twice ("Once more")
 * @param {string} [p.expect] the PIN to match in 'enter' mode
 * @param {(pin: string) => void} p.onDone
 */
export function PinPad({ mode = 'enter', expect, title, sub, onDone, onCancel, footer, phone: phoneProp }) {
  const ref = React.useRef(null);
  const phone = phoneProp ?? useWidth(ref) < 640;
  const [entry, setEntry] = React.useState('');
  const [first, setFirst] = React.useState(null);     // 'set' mode: the first attempt
  const [status, setStatus] = React.useState(null);   // 'wrong' | 'ok'

  const say = mode === 'set'
    ? (first ? 'Once more.' : 'Pick a 4-digit PIN.')
    : (sub || 'Type your PIN.');

  const press = (d) => {
    if (status === 'ok') return;
    if (status === 'wrong') setStatus(null);
    const next = entry + d;
    if (next.length < PIN_LENGTH) return setEntry(next);

    if (mode === 'set') {
      if (!first) { setFirst(next); setEntry(''); return; }
      if (next === first) { setStatus('ok'); setTimeout(() => onDone?.(next), 450); return; }
      // Mismatch starts over cleanly — no penalty, no counter.
      setFirst(null); setEntry(''); setStatus('wrong'); return;
    }
    if (next === expect) { setStatus('ok'); setTimeout(() => onDone?.(next), 400); return; }
    setEntry(''); setStatus('wrong');
  };

  const dotColor = status === 'ok' ? color.green : status === 'wrong' ? color.red : color.ink;
  const message = status === 'wrong'
    ? (mode === 'set' ? 'Those didn’t match. Start again.' : 'Not it. Try again.')
    : say;

  const key = (label, onClick, isDigit = true) => <button key={label} onClick={onClick}
    style={{ ...pBase, width: phone ? 76 : 84, height: phone ? 76 : 84, borderRadius: radius.full,
      border: 'none', cursor: 'pointer', background: color.fill, color: color.ink,
      ...(isDigit ? numeral(34) : { fontSize: 14, fontWeight: 700 }) }}>{label}</button>;

  return <div ref={ref} style={{ ...pBase, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
    {title && <h2 style={{ fontSize: phone ? 26 : 34, fontWeight: 600, letterSpacing: '-.025em', margin: '0 0 8px' }}>{title}</h2>}
    <div style={{ fontSize: 15, color: status === 'wrong' ? color.loss : color.muted, marginBottom: 22, minHeight: 22 }}>{message}</div>

    <div style={{ display: 'flex', gap: 14, marginBottom: 26 }}>
      {Array.from({ length: PIN_LENGTH }, (_, i) => <span key={i} style={{ width: 26, height: 26, borderRadius: radius.full,
        background: i < entry.length || status === 'ok' ? dotColor : 'transparent',
        boxShadow: i < entry.length || status === 'ok' ? 'none' : `inset 0 0 0 2px ${status === 'wrong' ? color.red : 'rgba(35,37,43,.22)'}` }} />)}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: phone ? 12 : 16, justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => key(String(n), () => press(String(n))))}
      <span />
      {key('0', () => press('0'))}
      {key('Delete', () => setEntry(e => e.slice(0, -1)), false)}
    </div>

    {footer && <div style={{ marginTop: 24 }}>{footer}</div>}
    {onCancel && <button onClick={onCancel} style={{ ...pBase, marginTop: 18, border: 'none', background: 'none',
      cursor: 'pointer', fontSize: 14, fontWeight: 600, color: color.muted }}>Not you? Switch</button>}
  </div>;
}
