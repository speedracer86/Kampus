/* Grown-ups — STYLE_GUIDE §0 "Grown-ups" (11a desktop, 11b phone).

   Three tabs behind the PIN gate: Approvals (the queue that turns effort into real
   money), Progress (where each world stands), and Settings. The weekly limit bar and
   the line under it — "Paid for effort. Never for scores." — are always visible,
   because that is the promise the whole reward system rests on.

   Presentational: every total and every decision comes from @kampus/engine's
   earnings.js; this reports intent through onEvent. */
import { color, radius, font, numeral, dollars } from './tokens.js';
import { Button, Kicker, Chip, Toggle } from './primitives.jsx';
import { useWidth } from './util.jsx';
import { VerdictPill } from './assessment.jsx';

const gBase = { fontFamily: font.family, boxSizing: 'border-box' };

/** Segmented pills — the §0 settings control. */
export function PillGroup({ options, value, onChange }) {
  return <div style={{ ...gBase, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    {options.map(o => {
      const sel = o.value === value;
      return <button key={String(o.value)} onClick={() => onChange && onChange(o.value)}
        style={{ ...gBase, border: 'none', cursor: 'pointer', borderRadius: radius.full,
          padding: '10px 18px', fontSize: 14, fontWeight: 700,
          background: sel ? color.ink : color.fill, color: sel ? '#fff' : color.ink }}>{o.label}</button>;
    })}
  </div>;
}

function SettingRow({ label, sub, children }) {
  return <div style={{ ...gBase, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
    padding: '20px 0', borderBottom: `1px solid ${color.rule}` }}>
    <div style={{ flex: 1, minWidth: 180 }}>
      <div style={{ fontSize: 17, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 13.5, color: color.muted, marginTop: 3 }}>{sub}</div>}
    </div>
    {children}
  </div>;
}

/** One pending earning, with the §0 button pair and the "Over limit" state. */
function EarnedRow({ row, overLimit, onApprove, onHold, onUndo, phone }) {
  const closed = row.status !== 'pending';
  return <div style={{ ...gBase, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
    padding: phone ? '16px 20px' : '18px 32px', borderBottom: `1px solid ${color.rule}` }}>
    <div style={{ flex: 1, minWidth: 170 }}>
      <div style={{ fontSize: 17, fontWeight: 600 }}>{row.label}</div>
      <div style={{ fontSize: 13.5, color: color.muted, marginTop: 2 }}>{row.day}</div>
    </div>
    <div style={{ ...numeral(32), color: color.greenDeep }}>{dollars(row.cents)}</div>
    {closed
      ? <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ ...gBase, background: row.status === 'approved' ? color.greenTint : color.track,
          color: row.status === 'approved' ? color.greenDeep : color.mutedDeep, borderRadius: radius.full,
          padding: '6px 13px', fontSize: 13, fontWeight: 700 }}>
          {row.status === 'approved' ? 'Approved' : 'On hold'}</span>
        <Button variant="ghost" size="sm" onClick={() => onUndo(row)}>Undo</Button>
      </div>
      : <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button variant="outline" size="sm" onClick={() => onHold(row)}>Hold</Button>
        <Button variant="ink" size="sm" disabled={overLimit} onClick={() => onApprove(row)}>
          {overLimit ? 'Over limit' : 'Approve'}</Button>
      </div>}
  </div>;
}

/**
 * data: {kid{name, grade, day, daysPlayed}, pending[], asks[], approvedThisWeek, cap,
 *        progress[], stats[], settings{cap, lessonLength, allowBlitz, sprints, vacation}}
 */
export function GrownUps({ data, onEvent = () => {} }) {
  const ref = React.useRef(null);
  const phone = useWidth(ref) < 900;
  const [tab, setTab] = React.useState('approvals');
  const d = data || {};
  const kid = d.kid || {};
  const s = d.settings || {};
  const cap = s.cap ?? 500;
  const used = d.approvedThisWeek || 0;
  const capLeft = Math.max(0, cap - used);

  const TABS = [
    ['approvals', 'Approvals', (d.pending || []).length + (d.asks || []).length],
    ['progress', 'Progress', 0],
    ['settings', 'Settings', 0],
  ];

  const sheet = (children) => <div style={{ background: color.surface, borderRadius: radius.sheet, overflow: 'hidden' }}>{children}</div>;

  return <div ref={ref} style={{ ...gBase, background: color.ground, minHeight: '100%', padding: phone ? '20px 16px 40px' : '36px 48px 48px' }}>
    <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid',
      gridTemplateColumns: phone ? '1fr' : '340px 1fr', gap: 48, alignItems: 'start' }}>

      <div>
        <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.025em', margin: '0 0 4px' }}>{kid.name || 'Your kid'}</h1>
        <div style={{ fontSize: 14, color: color.muted, fontWeight: 600 }}>
          {/* Days played, not a streak: §4 bans the chain on the kid's side, and showing
              a parent one just moves the guilt. */}
          Grade {kid.grade} · day {kid.day} · {kid.daysPlayed || 0} days played</div>

        <div style={{ marginTop: 22 }}>
          {TABS.map(([id, label, count]) => <button key={id} onClick={() => setTab(id)}
            style={{ ...gBase, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 6,
              borderRadius: 16, padding: '13px 16px', fontSize: 16,
              fontWeight: tab === id ? 800 : 600,
              background: tab === id ? color.surface : 'transparent', color: color.ink }}>
            <span>{label}</span>
            {count > 0 && <span style={{ background: color.ink, color: '#fff', borderRadius: radius.full,
              minWidth: 22, padding: '2px 8px', fontSize: 12.5, fontWeight: 700, textAlign: 'center' }}>{count}</span>}
          </button>)}
        </div>

        <div style={{ background: color.surface, borderRadius: 16, padding: 18, marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>
            <span>This week</span><span>{dollars(used)} of {dollars(cap)}</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: color.track, overflow: 'hidden' }}>
            <div style={{ width: `${cap ? Math.min(100, (used / cap) * 100) : 0}%`, height: '100%', background: color.greenDeep }} />
          </div>
          <div style={{ fontSize: 13, color: color.muted, marginTop: 10 }}>Paid for effort. Never for scores.</div>
        </div>
      </div>

      <div>
        {tab === 'approvals' && sheet(<>
          <div style={{ padding: phone ? '16px 20px 6px' : '18px 32px 6px' }}><Kicker>Earned</Kicker></div>
          {(d.pending || []).length
            ? (d.pending || []).map(row => <EarnedRow key={row.id} row={row} phone={phone}
              overLimit={row.status === 'pending' && row.cents > capLeft}
              onApprove={r => onEvent('approve_earning', r)}
              onHold={r => onEvent('hold_earning', r)}
              onUndo={r => onEvent('undo_earning', r)} />)
            : <div style={{ padding: phone ? '0 20px 18px' : '0 32px 22px', fontSize: 15, color: color.muted }}>
              Nothing waiting. New effort shows up here.</div>}

          <div style={{ padding: phone ? '16px 20px 6px' : '18px 32px 6px' }}><Kicker>Asks</Kicker></div>
          {(d.asks || []).length
            ? (d.asks || []).map(a => <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 16,
              flexWrap: 'wrap', padding: phone ? '16px 20px' : '18px 32px', borderBottom: `1px solid ${color.rule}` }}>
              <div style={{ flex: 1, minWidth: 170, fontSize: 17, fontWeight: 600 }}>{a.label}</div>
              <div style={{ ...numeral(32) }}>{dollars(a.cents)}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="outline" size="sm" onClick={() => onEvent('decline_ask', a)}>Not now</Button>
                <Button variant="ink" size="sm" onClick={() => onEvent('approve_ask', a)}>Say yes</Button>
              </div>
            </div>)
            : <div style={{ padding: phone ? '0 20px 18px' : '0 32px 22px', fontSize: 15, color: color.muted }}>
              No asks waiting.</div>}

          <div style={{ padding: phone ? '16px 20px' : '18px 32px' }}>
            <Button variant="ink" disabled={!(d.pending || []).some(r => r.status === 'pending' && r.cents <= capLeft)}
              onClick={() => onEvent('approve_all', {})}>Approve all earned</Button>
          </div>
        </>)}

        {tab === 'progress' && <>
          <div style={{ display: 'grid', gridTemplateColumns: phone ? '1fr' : 'repeat(3, 1fr)', gap: 14, marginBottom: 22 }}>
            {(d.stats || []).map(st => <div key={st.label} style={{ background: color.fill, borderRadius: radius.lg, padding: 22 }}>
              <Kicker style={{ marginBottom: 8 }}>{st.label}</Kicker>
              <div style={{ ...numeral(40) }}>{st.value}</div>
            </div>)}
          </div>
          {sheet((d.progress || []).map(w => <div key={w.topic} style={{ display: 'flex', alignItems: 'center', gap: 16,
            flexWrap: 'wrap', padding: phone ? '16px 20px' : '18px 32px', borderBottom: `1px solid ${color.rule}` }}>
            <span style={{ width: 10, height: 10, borderRadius: radius.full, background: w.color, flex: 'none' }} />
            <div style={{ flex: 1, minWidth: 170 }}>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{w.name}</div>
              <div style={{ fontSize: 13.5, color: color.muted, marginTop: 2 }}>unit {w.unit} of 7</div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: color.muted }}>Grade {w.placement}</span>
            <VerdictPill verdict={w.verdict} />
          </div>))}
        </>}

        {tab === 'settings' && sheet(<div style={{ padding: phone ? '8px 20px 20px' : '10px 32px 26px' }}>
          <SettingRow label="Weekly limit" sub="The most real money that can be approved in a week.">
            <PillGroup value={cap} onChange={v => onEvent('set_cap', v)}
              options={[{ value: 300, label: '$3' }, { value: 500, label: '$5' }, { value: 800, label: '$8' }]} />
          </SettingRow>
          <SettingRow label="Lesson length" sub="A target, never a timer.">
            <PillGroup value={s.lessonLength ?? 17} onChange={v => onEvent('set_lesson_length', v)}
              options={[{ value: 12, label: '12 min' }, { value: 17, label: '17 min' }, { value: 22, label: '22 min' }]} />
          </SettingRow>
          <SettingRow label="Allow Blitz" sub="Opt-in speed rounds. Off means untimed everywhere.">
            <Toggle on={!!s.allowBlitz} onChange={v => onEvent('set_allow_blitz', v)} />
          </SettingRow>
          <SettingRow label="Fluency sprints" sub="Short fact practice. No countdown either way.">
            <Toggle on={!!s.sprints} onChange={v => onEvent('set_sprints', v)} />
          </SettingRow>
          <SettingRow label="Shop vacation mode" sub="Freezes the business: no reputation drift while you're away.">
            <Toggle on={!!s.vacation} onChange={v => onEvent('set_vacation', v)} />
          </SettingRow>
          <SettingRow label="Business coach" sub="Karla's one-line tips on the business screen.">
            <Toggle on={s.businessCoach !== false} onChange={v => onEvent('set_business_coach', v)} />
          </SettingRow>
          <SettingRow label="Sound" sub="The register and the count-ups. Motion and sound both off in reduced-motion mode.">
            <Toggle on={s.sound !== false} onChange={v => onEvent('set_sound', v)} />
          </SettingRow>
        </div>)}
      </div>
    </div>
  </div>;
}
