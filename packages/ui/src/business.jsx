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
import { CountUp, playRegister, useReducedMotion } from './juice.jsx';

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
function Prep({ biz, unlocks, estimate, stock, onPrice, onStock, onOpen, onLesson, canOpen, promos, onPromo, nextRung, phone }) {
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
        : canOpen.lesson
          // The gate's whole job is to send her to class — a dead button here is a trap.
          ? <button onClick={onLesson} style={{ ...bBase, border: 'none', cursor: 'pointer', borderRadius: radius.full,
            padding: '11px 18px', fontSize: 13.5, fontWeight: 700, background: 'rgba(255,255,255,.75)', color: color.limeBody }}>
            {canOpen.label}</button>
          : <button disabled style={{ ...bBase, border: 'none', borderRadius: radius.full, padding: '11px 18px',
            fontSize: 13.5, fontWeight: 700, background: 'rgba(255,255,255,.55)', color: color.limeBody }}>
            {canOpen.label}</button>}
    </div>
  </>;
}

const discBtn = { ...bBase, width: 40, height: 40, borderRadius: radius.full, border: 'none',
  background: color.fill, fontSize: 18, fontWeight: 700, cursor: 'pointer', color: color.ink };

/** Open day: one customer per tap, no clock. */

/** A business moment: the math a customer in the line actually asks for.

    These come from `makeMoment` in the engine — generated from live state she owns
    (her price, her stock, today's market), which PLAY_SYSTEM §2 calls the crown
    jewel of the three-source rule. Up to three are attached to the day's queue.

    It is a question, not a gate. A wrong answer shows the working and the customer
    is served anyway: the §5 rule says a quiz can never hurt the business, and that
    has to hold for the questions standing *inside* the business too. It pays
    nothing either — serving the line is the job, and the day's profit is the
    reward. */
export function MomentCard({ moment, customer, onAnswer, onDone, blobDir = '/blobs/', phone }) {
  const [picked, setPicked] = React.useState(null);
  // Authored wrongs, ordered deterministically so the answer is not always first —
  // the same ordering the snag bank uses.
  const choices = React.useMemo(() => [String(moment.ans), ...(moment.wrongs || []).map(String)]
    .sort((a, b) => (a.length + a.charCodeAt(0)) - (b.length + b.charCodeAt(0))), [moment]);
  const right = picked !== null && choices[picked] === String(moment.ans);
  // Steps carry <b> for emphasis; this library renders text, so strip the markup
  // rather than reaching for dangerouslySetInnerHTML.
  const plain = (t) => String(t).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

  return <div style={{ ...bBase, borderTop: `1px solid ${color.rule}`, padding: phone ? '20px' : '26px 32px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <span style={{ width: 44, height: 44, borderRadius: radius.full, background: color.fill, flex: 'none',
        display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
        <Blob name={customer?.blob || 'Selfie'} size={32} dir={blobDir} /></span>
      <div>
        <Kicker>{customer?.name || 'A customer'} asks</Kicker>
        <div style={{ fontSize: 12.5, color: color.muted, marginTop: 2 }}>{moment.skill}</div>
      </div>
    </div>

    <div style={{ fontSize: phone ? 19 : 24, fontWeight: 600, lineHeight: 1.35, marginBottom: 18 }}>{plain(moment.q)}</div>

    <div style={{ display: 'grid', gap: 10, gridTemplateColumns: phone ? '1fr' : '1fr 1fr' }}>
      {choices.map((c, i) => {
        const isPick = picked === i;
        const win = isPick && right, lose = isPick && !right;
        return <button key={c} onClick={() => { if (picked === null) { setPicked(i); onAnswer?.(c === String(moment.ans)); } }}
          style={{ ...bBase, textAlign: 'left', border: 'none', cursor: picked === null ? 'pointer' : 'default',
            borderRadius: radius.md, padding: '15px 18px', fontSize: 16.5, fontWeight: 600,
            background: win ? color.greenTint : lose ? color.redTint : color.fill,
            boxShadow: win ? `inset 0 0 0 2px ${color.green}` : lose ? `inset 0 0 0 2px ${color.red}` : 'none',
            color: color.ink }}>{c}</button>;
      })}
    </div>

    {picked !== null && <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 16.5, fontWeight: 700, color: right ? color.greenDeep : color.ink, marginBottom: right ? 0 : 10 }}>
        {right ? 'That’s it.' : `It was ${moment.ans}. Here’s the working:`}</div>
      {!right && <ol style={{ margin: 0, paddingLeft: 20, fontSize: 16, lineHeight: 1.6, color: color.mutedDeep }}>
        {(moment.steps || []).map((st, i) => <li key={i} style={{ marginBottom: 5 }}>{plain(st)}</li>)}</ol>}
      <Button variant="ink" style={{ marginTop: 16 }} onClick={onDone}>
        {right ? 'Serve them →' : 'Serve them anyway →'}</Button>
    </div>}
  </div>;
}


/* THE COUNTER — open day, one customer at a time (§0f 43a/43b).

   What stood here was a LIST: served/missed/left counters, the whole queue as
   rows, and "Serve next" / "Serve the rest" underneath. The day was a thing she
   processed. The counter is the day as she would actually live it — one person
   in front of her, the receipt beside her, and the maths being the job rather
   than a quiz laid over the top of it.

   Open day shows ONLY the counter. No reputation, no regulars, no bank, no
   phase tabs, no served/missed counts and no queue: those belong to prep and to
   the ledger, and on the counter they are five things competing with the one
   person waiting to be served.

   Rules kept from the code that was here: a customer's question pays nothing
   extra, takes one tap, NEVER blocks the sale, and the customer is always served
   at the right price. No Skip, no Try again, no bonus. */

const mono = { fontFamily: font.mono };
const cents = (n) => `$${(Math.round(n) / 100).toFixed(2)}`;

/** The one-cup receipt: the whole economics of her stand on one slip. */
function Receipt({ receipt, name, date, mark, phone }) {
  const r = receipt || {};
  const row = (label, value, opts = {}) => <div key={label}
    data-receipt-line={opts.key || label}
    style={{ ...bBase, ...mono, display: 'flex', justifyContent: 'space-between', gap: 12,
      fontSize: 13, lineHeight: 1.45, fontWeight: opts.bold ? 700 : 400,
      // One marker set at a time: the line THIS customer depends on.
      background: opts.lit ? color.goldHold : 'transparent', borderRadius: 4,
      padding: opts.lit ? '1px 4px' : '1px 0', margin: opts.lit ? '0 -4px' : 0 }}>
    <span>{label}</span><span>{value}</span></div>;

  const head = (t) => <div style={{ ...bBase, ...mono, fontSize: 11, fontWeight: 700,
    letterSpacing: '.1em', marginTop: 14, marginBottom: 4 }}>{t}</div>;
  const rule = <div style={{ borderTop: `1.5px dashed rgba(35,37,43,.3)`, margin: '10px 0' }} />;

  return <div data-receipt style={{ ...bBase, background: color.surface, padding: phone ? '20px 18px 4px' : '24px 22px 6px',
    filter: 'drop-shadow(0 1px 1px rgba(35,37,43,.05)) drop-shadow(0 8px 14px rgba(35,37,43,.07))',
    /* Square corners and a torn foot: it is a paper slip, not another card. */
    clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), 95% 100%, 90% calc(100% - 10px), 85% 100%, 80% calc(100% - 10px), 75% 100%, 70% calc(100% - 10px), 65% 100%, 60% calc(100% - 10px), 55% 100%, 50% calc(100% - 10px), 45% 100%, 40% calc(100% - 10px), 35% 100%, 30% calc(100% - 10px), 25% 100%, 20% calc(100% - 10px), 15% 100%, 10% calc(100% - 10px), 5% 100%, 0 calc(100% - 10px))',
    paddingBottom: 22 }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ ...mono, fontSize: 15, fontWeight: 700, letterSpacing: '.06em' }}>{(name || '').toUpperCase()}</div>
      <div style={{ ...mono, fontSize: 12, marginTop: 3 }}>One cup · today’s prices</div>
      <div style={{ ...mono, fontSize: 12, color: color.muted, marginTop: 2 }}>{date}</div>
    </div>
    {rule}
    {head('SELLS FOR')}
    {row('1 cup of lemonade', cents(r.sells || 0), { key: 'sells', lit: mark === 'sells' })}
    {rule}
    {head('COSTS TO MAKE')}
    {(r.lines || []).map(l => row(l.label, cents(l.cents), { key: l.key, lit: mark === l.key }))}
    {row('Subtotal', cents(r.subtotal || 0), { key: 'subtotal', bold: true })}
    {rule}
    {head('YOU KEEP')}
    <div style={{ ...mono, fontSize: 34, fontWeight: 600, lineHeight: 1.1 }}>{cents(r.keep || 0)}</div>
    <div style={{ ...mono, fontSize: 12, color: color.muted }}>Per cup, at full price.</div>
    {rule}
    {head('ON YOUR SHELF')}
    {(r.shelf || []).map(sh => row(sh.label, String(sh.n), { key: sh.key, lit: mark === sh.key }))}
  </div>;
}

/* The numbers in what a customer said, repeated as pills so she does not have to
   hold them in her head while she works (§0f attention rules). */
function OrderChips({ chips }) {
  if (!chips?.length) return null;
  return <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
    {chips.map((c, i) => <span key={i} data-order-chip style={{ ...bBase, background: color.fill,
      borderRadius: radius.full, padding: '7px 13px', fontSize: 15, fontWeight: 700 }}>{c}</span>)}
  </div>;
}

export function Counter({ customer, moment, receipt, bizName, date, at = 0, of = 0, served = 0,
  takings = 0, lastPaid = null, onAnswer, onServe, onHear, speaking = false,
  blobDir = '/blobs/', phone }) {
  const [picked, setPicked] = React.useState(null);
  React.useEffect(() => { setPicked(null); }, [customer, moment]);

  const q = moment || null;
  const choices = React.useMemo(() => (q
    ? [String(q.ans), ...(q.wrongs || []).map(String)]
      .sort((a, b) => (a.length + a.charCodeAt(0)) - (b.length + b.charCodeAt(0)))
    : []), [q]);
  const right = picked !== null && choices[picked] === String(q?.ans);
  const plain = (t) => String(t ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const said = plain(q?.q) || customerLine(customer, receipt);
  const answered = picked !== null;

  /* The receipt line this customer depends on. A question about price marks the
     cup price; a swap marks what is on the shelf. One at a time. */
  const mark = q ? (/\b(lemon|sugar|cup|swap|trade)\b/i.test(said) && !/price|each|%|off/i.test(said)
    ? 'lemons' : 'sells') : 'sells';

  /* §0f draws four PRICE keys, because the counter it imagines always asks
     "what does this customer pay?". The bank's business moments are not all
     that shape — some are judgements ("still profitable?") whose answers are
     sentences — and a sentence set in 34px/300 display numerals is unreadable
     and looks like a bug. So the key takes the shape of its own answer: a
     number gets the numerals, prose gets prose, and a row of two or three does
     not stretch to fill four columns. */
  const priceish = choices.length > 0 && choices.every(c => /^[$(-]?\s*[\d.,/]+\s*%?$/.test(c));
  const keys = q
    ? <div style={{ display: 'grid', gap: 10, marginTop: 14,
      gridTemplateColumns: phone
        ? (priceish ? '1fr 1fr' : '1fr')
        : `repeat(${Math.min(choices.length, priceish ? 4 : 3)}, 1fr)` }}>
      {choices.map((c, i) => {
        const isPick = picked === i, win = isPick && right, lose = isPick && !right;
        const isAns = answered && c === String(q.ans);
        return <button key={c} data-price-key data-shape={priceish ? 'price' : 'words'} onClick={() => {
          if (picked !== null) return;
          setPicked(i);
          // Pays nothing extra, and never blocks the sale.
          onAnswer?.(c === String(q.ans));
        }} style={{ ...bBase, border: 'none', cursor: picked === null ? 'pointer' : 'default',
          borderRadius: radius.lg, padding: phone ? '16px 14px' : '18px 18px', textAlign: 'left',
          background: win || (isAns && !isPick) ? color.greenTint : lose ? color.redTint : color.fill,
          color: win || (isAns && !isPick) ? color.greenDeep : lose ? color.loss : color.ink,
          ...(priceish
            ? numeral(phone ? 28 : 34)
            : { fontSize: phone ? 16 : 17, fontWeight: 600, lineHeight: 1.4 }) }}>{c}</button>;
      })}
    </div>
    : null;

  /* A wrong pick shows the sum, it does not take the sale away. */
  /* The sum, as ruled rows. §0f draws every step as "label ... value", which is
     true of the steps that CONTAIN a sum ("6 cups x $2.00 = $12.00") and false
     of the ones that are a sentence ("Compare to cost $1.01: margin is $0.49 —
     deal."). A sentence forced into two columns leaves an empty numeral slot
     where the answer should be, so a step with no `=` takes the whole row. */
  const sum = answered && !right && (q?.steps || []).length
    ? <div style={{ borderTop: `1px solid ${color.rule}`, marginTop: 18 }}>
      {q.steps.map((st, i, all) => {
        const txt = plain(st);
        const at = txt.lastIndexOf('=');
        const label = at > 0 ? txt.slice(0, at).trim() : txt;
        const value = at > 0 ? txt.slice(at + 1).trim() : '';
        return <div key={i} style={{ display: 'flex', alignItems: 'baseline',
          justifyContent: 'space-between', gap: 16, padding: '12px 0', borderBottom: `1px solid ${color.rule}` }}>
          <span style={{ fontSize: 17, fontWeight: 600, flex: 1 }}>{label}</span>
          {!!value && <span style={{ ...numeral(32), flex: 'none',
            color: i === all.length - 1 ? color.greenDeep : color.ink }}>{value}</span>}
        </div>;
      })}
    </div>
    : null;

  /* §0f's footer is written for a price answer ("Rang up $9.00. Ava is
     served."). Said of a judgement whose answer is a sentence it produces "It
     comes to yes — $0.49/cup", which is not English. The sentence follows the
     answer's shape, and the customer is always ONE person: "is served". */
  const who = customer?.name || 'The customer';
  const footLine = !q
    ? `${who} will pay ${cents(orderTotal(customer, receipt))}.`
    : !answered
      ? (priceish ? `What does ${who} pay?` : `What should ${who} be told?`)
      : right
        ? (priceish ? `Rang up ${String(q.ans)}. ${who} is served.` : `That’s it. ${who} is served.`)
        : (priceish
          ? `It comes to ${String(q.ans)}. Here’s the sum. ${who} paid that and is served.`
          : `It was “${String(q.ans)}”. Here’s the working — ${who} is served either way.`);

  const sheet = <div data-counter style={{ ...bBase, background: color.surface, borderRadius: radius.sheet,
    overflow: 'hidden', boxShadow: '0 1px 2px rgba(35,37,43,.04), 0 10px 28px rgba(35,37,43,.06)' }}>
    <div style={{ padding: phone ? '20px 18px' : '40px 40px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ width: phone ? 44 : 56, height: phone ? 44 : 56, flex: 'none', borderRadius: radius.full,
          background: color.fill, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
          <Blob name={customer?.blob || 'Selfie'} size={phone ? 32 : 40} dir={blobDir} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{customer?.name || 'A customer'}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: color.muted }}>
            {customer?.isRegular ? 'Regular' : 'New face'}</div>
        </div>
        {/* Hear it. Nothing waits on it. */}
        {onHear && <button data-hear onClick={() => onHear(said)} style={{ ...bBase, border: 'none', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 9, flex: 'none',
          background: color.fill, borderRadius: radius.full, padding: '6px 14px 6px 6px',
          fontSize: 13.5, fontWeight: 700 }}>
          <span style={{ width: 32, height: 32, borderRadius: radius.full, background: color.ink, color: '#fff',
            display: 'grid', placeItems: 'center', fontSize: 11 }}>{speaking ? '❚❚' : '▶'}</span>
          Hear {customer?.name || 'them'}</button>}
      </div>

      <div style={{ fontSize: phone ? 24 : 44, fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1.2,
        margin: phone ? '16px 0 0' : '26px 0 0', textWrap: 'pretty' }}>{said}</div>
      <OrderChips chips={orderChips(customer, q, receipt)} />

      {q && <>
        <Kicker style={{ margin: phone ? '18px 0 0' : '26px 0 0' }}>Ring it up</Kicker>
        {keys}
      </>}
      {sum}
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      padding: phone ? '16px 18px' : '20px 40px', borderTop: `1px solid ${color.rule}` }}>
      <span style={{ flex: 1, minWidth: 200, fontSize: 16, fontWeight: 600, color: color.muted }}>{footLine}</span>
      {(!q || answered) && <Button variant="ink" onClick={onServe}>
        {q ? 'Next customer →' : `Serve ${customer?.name || 'them'} · ${cents(orderTotal(customer, receipt))}`}</Button>}
    </div>
  </div>;

  /* Progress, not a crowd: one dot per customer and no waiting count. */
  const dots = of > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
    margin: '16px 4px 0' }}>
    <span style={{ fontSize: 14.5, fontWeight: 700 }}>
      {at < of ? `Customer ${at + 1} of ${of}` : `${served} of ${of} served`}</span>
    <div data-queue-dots style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1, minWidth: 120 }}>
      {Array.from({ length: of }, (_, i) => {
        const state = i < served ? 'served' : (i === at && at < of ? 'current' : 'todo');
        return <span key={i} data-customer={i + 1} data-state={state} style={{ width: 10, height: 10,
          borderRadius: radius.full, boxSizing: 'border-box',
          background: state === 'served' ? color.green : state === 'current' ? color.surface : color.todo,
          border: state === 'current' ? `2.5px solid ${color.ink}` : 'none' }} />;
      })}
    </div>
    <span style={{ fontSize: 14.5, fontWeight: 600, color: color.muted }}>No rush. The line waits.</span>
  </div>;

  const header = <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
    <div style={{ flex: phone ? 1 : 'none', width: phone ? 'auto' : 340 }}>
      <Kicker>Sales today</Kicker>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ ...mono, fontSize: 34, fontWeight: 600, color: color.greenDeep }}>{cents(takings)}</span>
        {/* The payoff arrives beside the takings the moment someone is served. */}
        {lastPaid != null && <span key={served} data-paid style={{ ...bBase, background: color.greenTint,
          color: color.greenDeep, borderRadius: radius.full, padding: '4px 10px', fontSize: 13, fontWeight: 800 }}>
          +{cents(lastPaid)}</span>}
      </div>
    </div>
    {!phone && <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 220 }}>
      <span style={{ width: 56, height: 56, flex: 'none' }}><Blob name="Startup" size={56} dir={blobDir} /></span>
      <div>
        <Kicker>Your stand · open</Kicker>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.025em', marginTop: 2 }}>{bizName}</div>
      </div>
    </div>}
  </div>;

  /* Phone is NOT drawn in §0f. The receipt is the reference she consults while
     she works, so on one column it goes BELOW the counter rather than above it:
     above, it would push the person asking off the screen. */
  return <div>
    {header}
    {phone
      ? <>{sheet}{dots}<div style={{ marginTop: 20 }}>
        <Receipt receipt={receipt} name={bizName} date={date} mark={mark} phone /></div></>
      : <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 48, alignItems: 'start' }}>
        <Receipt receipt={receipt} name={bizName} date={date} mark={mark} />
        <div>{sheet}{dots}</div>
      </div>}
  </div>;
}

/* What a customer with no question says, and what they pay. The engine gives an
   order in cups; the words are the stand's, not a template a kid would notice. */
function orderTotal(customer, receipt) {
  return (customer?.order?.cups || 1) * (receipt?.sells || 0);
}
function customerLine(customer, receipt) {
  const n = customer?.order?.cups || 1;
  return n === 1 ? 'One cup, please.' : `${n} cups, please.`;
}
/* The numbers in the request, as pills. Only numbers that are actually IN what
   they said — a chip for something unmentioned is a second thing to reconcile. */
function orderChips(customer, q, receipt) {
  const n = customer?.order?.cups || 0;
  const said = String(q?.q ?? '').replace(/<[^>]*>/g, '');
  const chips = [];
  if (n > 1) chips.push(`${n} cups`);
  if (receipt?.sells) chips.push(`$${(receipt.sells / 100).toFixed(2)} each`);
  const pct = said.match(/(\d+)\s*%/);
  if (pct) chips.push(`${pct[1]}% off`);
  return chips;
}

function OpenDay({ queue, counters, onServe, onServeRest, onClose, moment, onMomentAnswer, onMomentDone, blobDir, phone }) {
  const done = queue.every(q => q.status && q.status !== 'next' && q.status !== 'waiting');
  return <>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, padding: phone ? '18px 20px' : '22px 32px' }}>
      {[['Served', counters.served, color.greenDeep], ['Missed', counters.missed, color.ink], ['Left', counters.left, color.ink]]
        .map(([label, v, c]) => <div key={label}>
          <Kicker style={{ marginBottom: 6 }}>{label}</Kicker>
          <div style={{ ...numeral(36), color: c }}>{v}</div>
        </div>)}
    </div>
    {/* The moment sits ABOVE the line. It was rendered under the queue, which on a
        26-customer day put the question that stopped everything below the fold —
        she would have had to scroll past the whole line to find out why. */}
    {moment && <MomentCard moment={moment.moment} customer={moment.customer} blobDir={blobDir} phone={phone}
      onAnswer={onMomentAnswer} onDone={onMomentDone} />}
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
    {/* The serve controls are hidden while a moment is open: the line waits. */}
    {!moment && <div style={{ display: 'flex', gap: 10, padding: phone ? '18px 20px' : '20px 32px', flexWrap: 'wrap' }}>
      {!done && <Button variant="outline" onClick={onServeRest}>Serve the rest</Button>}
      {!done && <Button variant="ink" onClick={onServe}>Serve next</Button>}
      {done && <Button variant="ink" onClick={onClose}>Close the books →</Button>}
    </div>}
  </>;
}

/** Ledger: the day's money with its arithmetic showing. */
function Ledger({ result, phone, muted = false }) {
  // The one register sound in the product, on the one moment that earns it: the
  // books closing. Fired once per result, never again on a re-render.
  const reduced = useReducedMotion();
  const rung = React.useRef(null);
  React.useEffect(() => {
    if (!result || rung.current === result.day) return;
    rung.current = result.day;
    playRegister({ muted, reduced });
  }, [result, muted, reduced]);

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
        <CountUp value={result.profit} from={0} format={signed} reduced={reduced} /></div>
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
export function BusinessScreen({ data, blobDir = '/blobs/', muted = false, onEvent = () => {} }) {
  const ref = React.useRef(null);
  const phone = useWidth(ref) < 900;
  const d = data || {};
  const biz = d.biz || {};
  const u = d.unlocks || {};
  const [phase, setPhase] = React.useState('prep');
  const [asked, setAsked] = React.useState(false);

  const phases = PHASES.filter(([id]) => id !== 'grow' || u.ladder);
  const strip = asked ? (d.askKarla || { line: 'Looking good. Open when you’re ready.' }) : d.karla;

  /* OPEN DAY IS ITS OWN SCREEN (§0f). Not a tab inside the business frame: the
     phase tabs, the bank, the reputation column and the Karla strip all leave,
     because the counter is one person waiting to be served and everything else
     is something else competing for the same look. Prep and the ledger keep the
     frame they had. */
  if (phase === 'open') {
    const cur = (d.queue || [])[d.counter?.at ?? -1] || null;
    // A line that never formed is not a line that has been served.
    const of = d.counter?.of ?? 0;
    const done = of > 0 && (d.counter?.at ?? 0) >= of;
    return <div ref={ref} style={{ ...bBase, background: color.ground, minHeight: '100%',
      padding: phone ? '20px 16px 40px' : '36px 48px 56px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {done
          ? <div style={{ background: color.surface, borderRadius: radius.sheet, padding: phone ? 24 : 40 }}>
            <Kicker style={{ marginBottom: 10 }}>The line is done</Kicker>
            <h2 style={{ fontSize: phone ? 26 : 34, fontWeight: 600, letterSpacing: '-.025em', margin: '0 0 18px' }}>
              Everyone has been served.</h2>
            <Button variant="ink" onClick={() => { setPhase('ledger'); onEvent('close_books', {}); }}>
              Close the books →</Button>
          </div>
          : <Counter customer={cur} moment={cur?.moment && !cur?.momentDone ? cur.moment : null}
            receipt={d.receipt} bizName={biz.name} date={d.date}
            at={d.counter?.at || 0} of={d.counter?.of || 0} served={d.counter?.served || 0}
            takings={d.takings || 0} lastPaid={d.lastPaid ?? null}
            blobDir={blobDir} phone={phone}
            onHear={(line) => onEvent('hear_customer', { line })}
            onAnswer={(right) => onEvent('moment_answer', { right, skill: cur?.moment?.skill })}
            /* One button moves the line, whichever kind of customer it is: a
               question is CLOSED by serving them, never by a second tap. */
            onServe={() => onEvent(cur?.moment && !cur?.momentDone ? 'moment_done' : 'serve_next',
              { at: d.counter?.at })} />}
      </div>
    </div>;
  }

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
              onPromo={(p) => onEvent('promo', p)} onLesson={() => onEvent('start_lesson', {})}
              onOpen={() => { setPhase('open'); onEvent('open_day', {}); }} phone={phone} />}
            {phase === 'ledger' && <Ledger result={d.result} phone={phone} muted={muted} />}
            {phase === 'grow' && <Grow ladder={d.ladder} phone={phone} />}
          </div>
        </div>
      </div>
    </div>
  </div>;
}
