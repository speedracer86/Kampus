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
import { Kicker, Blob } from './primitives.jsx';
import { useWidth } from './util.jsx';

const rBase = { fontFamily: font.family, boxSizing: 'border-box' };

/** One big number with its plain-language label underneath. */
function Figure({ value, label, sub, tone, phone }) {
  return <div style={{ ...rBase, flex: '1 1 140px', minWidth: 130 }}>
    <div style={{ ...numeral(phone ? 48 : 60), color: tone || color.ink, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 15.5, fontWeight: 700, marginTop: 6 }}>{label}</div>
    {sub && <div style={{ fontSize: 13.5, color: color.muted, marginTop: 2 }}>{sub}</div>}
  </div>;
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export function PilotReport({ report, name = 'She', blobDir = '/blobs/' }) {
  const ref = React.useRef(null);
  const phone = useWidth(ref) < 760;
  const r = report || {};
  const money = r.money || {};
  const where = r.where || {};

  return <div ref={ref} style={{ ...rBase, background: color.surface, borderRadius: radius.sheet,
    padding: phone ? '24px 20px 28px' : '34px 36px 38px' }}>

    <Kicker style={{ marginBottom: 8 }}>This week · {name}</Kicker>
    <h2 style={{ fontSize: phone ? 27 : 34, fontWeight: 600, letterSpacing: '-.025em',
      lineHeight: 1.15, margin: '0 0 6px' }}>
      {r.quiet ? `A quiet week. Here's where ${name} is.` : `Here's ${name}'s week.`}</h2>
    <p style={{ fontSize: 16.5, lineHeight: 1.5, color: color.muted, margin: 0 }}>
      {r.quiet
        ? 'Nothing was recorded this week. The year waits where she left it — nothing expired, nothing was lost.'
        : 'What she did, not how well she did it. Nothing here is a score.'}</p>

    {!r.quiet && <div style={{ display: 'flex', flexWrap: 'wrap', gap: phone ? 20 : 28, margin: '26px 0 4px' }}>
      {/* A count. Never a streak — there is no chain here to break. */}
      {/* No denominator. "3 out of 7" on a Wednesday reads as four days missed,
          which is the deficit framing arriving by arithmetic instead of by wording —
          and the week is not even over. A count, and only a count. */}
      <Figure phone={phone} value={r.showedUp?.days ?? 0}
        label={(r.showedUp?.days === 1) ? 'day she showed up' : 'days she showed up'}
        sub="so far this week" />
      <Figure phone={phone} value={r.lessons?.finished ?? 0}
        label={(r.lessons?.finished === 1) ? 'lesson finished' : 'lessons finished'} />
      <Figure phone={phone} value={r.stand?.daysOpen ?? 0}
        label={(r.stand?.daysOpen === 1) ? 'day at the stand' : 'days at the stand'} />
    </div>}

    {/* Money, in a parent's terms: what was okayed, what is waiting on them. */}
    <div style={{ borderTop: `1px solid ${color.rule}`, marginTop: 26, paddingTop: 22 }}>
      <Kicker style={{ marginBottom: 14 }}>Money</Kicker>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: phone ? 20 : 28 }}>
        <Figure phone={phone} value={dollars(money.approvedCents || 0)} tone={color.greenDeep}
          label="you approved" sub={`of a ${dollars(money.capCents || 0)} weekly limit`} />
        <Figure phone={phone} value={dollars(money.waitingCents || 0)}
          label="waiting on you" sub={money.waitingCents ? 'in Approvals' : 'nothing to do'} />
      </div>
      <div style={{ fontSize: 14, color: color.muted, marginTop: 16 }}>Paid for effort. Never for scores.</div>
    </div>

    {/* Where she is. Not how far behind — where. */}
    <div style={{ borderTop: `1px solid ${color.rule}`, marginTop: 24, paddingTop: 22 }}>
      <Kicker style={{ marginBottom: 12 }}>Where she is</Kicker>
      <div style={{ fontSize: phone ? 21 : 25, fontWeight: 600, lineHeight: 1.3 }}>
        Grade {where.grade} · unit {where.unit} of {where.units}
      </div>
      <div style={{ fontSize: 16, color: color.muted, marginTop: 6 }}>
        {plural(where.lessonsDone ?? 0, 'lesson', 'lessons')} into a {where.lessonsTotal}-lesson year.
        {where.nextUp ? ` Next up: ${where.nextUp}.` : ''}
      </div>
    </div>

    {/* An app-health line, worded so it can never read as a comment on the kid. */}
    {r.health && r.health.playable === false && <div style={{ background: color.fill, borderRadius: radius.dayCell,
      padding: phone ? '14px 16px' : '16px 20px', marginTop: 22, display: 'flex', gap: 14, alignItems: 'center' }}>
      <span style={{ width: 40, height: 40, flex: 'none', display: 'grid', placeItems: 'center' }}>
        <Blob name="Timer" size={34} dir={blobDir} /></span>
      <div style={{ fontSize: 15.5, lineHeight: 1.45 }}>
        <b>We're restocking a lesson.</b> That one is on us, not on her — it will be back without her losing a day.
      </div>
    </div>}

    <div style={{ fontSize: 13, color: color.muted, marginTop: 24 }}>
      Kampus · week {r.week}{r.showedUp?.dates?.length ? ` · ${r.showedUp.dates[0]} to ${r.showedUp.dates[r.showedUp.dates.length - 1]}` : ''}
    </div>
  </div>;
}
