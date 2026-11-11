/* The weekly pilot report — the artifact a pilot family actually receives.

   Parent-facing, and designed to be read on a phone and screenshotted: one column,
   big figures, no horizontal rules to crop badly, and nothing that needs a second
   screen to make sense of.

   The ADHD laws are not decoration here. A weekly summary sent to a parent is the
   single most likely place for a streak, a percentage or a word like "only" to
   creep in, so:

     - show-up days are a COUNT. There is no chain, nothing to break, and a week
       with two days is reported as two days, not as a streak that ended.
     - a quiet week is reported as WHERE SHE IS. Not "fell behind", not "down from
       last week", not a trend arrow. The comparison a parent reaches for on a hard
       week is the one that does the damage.
     - nothing here scores the kid. No percentage of questions right, no accuracy,
       no grade. What is counted is what she did, not how well she did it.

   This component formats; it decides nothing. The figures come from the seam at
   apps/web/src/report.js, which folds them out of the engine. */
import { color, radius, font, numeral, dollars } from './tokens.js';
import { Kicker, Blob, Button } from './primitives.jsx';
import { useWidth } from './util.jsx';

const rBase = { fontFamily: font.family, boxSizing: 'border-box' };

/* §0d: three figures across, split by vertical rules rather than floated apart,
   so the row reads as one statement about her week instead of three cards. */
function Figure({ value, label, sub, tone, extra }) {
  return <div style={{ ...rBase, minWidth: 0 }}>
    <div style={{ ...numeral(64), color: tone || color.ink, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 15.5, fontWeight: 700, marginTop: 8 }}>{label}</div>
    {sub && <div style={{ fontSize: 13.5, fontWeight: 600, color: color.muted, marginTop: 3 }}>{sub}</div>}
    {extra}
  </div>;
}

/** The same figure as one ruled row, which is how a phone reads a column of them. */
function FigureRow({ value, label, sub, tone, last }) {
  return <div style={{ ...rBase, display: 'flex', alignItems: 'center', gap: 16,
    padding: '14px 0', borderBottom: last ? 'none' : `1px solid ${color.rule}` }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 15.5, fontWeight: 700 }}>{label}</div>
      {sub && <div style={{ fontSize: 13, fontWeight: 600, color: color.muted, marginTop: 2 }}>{sub}</div>}
    </div>
    <div style={{ ...numeral(40), color: tone || color.ink, flex: 'none' }}>{value}</div>
  </div>;
}

/* Three columns with hairlines between them, inset so the rule does not touch
   the numerals. A plain `gap` leaves three islands; the rules make it a row. */
const GRID = (phone) => ({ display: 'grid', gridTemplateColumns: phone ? '1fr' : 'repeat(3, 1fr)',
  gap: phone ? 0 : 28, alignItems: 'start' });
const COL = (i, phone) => (phone || i === 0 ? {} : {
  borderLeft: `1.5px solid ${color.rule}`, paddingLeft: 28, marginLeft: -0.75 });

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/* "2026-11-09" -> "Nov 9". A parent reads a date, not an ISO string, and the
   footer was printing the raw day. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function fmtDay(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  return m ? `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}` : '';
}
/** "Nov 9 to Nov 12", or nothing at all rather than a half-range. */
export function fmtRange(range) {
  const a = fmtDay(range?.from), b = fmtDay(range?.to);
  return a && b ? (a === b ? a : `${a} to ${b}`) : '';
}

export function PilotReport({ report, name = 'She', blobDir = '/blobs/', onOpenApprovals, onShare }) {
  const ref = React.useRef(null);
  const phone = useWidth(ref) < 760;
  const r = report || {};
  const money = r.money || {};
  const where = r.where || {};
  const range = fmtRange(r.range);
  const units = Math.max(0, where.units || 0);
  const approvals = money.waitingCents
    ? <Button variant="ink" size="sm" onClick={onOpenApprovals}>Open Approvals →</Button>
    : null;

  const section = (children, first) => <div style={{
    padding: phone ? (first ? '22px 20px 18px' : '20px 20px 18px') : (first ? 40 : '26px 40px 28px'),
    borderTop: first ? 'none' : `1px solid ${color.rule}` }}>{children}</div>;

  return <div ref={ref}>
    {/* The crumb sits on the ground above the sheet, so the sheet opens on what
        it has to say rather than on its own title. */}
    {!!range && <div style={{ ...rBase, fontSize: 13.5, fontWeight: 700, color: color.muted,
      margin: '0 0 12px 4px' }}>This week · {range}</div>}

    <div style={{ ...rBase, background: color.surface, borderRadius: radius.sheet, overflow: 'hidden' }}>
      {section(<>
        <h2 style={{ fontSize: phone ? 25 : 34, fontWeight: 600, letterSpacing: '-.025em',
          lineHeight: 1.15, margin: '0 0 8px' }}>
          {r.quiet ? `A quiet week. Here\u2019s where ${name} is.` : `Here\u2019s ${name}\u2019s week.`}</h2>
        <p style={{ fontSize: 16.5, lineHeight: 1.5, color: color.muted, margin: 0 }}>
          {r.quiet
            ? 'Nothing was recorded this week. The year waits where she left it \u2014 nothing expired, nothing was lost.'
            : 'What she did, not how well she did it. Nothing here is a score.'}</p>

        {/* A quiet week states where she is and stops. There is no row of zeroes,
            because three noughts under "days she showed up" is a verdict. */}
        {!r.quiet && (phone
          ? <div style={{ marginTop: 16 }}>
            {/* A count, never a streak, and never with a denominator: "3 of 7" on
                a Wednesday reads as four days missed, by arithmetic rather than
                by wording, and the week is not even over. */}
            <FigureRow value={r.showedUp?.days ?? 0} sub="so far this week"
              label={r.showedUp?.days === 1 ? 'day she showed up' : 'days she showed up'} />
            <FigureRow value={r.lessons?.finished ?? 0}
              label={r.lessons?.finished === 1 ? 'lesson finished' : 'lessons finished'} />
            <FigureRow last value={r.stand?.daysOpen ?? 0}
              label={r.stand?.daysOpen === 1 ? 'day at the stand' : 'days at the stand'} />
          </div>
          : <div style={{ ...GRID(phone), marginTop: 26 }}>
            <div style={COL(0, phone)}><Figure value={r.showedUp?.days ?? 0} sub="so far this week"
              label={r.showedUp?.days === 1 ? 'day she showed up' : 'days she showed up'} /></div>
            <div style={COL(1, phone)}><Figure value={r.lessons?.finished ?? 0}
              label={r.lessons?.finished === 1 ? 'lesson finished' : 'lessons finished'} /></div>
            <div style={COL(2, phone)}><Figure value={r.stand?.daysOpen ?? 0}
              label={r.stand?.daysOpen === 1 ? 'day at the stand' : 'days at the stand'} /></div>
          </div>)}
      </>, true)}

      {/* Money, in a parent's terms: what they okayed, what is waiting on them. */}
      {section(<>
        <Kicker style={{ marginBottom: phone ? 4 : 16 }}>Money</Kicker>
        {phone
          ? <>
            <FigureRow value={dollars(money.approvedCents || 0)} tone={color.greenDeep}
              label="you approved" sub={`of a ${dollars(money.capCents || 0)} weekly limit`} />
            <FigureRow last value={dollars(money.waitingCents || 0)} label="waiting on you"
              sub={money.waitingCents ? 'in Approvals' : 'nothing to do'} />
          </>
          : <div style={GRID(phone)}>
            <div style={COL(0, phone)}><Figure value={dollars(money.approvedCents || 0)} tone={color.greenDeep}
              label="you approved" sub={`of a ${dollars(money.capCents || 0)} weekly limit`} /></div>
            <div style={COL(1, phone)}><Figure value={dollars(money.waitingCents || 0)} label="waiting on you"
              sub={money.waitingCents ? 'in Approvals' : 'nothing to do'} /></div>
            <div style={{ ...COL(2, phone), display: 'flex', justifyContent: 'flex-end', alignSelf: 'center' }}>
              {approvals}</div>
          </div>}
        <div style={{ fontSize: 14, fontWeight: 600, color: color.muted, marginTop: 16 }}>
          Paid for effort. Never for scores.</div>
      </>)}

      {/* Where she is. Not how far behind — where. */}
      {section(<>
        <Kicker style={{ marginBottom: 12 }}>Where she is</Kicker>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: phone ? 21 : 25, fontWeight: 600, lineHeight: 1.3 }}>
              Grade {where.grade} · unit {where.unit} of {where.units}</div>
            <div style={{ fontSize: 16, color: color.muted, marginTop: 6 }}>
              {plural(where.lessonsDone ?? 0, 'lesson', 'lessons')} into a {where.lessonsTotal}-lesson year.
              {where.nextUp ? ` Next up: ${where.nextUp}.` : ''}</div>
          </div>
          {/* One dot per unit: done, the one she is on, and the rest. A shape she
              is somewhere inside, not a bar measuring how much is missing. */}
          {units > 0 && <div data-unit-dots style={{ display: 'flex', gap: 7, flex: 'none' }}>
            {Array.from({ length: units }, (_, i) => {
              const n = i + 1, current = n === where.unit;
              return <span key={n} data-unit={n} data-state={current ? 'current' : n < where.unit ? 'done' : 'todo'}
                style={{ width: 12, height: 12, borderRadius: radius.full, boxSizing: 'border-box',
                  background: current ? 'transparent' : n < where.unit ? color.ink : color.locked,
                  border: current ? `2px solid ${color.ink}` : 'none' }} />;
            })}
          </div>}
        </div>
      </>)}

      {/* An app-health line, worded so it can never read as a comment on the kid. */}
      {r.health && r.health.playable === false && section(
        <div style={{ background: color.fill, borderRadius: radius.dayCell,
          padding: phone ? '14px 16px' : '16px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ width: 40, height: 40, flex: 'none', display: 'grid', placeItems: 'center' }}>
            <Blob name="Timer" size={34} dir={blobDir} /></span>
          <div style={{ fontSize: 15.5, lineHeight: 1.45 }}>
            <b>We’re restocking a lesson.</b> That one is on us, not on her — it will be back
            without her losing a day.</div>
        </div>)}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        padding: phone ? '16px 20px' : '20px 40px', borderTop: `1px solid ${color.rule}` }}>
        <span style={{ flex: 1, minWidth: 180, fontSize: 14, fontWeight: 600, color: color.muted }}>
          Kampus · week {r.weekNumber ?? r.week}{range ? ` \u00b7 ${range}` : ''}</span>
        {onShare && <button onClick={onShare} style={{ ...rBase, border: 'none', cursor: 'pointer',
          background: color.fill, borderRadius: radius.full, padding: '10px 16px',
          fontSize: 13.5, fontWeight: 700 }}>{phone ? 'Share' : 'Share this week'}</button>}
        {phone && approvals}
      </div>
    </div>
  </div>;
}
