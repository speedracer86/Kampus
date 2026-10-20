/* The Living Business — BUSINESS_CLEANUP's graduated version of §0 12c.

   The screen reveals one system per open day. A control that has not been introduced
   is ABSENT, not greyed out: locked fills are for things she can see coming (ladder
   rungs), and an un-taught control should not exist yet. Karla introduces each one in
   a strip — never a modal, so she can act with it on screen.

   Declutter rules, binding: one event strip maximum; the estimate is a sentence, not
   a stat row; the stock table stays three columns until drift arrives; promos are a
   pill row and only once unlocked; the ladder lives behind the Grow pill. */
import { color, radius, font, numeral, money, signed } from './tokens.js';
import { Button, Kicker, Chip, Blob } from './primitives.jsx';
import { useWidth } from './util.jsx';

const bBase = { fontFamily: font.family, boxSizing: 'border-box' };
/* Supply prices live in cents (45¢ a lemon). money() rounds to whole dollars, which
   renders every supply as $0 or $1 — so prices under a dollar print as cents. */
const supplyPrice = (n) => (n < 1 ? `${Math.round(n * 100)}¢` : `$${n.toFixed(2)}`);
const PHASES = [['prep', 'Prep'], ['open', 'Open day'], ['ledger', 'Ledger'], ['grow', 'Grow']];

/** Karla's strip: her disc, one line, and a white Got it pill. Never a modal. */
export function KarlaStrip({ line, blobDir = '/blobs/', onGotIt, tone = 'plain' }) {
  return <div style={{ ...bBase, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
    background: tone === 'gold' ? color.held : color.fill, padding: '16px 20px', borderRadius: radius.lg, marginBottom: 18 }}>
    <span style={{ width: 40, height: 40, borderRadius: radius.full, background: color.surface, flex: 'none',
      display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
      <Blob name="Coach" size={32} dir={blobDir} /></span>
    <div style={{ flex: 1, minWidth: 180 }}>
      <div style={{ fontSize: 15, fontWeight: 700 }}>Karla</div>
      <div style={{ fontSize: 15, fontWeight: 400, color: color.ink, marginTop: 2 }}>{line}</div>
    </div>
    {onGotIt && <button onClick={onGotIt} style={{ ...bBase, border: 'none', cursor: 'pointer', background: color.surface,
      borderRadius: radius.full, padding: '9px 16px', fontSize: 13.5, fontWeight: 700 }}>Got it</button>}
  </div>;
}

/** Reputation, regulars — only rendered once introduced. */
function LeftColumn({ biz, unlocks, blobDir, phone }) {
  if (!unlocks.reputation) return null;
  const rep = biz.reputation ?? 50;
  const state = rep < 30 ? 'Quiet' : rep >= 70 ? 'Buzzing' : 'Steady';
  return <div>
    <Kicker style={{ marginBottom: 8 }}>Reputation</Kicker>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
      <span style={{ ...numeral(44) }}>{rep}</span>
      <span style={{ ...bBase, background: color.surface, borderRadius: radius.full, padding: '6px 13px', fontSize: 13, fontWeight: 700 }}>{state}</span>
    </div>
    <div style={{ height: 8, borderRadius: 4, background: color.track, overflow: 'hidden', marginTop: 10 }}>
      <div style={{ width: `${rep}%`, height: '100%', background: rep < 30 ? color.gold : color.greenDeep }} />
    </div>
    <div style={{ fontSize: 12.5, color: color.muted, marginTop: 8 }}>Never below 10.</div>

    {(biz.regulars || []).length > 0 && <div style={{ marginTop: 26 }}>
      <Kicker style={{ marginBottom: 8 }}>Regulars</Kicker>
      <div style={{ borderTop: `1px solid ${color.rule}` }}>
        {biz.regulars.map(r => <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 0', borderBottom: `1px solid ${color.rule}` }}>
          <span style={{ width: 40, height: 40, borderRadius: radius.full, background: color.surface, flex: 'none',
            display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
            <Blob name={r.blob || 'Selfie'} size={30} dir={blobDir} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{r.name || r.id}</div>
            {r.note && <div style={{ fontSize: 13, color: color.muted }}>{r.note}</div>}
          </div>
          <span style={{ display: 'inline-flex', gap: 4 }}>
            {[0, 1, 2, 3, 4].map(i => <i key={i} style={{ width: 8, height: 8, borderRadius: radius.full,
              background: i < Math.round((r.affinity || 50) / 20) ? color.greenDeep : color.surface }} />)}
          </span>
        </div>)}
      </div>
    </div>}
  </div>;
}

/** Prep: only the controls introduced so far, in the order they were introduced. */
function Prep({ biz, unlocks, estimate, stock, onPrice, onStock, onOpen, canOpen, promos, onPromo, nextRung, phone }) {
  const type = biz.type || {};
  return <>
    {unlocks.price && <div style={{ padding: phone ? '18px 20px' : '22px 32px', borderBottom: `1px solid ${color.rule}` }}>
      <Kicker style={{ marginBottom: 10 }}>Price per {type.unit || 'cup'}</Kicker>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(biz.priceOptions || [1, 1.5, 2, 2.5, 3]).map(p => <button key={p} onClick={() => onPrice(p)}
          style={{ ...bBase, border: 'none', cursor: 'pointer', borderRadius: radius.lg, minWidth: 52,
            padding: '14px 16px', fontSize: 16, fontWeight: 700,
            background: biz.price === p ? color.ink : color.fill, color: biz.price === p ? '#fff' : color.ink }}>
          ${p.toFixed(2).replace(/\.00$/, '')}</button>)}
      </div>
    </div>}

    {unlocks.buy && <div style={{ padding: phone ? '18px 20px' : '22px 32px', borderBottom: `1px solid ${color.rule}` }}>
      <Kicker style={{ marginBottom: 10 }}>Stock</Kicker>
      {/* Three columns until drift arrives on day 4, then four. Never four before. */}
      <div style={{ borderTop: `1px solid ${color.rule}` }}>
        {stock.map(row => <div key={row.key} style={{ display: 'grid', alignItems: 'center', gap: 14,
          gridTemplateColumns: unlocks.drift ? '1fr 90px 120px 128px' : '1fr 90px 128px',
          padding: '14px 0', borderBottom: `1px solid ${color.rule}` }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>{row.label}</span>
          <span style={{ ...numeral(30) }}>{row.onHand}</span>
          {unlocks.drift && <span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{supplyPrice(row.price)}</span>
            {row.drift !== 0 && <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700,
              color: row.drift < 0 ? color.greenDeep : color.goldDeep }}>
              {row.drift < 0 ? '▼' : '▲'} {Math.abs(Math.round(row.drift * 100))}¢ since yesterday</span>}
          </span>}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => onStock(row.key, -1)} style={discBtn}>−</button>
            <span style={{ ...numeral(28), minWidth: 28, textAlign: 'center' }}>{row.order}</span>
            <button onClick={() => onStock(row.key, 1)} style={discBtn}>+</button>
          </span>
        </div>)}
      </div>
    </div>}

    {unlocks.promos && promos?.length > 0 && <div style={{ padding: phone ? '16px 20px' : '18px 32px', borderBottom: `1px solid ${color.rule}` }}>
      <Kicker style={{ marginBottom: 10 }}>Promo</Kicker>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {promos.map(p => <button key={p.id} disabled={p.locked} onClick={() => onPromo(p)}
          style={{ ...bBase, border: 'none', cursor: p.locked ? 'default' : 'pointer', borderRadius: radius.full,
            padding: '10px 16px', fontSize: 13.5, fontWeight: 700,
            background: p.active ? color.ink : p.locked ? color.locked : color.fill,
            color: p.active ? '#fff' : p.locked ? color.disabledText : color.ink }}>
          {p.label}{p.locked ? ` · ${p.gate}` : ''}</button>)}
      </div>
    </div>}

    {/* The estimate is a sentence, not a stat row. */}
    <div style={{ padding: phone ? '18px 20px' : '22px 32px' }}>
      <p style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.5, margin: 0, color: color.muted }}>{estimate}</p>
      {nextRung && <p style={{ fontSize: 14, color: color.muted, marginTop: 10 }}>Next: {nextRung}</p>}
    </div>

    <div style={{ background: color.lime, padding: phone ? '18px 20px' : '20px 32px', display: 'flex',
      alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <span style={{ flex: 1, minWidth: 200, fontSize: 16, fontWeight: 600, color: color.limeBody }}>
        {canOpen.ok ? canOpen.tip : canOpen.reason}</span>
      {canOpen.ok
        ? <Button variant="ink" onClick={onOpen}>{canOpen.label}</Button>
        : <button disabled style={{ ...bBase, border: 'none', borderRadius: radius.full, padding: '11px 18px',
          fontSize: 13.5, fontWeight: 700, background: 'rgba(255,255,255,.55)', color: color.limeBody }}>
          {canOpen.label}</button>}
    </div>
  </>;
}

const discBtn = { ...bBase, width: 40, height: 40, borderRadius: radius.full, border: 'none',
  background: color.fill, fontSize: 18, fontWeight: 700, cursor: 'pointer', color: color.ink };

/** Open day: one customer per tap, no clock. */
function OpenDay({ queue, counters, onServe, onServeRest, onClose, blobDir, phone }) {
  const done = queue.every(q => q.status && q.status !== 'next' && q.status !== 'waiting');
  return <>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, padding: phone ? '18px 20px' : '22px 32px' }}>
      {[['Served', counters.served, color.greenDeep], ['Missed', counters.missed, color.ink], ['Left', counters.left, color.ink]]
        .map(([label, v, c]) => <div key={label}>
          <Kicker style={{ marginBottom: 6 }}>{label}</Kicker>
          <div style={{ ...numeral(36), color: c }}>{v}</div>
        </div>)}
    </div>
    <div style={{ borderTop: `1px solid ${color.rule}` }}>
      {queue.map((q, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        padding: phone ? '14px 20px' : '16px 32px', borderBottom: `1px solid ${color.rule}` }}>
        <span style={{ width: 40, height: 40, borderRadius: radius.full, background: color.fill, flex: 'none',
          display: 'grid', placeItems: 'center', overflow: 'hidden' }}><Blob name={q.blob || 'Selfie'} size={30} dir={blobDir} /></span>
        <span style={{ fontSize: 16, fontWeight: 700 }}>{q.name}</span>
        {q.isRegular && <Chip style={{ background: color.fill }}>Regular</Chip>}
        <span style={{ flex: 1, minWidth: 80, fontSize: 14, color: color.muted }}>{q.order?.cups} ×</span>
        <span style={{ ...bBase, borderRadius: radius.full, padding: '6px 13px', fontSize: 12.5, fontWeight: 700,
          background: q.status === 'served' ? color.greenTint : q.status === 'soldout' ? color.track : q.status === 'next' ? color.ink : color.fill,
          color: q.status === 'served' ? color.greenDeep : q.status === 'next' ? '#fff' : color.mutedDeep }}>
          {q.status === 'served' ? 'Served' : q.status === 'soldout' ? 'Sold out' : q.status === 'next' ? 'Next' : 'Waiting'}</span>
      </div>)}
    </div>
    <div style={{ display: 'flex', gap: 10, padding: phone ? '18px 20px' : '20px 32px', flexWrap: 'wrap' }}>
      {!done && <Button variant="outline" onClick={onServeRest}>Serve the rest</Button>}
      {!done && <Button variant="ink" onClick={onServe}>Serve next</Button>}
      {done && <Button variant="ink" onClick={onClose}>Close the books →</Button>}
    </div>
  </>;
}

/** Ledger: the day's money with its arithmetic showing. */
function Ledger({ result, phone }) {
  if (!result) return <div style={{ padding: phone ? '20px' : '24px 32px', fontSize: 16, color: color.muted }}>
    No day closed yet. Open the stand and the books fill in.</div>;
  const rows = [
    ['Revenue', result.revenue, color.greenDeep],
    ['Cost of what you sold', -result.cost, color.loss],
    ['Profit', result.profit, result.profit >= 0 ? color.greenDeep : color.loss],
  ];
  return <>
    <div style={{ padding: phone ? '20px' : '26px 32px' }}>
      <Kicker style={{ marginBottom: 8 }}>Ledger</Kicker>
      <div style={{ fontSize: phone ? 26 : 34, fontWeight: 700, letterSpacing: '-.025em' }}>
        {result.profit > 0 ? 'Profit. W.' : result.profit === 0 ? 'Broke even.' : 'Lost money. Happens.'}</div>
      <div style={{ ...numeral(phone ? 48 : 72), color: result.profit >= 0 ? color.greenDeep : color.loss, marginTop: 8 }}>
        {signed(result.profit)}</div>
    </div>
    <div style={{ borderTop: `1px solid ${color.rule}` }}>
      {rows.map(([label, v, c]) => <div key={label} style={{ display: 'flex', justifyContent: 'space-between',
        gap: 16, padding: phone ? '14px 20px' : '16px 32px', borderBottom: `1px solid ${color.rule}` }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: c }}>{signed(v)}</span>
      </div>)}
    </div>
  </>;
}

/** Grow: the ladder, off the daily screen (declutter rule 5). */
function Grow({ ladder, phone }) {
  return <div style={{ padding: phone ? '20px' : '26px 32px' }}>
    <Kicker style={{ marginBottom: 14 }}>Growth ladder</Kicker>
    {(ladder || []).map(r => <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 0', borderBottom: `1px solid ${color.rule}` }}>
      <span style={{ width: 24, height: 24, borderRadius: radius.full, flex: 'none', display: 'grid', placeItems: 'center',
        background: r.owned ? color.greenDeep : 'transparent', color: '#fff', fontSize: 12, fontWeight: 800,
        boxShadow: r.owned ? 'none' : `inset 0 0 0 1.5px ${color.todo}` }}>{r.owned ? '✓' : ''}</span>
      <span style={{ flex: 1, minWidth: 120, fontSize: 17, fontWeight: 600, color: r.owned ? color.ink : color.muted }}>{r.label}</span>
      {!r.owned && r.gate && <span style={{ fontSize: 13, color: color.muted, textAlign: 'right' }}>{r.gate}</span>}
    </div>)}
  </div>;
}

/**
 * data: {biz, unlocks, karla, estimate, stock, queue, counters, result, ladder, promos,
 *        canOpen:{ok,label,reason,tip}, nextRung, askKarla}
 */
export function BusinessScreen({ data, blobDir = '/blobs/', onEvent = () => {} }) {
  const ref = React.useRef(null);
  const phone = useWidth(ref) < 900;
  const d = data || {};
  const biz = d.biz || {};
  const u = d.unlocks || {};
  const [phase, setPhase] = React.useState('prep');
  const [asked, setAsked] = React.useState(false);

  const phases = PHASES.filter(([id]) => id !== 'grow' || u.ladder);
  const strip = asked ? (d.askKarla || { line: 'Looking good. Open when you’re ready.' }) : d.karla;

  return <div ref={ref} style={{ ...bBase, background: color.ground, minHeight: '100%', padding: phone ? '20px 16px 40px' : '36px 48px 48px' }}>
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 26 }}>
        <span style={{ width: 56, height: 56, flex: 'none' }}><Blob name="Startup" size={56} dir={blobDir} /></span>
        <div style={{ flex: 1, minWidth: 180 }}>
          <Kicker>Your business · {d.date}</Kicker>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.025em', margin: '4px 0 0' }}>{biz.name}</h1>
        </div>
        <div>
          <Kicker style={{ marginBottom: 4 }}>Bank</Kicker>
          <div style={{ ...numeral(44) }}>{money(d.bank || 0)}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {phases.map(([id, label]) => <button key={id} onClick={() => setPhase(id)}
            style={{ ...bBase, border: 'none', cursor: 'pointer', borderRadius: radius.full, padding: '9px 15px',
              fontSize: 13, fontWeight: 700, background: phase === id ? color.ink : color.surface,
              color: phase === id ? '#fff' : color.ink }}>{label}</button>)}
          {d.coachOn !== false && <button onClick={() => setAsked(a => !a)}
            style={{ ...bBase, display: 'inline-flex', alignItems: 'center', gap: 7, border: 'none', cursor: 'pointer',
              borderRadius: radius.full, padding: '7px 14px 7px 7px', fontSize: 13, fontWeight: 700, background: color.fill }}>
            <span style={{ width: 20, height: 20, borderRadius: radius.full, background: color.surface, display: 'grid',
              placeItems: 'center', overflow: 'hidden' }}><Blob name="Coach" size={16} dir={blobDir} /></span>
            Ask Karla</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: phone || !u.reputation ? '1fr' : '340px 1fr', gap: 48, alignItems: 'start' }}>
        {!phone && u.reputation && <LeftColumn biz={biz} unlocks={u} blobDir={blobDir} phone={phone} />}
        <div>
          {d.coachOn !== false && strip && <KarlaStrip line={strip.line} blobDir={blobDir} tone={strip.tone}
            onGotIt={() => { setAsked(false); onEvent('karla_dismiss', strip); }} />}
          {/* One event strip maximum (declutter rule 1). */}
          {d.event && <div style={{ ...bBase, background: d.event.tone === 'gold' ? color.held : color.fill,
            borderRadius: radius.lg, padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'center',
            gap: 14, flexWrap: 'wrap' }}>
            <span style={{ flex: 1, minWidth: 200, fontSize: 15 }}>{d.event.text}</span>
            {d.event.action && <Button variant="outline" size="sm" onClick={() => onEvent('event_action', d.event)}>{d.event.action}</Button>}
          </div>}

          <div style={{ background: color.surface, borderRadius: radius.sheet, overflow: 'hidden' }}>
            {phase === 'prep' && <Prep biz={biz} unlocks={u} estimate={d.estimate} stock={d.stock || []}
              promos={d.promos} nextRung={d.nextRung} canOpen={d.canOpen || { ok: false, label: 'Open', reason: '' }}
              onPrice={(p) => onEvent('price', p)} onStock={(k, delta) => onEvent('stock', { key: k, delta })}
              onPromo={(p) => onEvent('promo', p)} onOpen={() => onEvent('open_day', {})} phone={phone} />}
            {phase === 'open' && <OpenDay queue={d.queue || []} counters={d.counters || { served: 0, missed: 0, left: 0 }}
              onServe={() => onEvent('serve_next', {})} onServeRest={() => onEvent('serve_rest', {})}
              onClose={() => onEvent('close_books', {})} blobDir={blobDir} phone={phone} />}
            {phase === 'ledger' && <Ledger result={d.result} phone={phone} />}
            {phase === 'grow' && <Grow ladder={d.ladder} phone={phone} />}
          </div>
        </div>
      </div>
    </div>
  </div>;
}
