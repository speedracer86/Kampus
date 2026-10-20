/* Rewards — STYLE_GUIDE §0 "Rewards" (9a desktop, 9c phone).

   Real money, in integer cents, always printed with two decimals. The left column
   is a paper receipt — the one surface in the app set in IBM Plex Mono, and the one
   place dashed rules are allowed — because reading a real receipt is part of the
   lesson. The right column is the wishlist: things a kid picks and a grown-up okays.

   Presentational. The ledger and every total come from @kampus/engine's earnings.js. */
import { color, radius, font, numeral, dollars } from './tokens.js';
import { Kicker } from './primitives.jsx';
import { useWidth } from './util.jsx';

const rBase = { fontFamily: font.family, boxSizing: 'border-box' };
const mono = { fontFamily: font.mono, fontSize: 13, lineHeight: 1.45, color: color.ink };
const DASHED = `1.5px dashed rgba(35,37,43,.3)`;   // allowed on the receipt only (§0)

function Row({ left, right, bold, muted }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12,
    fontWeight: bold ? 700 : 400, color: muted ? 'rgba(35,37,43,.55)' : color.ink }}>
    <span>{left}</span><span>{right}</span></div>;
}

/** The printed receipt: what came in, what is held, what is left, and the goal. */
export function Receipt({ model, date = new Date() }) {
  const m = model || {};
  const stamp = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  return <div>
    <div style={{ ...mono, background: color.surface, padding: '26px 24px 22px', borderRadius: 0 }}>
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '.14em' }}>KAMPUS BANK</div>
        <div style={{ marginTop: 4 }}>{m.name ? `${m.name}’s money` : 'Your money'} · receipt #{m.number}</div>
        <div style={{ color: 'rgba(35,37,43,.55)' }}>{stamp}</div>
      </div>
      <div style={{ borderTop: DASHED, margin: '12px 0' }} />

      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', marginBottom: 8 }}>EARNED THIS WEEK</div>
      {(m.earned || []).map((e, i) => <Row key={i} left={`${e.day} · ${e.label}`} right={`+${dollars(e.cents)}`} />)}
      {!(m.earned || []).length && <Row left="Nothing yet this week" right="" muted />}
      <div style={{ marginTop: 8 }}><Row left="Subtotal" right={dollars(m.subtotal || 0)} bold /></div>
      <Row left={`Weekly limit ${dollars(m.cap || 0)}`} right={`${dollars(m.capLeft || 0)} left`} muted />

      <div style={{ borderTop: DASHED, margin: '14px 0' }} />
      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', marginBottom: 8 }}>HELD FOR ASKS</div>
      {(m.held || []).length
        ? m.held.map(h => <Row key={h.id} left={h.label} right={`−${dollars(h.cents)}`} />)
        : <Row left="Nothing held" right="" muted />}

      <div style={{ borderTop: DASHED, margin: '14px 0' }} />
      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em' }}>AVAILABLE</div>
      <div style={{ fontSize: 34, fontWeight: 600, margin: '4px 0 2px' }}>{dollars(m.available || 0)}</div>
      <div style={{ color: 'rgba(35,37,43,.55)' }}>Total in the bank</div>

      {m.goal && <>
        <div style={{ borderTop: DASHED, margin: '14px 0' }} />
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', marginBottom: 6 }}>SAVING FOR</div>
        <Row left={m.goal.name} right={dollars(m.goal.cents)} />
        <div style={{ letterSpacing: '.18em', margin: '6px 0 2px' }}>
          {'■'.repeat(m.goal.cells)}{'□'.repeat(10 - m.goal.cells)}</div>
        <div style={{ color: 'rgba(35,37,43,.55)' }}>{dollars(m.goal.toGo)} to go</div>
      </>}

      <div style={{ borderTop: DASHED, margin: '14px 0' }} />
      <div style={{ color: 'rgba(35,37,43,.55)' }}>{m.note}</div>
      <div style={{ color: 'rgba(35,37,43,.55)', marginTop: 4 }}>{m.name ? `Keep it up, ${m.name}.` : 'Keep it up.'}</div>
    </div>
    {/* torn-paper bottom edge: two gradients, 14px period */}
    <div style={{ height: 10, backgroundRepeat: 'repeat-x', backgroundPosition: 'bottom',
      backgroundSize: '14px 14px',
      backgroundImage: `linear-gradient(135deg, ${color.surface} 50%, transparent 50%), linear-gradient(225deg, ${color.surface} 50%, transparent 50%)` }} />
  </div>;
}

const BUTTON = {
  ask: { background: color.ink, color: '#fff', label: 'Ask for it' },
  asked: { background: color.held, color: color.goldDeep, label: 'Asked ✓' },
  save: { background: color.fill, color: color.ink, label: 'Save for it' },
  saving: { background: color.savingTint, color: color.greenDeep, label: 'Saving ✓' },
  short: { background: color.fill, color: color.disabledText, label: null },
};

function RewardButton({ state, shortBy, onClick }) {
  const s = BUTTON[state] || BUTTON.save;
  const disabled = state === 'short';
  return <button disabled={disabled} onClick={onClick} style={{ ...rBase, minWidth: 128, textAlign: 'left',
    border: 'none', borderRadius: radius.full, padding: '12px 18px', fontSize: 14, fontWeight: 700,
    cursor: disabled ? 'default' : 'pointer', background: s.background, color: s.color }}>
    {s.label || `Need ${dollars(shortBy)} more`}</button>;
}

/** A thing from a shop, with a bar showing how close the kid is to affording it. */
export function StoreRow({ item, available, state, onAsk, onSave, phone }) {
  const pct = Math.max(0, Math.min(100, Math.round((available / item.cents) * 100)));
  const short = Math.max(0, item.cents - available);
  return <div style={{ ...rBase, display: 'grid', alignItems: 'center', gap: 18,
    gridTemplateColumns: phone ? '52px 1fr' : '64px 1fr 170px 128px',
    padding: phone ? '16px 20px' : '16px 32px', borderBottom: `1px solid ${color.rule}` }}>
    <div style={{ width: phone ? 52 : 64, height: phone ? 52 : 64, borderRadius: 16, background: color.fill,
      backgroundImage: item.image ? `url(${item.image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
    <div>
      <div style={{ fontSize: 18, fontWeight: 600 }}>{item.name}</div>
      <div style={{ fontSize: 13.5, color: color.muted, marginTop: 2 }}>{item.store} · {dollars(item.cents)}</div>
    </div>
    {!phone && <div>
      <div style={{ height: 6, borderRadius: 3, background: color.track, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color.greenDeep }} /></div>
      <div style={{ fontSize: 12.5, color: color.muted, marginTop: 6 }}>
        {short > 0 ? `${dollars(short)} to go` : 'You have enough'}</div>
    </div>}
    <div style={{ gridColumn: phone ? '1 / -1' : 'auto' }}>
      <RewardButton state={short > 0 && state !== 'asked' && state !== 'saving' ? (state === 'save' ? 'save' : 'short') : state}
        shortBy={short} onClick={() => (short > 0 ? onSave && onSave(item) : onAsk && onAsk(item))} />
    </div>
  </div>;
}

/** Something a grown-up offers at home — no shop, no link. */
export function HomeRow({ item, available, state, onAsk, phone }) {
  const short = Math.max(0, item.cents - available);
  return <div style={{ ...rBase, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
    padding: phone ? '16px 20px' : '16px 32px', borderBottom: `1px solid ${color.rule}` }}>
    <div style={{ width: 52, height: 52, borderRadius: radius.full, background: color.fill, flex: 'none',
      display: 'grid', placeItems: 'center', fontSize: 20 }}>{item.icon || '★'}</div>
    <div style={{ flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 18, fontWeight: 600 }}>{item.name}</div>
      {item.sub && <div style={{ fontSize: 13.5, color: color.muted, marginTop: 2 }}>{item.sub}</div>}
    </div>
    <div style={{ ...numeral(28), flex: 'none' }}>{dollars(item.cents)}</div>
    <RewardButton state={short > 0 ? 'short' : state} shortBy={short} onClick={() => onAsk && onAsk(item)} />
  </div>;
}

/**
 * data: {receipt, howYouEarn[], store[], home[], waiting[], available}
 * onEvent('ask'|'save'|'cancel'|'paste', payload)
 */
export function RewardsScreen({ data, onEvent = () => {} }) {
  const ref = React.useRef(null);
  const phone = useWidth(ref) < 900;
  const d = data || {};
  const [link, setLink] = React.useState('');
  const asked = new Set((d.waiting || []).map(w => w.label));

  const section = (title, children) => <>
    <div style={{ padding: phone ? '16px 20px 6px' : '18px 32px 6px' }}><Kicker>{title}</Kicker></div>
    {children}
  </>;

  return <div ref={ref} style={{ ...rBase, background: color.ground, minHeight: '100%', padding: phone ? '20px 16px 40px' : '36px 48px 48px' }}>
    <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid',
      gridTemplateColumns: phone ? '1fr' : '340px 1fr', gap: 48, alignItems: 'start' }}>

      <div>
        <Receipt model={d.receipt} />
        <div style={{ marginTop: 22 }}>
          <Kicker style={{ marginBottom: 10 }}>How you earn</Kicker>
          {(d.howYouEarn || []).map(h => <div key={h.reason} style={{ display: 'flex', justifyContent: 'space-between',
            gap: 12, padding: '10px 0', borderBottom: `1px solid ${color.rule}`, fontSize: 14 }}>
            <span style={{ fontWeight: 600 }}>{h.label}</span>
            <span style={{ fontWeight: 700, color: color.greenDeep }}>+{dollars(h.cents)}</span>
          </div>)}
        </div>
      </div>

      <div style={{ background: color.surface, borderRadius: radius.sheet, overflow: 'hidden' }}>
        <div style={{ padding: phone ? '22px 20px 16px' : '30px 32px 20px' }}>
          <h1 style={{ fontSize: phone ? 22 : 28, fontWeight: 600, letterSpacing: '-.025em', lineHeight: 1.3, margin: 0 }}>
            <span style={{ color: color.ink }}>Real rewards, </span>
            <span style={{ color: color.muted }}>picked by you, </span>
            <span style={{ color: color.ink }}>okayed by a grown-up.</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: color.fill,
            borderRadius: radius.full, padding: '8px 8px 8px 18px', marginTop: 20, flexWrap: 'wrap' }}>
            <input value={link} onChange={e => setLink(e.target.value)}
              placeholder="Paste a link from Amazon, Target or any store"
              style={{ ...rBase, flex: 1, minWidth: 180, border: 'none', background: 'transparent',
                fontSize: 14, color: color.ink, outline: 'none' }} />
            <button onClick={() => { onEvent('paste', { link }); setLink(''); }}
              style={{ ...rBase, border: 'none', cursor: 'pointer', borderRadius: radius.full,
                padding: '10px 16px', fontSize: 13.5, fontWeight: 700, background: color.ink, color: '#fff' }}>
              Add to wishlist</button>
          </div>
        </div>

        {section('From stores', (d.store || []).map(it => <StoreRow key={it.id} item={it} phone={phone}
          available={d.available || 0} state={asked.has(it.name) ? 'asked' : d.goal === it.id ? 'saving' : 'ask'}
          onAsk={(i) => onEvent('ask', i)} onSave={(i) => onEvent('save', i)} />))}

        {section('At home', (d.home || []).map(it => <HomeRow key={it.id} item={it} phone={phone}
          available={d.available || 0} state={asked.has(it.name) ? 'asked' : 'ask'}
          onAsk={(i) => onEvent('ask', i)} />))}

        {section('Waiting on a grown-up', (d.waiting || []).length
          ? (d.waiting || []).map(w => <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 16,
            flexWrap: 'wrap', background: color.held, padding: phone ? '14px 20px' : '14px 32px' }}>
            <span style={{ flex: 1, minWidth: 150, fontSize: 16, fontWeight: 600, color: color.goldDeep }}>{w.label}</span>
            <span style={{ fontWeight: 700, color: color.goldDeep }}>{dollars(w.cents)}</span>
            <button onClick={() => onEvent('cancel', w)} style={{ ...rBase, border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,.7)', borderRadius: radius.full, padding: '8px 14px',
              fontSize: 13, fontWeight: 700, color: color.goldDeep }}>Cancel</button>
          </div>)
          : <div style={{ padding: phone ? '0 20px 20px' : '0 32px 24px', fontSize: 15, color: color.muted }}>
            Nothing waiting. Ask for something and a grown-up will see it here.</div>)}
      </div>
    </div>
  </div>;
}
