// Grown-ups surfaces — Modernist structure (square corners, 2px rules, flush-left, modular grid)
// in Kampus colors. Everything behind the Grown-ups nav uses THESE primitives, not the kid ones.
import { color, font } from './tokens.js';
import { Toggle, Segmented, TicketIcon } from './primitives.jsx';

const pFont = "'Inter Tight', sans-serif";
const pBase = { fontFamily: pFont, boxSizing: 'border-box', borderRadius: 0 };

/** 2px rule — the Modernist section divider. */
export function PRule({ style }) { return <div style={{ height: 2, background: color.ink, ...style }} />; }

export function PKicker({ children, style }) {
  return <div style={{ ...pBase, fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: color.textMuted, ...style }}>{children}</div>;
}

/** Section: kicker + 2px top rule; the only grouping device on parent surfaces. */
export function PSection({ kicker, children, style }) {
  return <section style={{ ...pBase, ...style }}>
    <PRule /><PKicker style={{ margin: '10px 0 18px' }}>{kicker}</PKicker>{children}</section>;
}

/** Flush-left button: label starts at the left padding edge, trailing arrow pushed right. */
export function PButton({ variant = 'primary', arrow, disabled, onClick, children, style }) {
  const [hover, setHover] = React.useState(false);
  const looks = {
    primary: { background: hover ? color.inkHover : color.ink, color: '#fff', border: `2px solid ${color.ink}` },
    outline: { background: hover ? color.fillHover : 'transparent', color: color.ink, border: `2px solid ${color.ink}` },
    gold: { background: hover ? color.goldMid : color.gold, color: color.ink, border: `2px solid ${color.ink}` },
    destructive: { background: hover ? color.redTint : 'transparent', color: color.red, border: `2px solid ${color.red}` },
  };
  return <button disabled={disabled} onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    style={{ ...pBase, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, textAlign: 'left',
      padding: '11px 14px', fontSize: 13.5, fontWeight: 700, letterSpacing: '.02em', cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1, ...looks[variant], ...style }}>
    <span>{children}</span>{arrow && <span aria-hidden="true">→</span>}</button>;
}

/** Data table with 2px header rule, 1px row rules. rows: array of cell arrays; align: per-column 'l'|'r'. */
export function PTable({ headers, rows, align = [], renderCell }) {
  const cell = (c, ci) => ({ textAlign: align[ci] === 'r' ? 'right' : 'left', padding: '10px 12px 10px 0' });
  return <table style={{ ...pBase, width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
    <thead><tr>{headers.map((h, i) => <th key={i} style={{ ...cell(h, i), fontSize: 11, fontWeight: 700, letterSpacing: '.14em',
      textTransform: 'uppercase', color: color.textMuted, borderBottom: `2px solid ${color.ink}`, paddingBottom: 8 }}>{h}</th>)}</tr></thead>
    <tbody>{rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci} style={{ ...cell(c, ci), borderBottom: `1px solid ${color.border}`, fontWeight: ci === 0 ? 600 : 500 }}>
      {renderCell ? renderCell(c, ri, ci) : c}</td>)}</tr>)}</tbody></table>;
}

/** Accuracy bar row (per world/skill), flush-left label, right-aligned value. */
export function PStatBar({ label, pct, barColor }) {
  return <div style={{ ...pBase, marginBottom: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
      <span>{label}</span><span style={{ color: pct < 70 ? color.red : color.ink }}>{pct}%</span></div>
    <div style={{ height: 8, background: color.track }}>
      <div style={{ width: pct + '%', height: '100%', background: barColor || (pct < 70 ? color.red : color.ink), transition: 'width .4s ease' }} /></div></div>;
}

/** Analytics block: accuracy by world + suggested focus + skills table. All data via props. */
export function ParentAnalytics({ worlds = [], focus = [], skills = [] }) {
  // worlds: [{name, pct, color}] · focus: [{skill, note}] · skills: [{skill, tries, hints, acc}]
  return <div style={{ ...pBase, display: 'grid', gap: 34 }}>
    <PSection kicker="accuracy by world">
      {worlds.map(w => <PStatBar key={w.name} label={w.name} pct={w.pct} barColor={w.color} />)}</PSection>
    {focus.length > 0 && <PSection kicker="suggested focus">
      {focus.map((f, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '10px 0',
        borderBottom: `1px solid ${color.border}`, fontSize: 13.5 }}>
        <span style={{ fontWeight: 700 }}>{f.skill}</span><span style={{ color: color.textMuted }}>{f.note}</span></div>)}</PSection>}
    <PSection kicker="skills">
      <PTable headers={['Skill', 'Tries', 'Hints', 'Accuracy']} align={['l', 'r', 'r', 'r']}
        rows={skills.map(s => [s.skill, s.tries, s.hints, s.acc + '%'])}
        renderCell={(c, ri, ci) => ci === 3 && skills[ri].acc < 70 ? <span style={{ color: color.red, fontWeight: 700 }}>{c}</span> : c} /></PSection></div>;
}

/** Ticket administration: balance, approval queue, reward menu. onEvent: 'approve'|'refund'|'menu_change'. */
export function TicketAdmin({ tickets = 0, weekTickets = 0, weekCap = 10, pending = [], menu = [], onEvent = () => {} }) {
  return <div style={{ ...pBase, display: 'grid', gap: 34 }}>
    <PSection kicker="ticket balance">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <span style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-.02em' }}>{tickets}</span>
        <TicketIcon size={22} />
        <span style={{ fontSize: 13, color: color.textMuted, fontWeight: 600 }}>{weekTickets}/{weekCap} earned this week · 1 ticket ≈ 50¢</span></div></PSection>
    <PSection kicker="waiting for you">
      {pending.length === 0 && <div style={{ fontSize: 13.5, color: color.textMuted }}>Nothing pending.</div>}
      {pending.map((p, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: `1px solid ${color.border}` }}>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{p.name}</span>
        <span style={{ fontSize: 13, color: color.textMuted }}>{p.cost} tickets</span>
        <PButton variant="primary" style={{ padding: '7px 12px' }} onClick={() => onEvent('approve', p)}>✓ Given</PButton>
        <PButton variant="outline" style={{ padding: '7px 12px' }} onClick={() => onEvent('refund', p)}>Refund</PButton></div>)}</PSection>
    <PSection kicker="reward menu">
      {menu.map((m, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: `1px solid ${color.border}`, fontSize: 13.5 }}>
        <span style={{ flex: 1, fontWeight: 600 }}>{m.name}</span>
        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => onEvent('menu_change', { ...m, cost: Math.max(1, m.cost - 1) })} style={{ ...pBase, width: 26, height: 26, border: `2px solid ${color.ink}`, background: 'none', fontWeight: 800, cursor: 'pointer' }}>−</button>
          <span style={{ fontWeight: 800, minWidth: 20, textAlign: 'center' }}>{m.cost}</span>
          <button onClick={() => onEvent('menu_change', { ...m, cost: m.cost + 1 })} style={{ ...pBase, width: 26, height: 26, border: `2px solid ${color.ink}`, background: 'none', fontWeight: 800, cursor: 'pointer' }}>+</button></span></div>)}</PSection></div>;
}

/** Settings panel: placement, pace, sound/voice, reset. onEvent: 'grade'|'session'|'focus'|'sound'|'voice_test'|'reset'. */
export function ParentSettings({ grade = 4, sessionMins = 0, focusMode = true, sound = true, onEvent = () => {} }) {
  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: `1px solid ${color.border}` };
  const lbl = (t, sub) => <span style={{ fontSize: 14, fontWeight: 700 }}>{t}{sub && <><br /><span style={{ fontSize: 12, color: color.textMuted, fontWeight: 500 }}>{sub}</span></>}</span>;
  return <div style={{ ...pBase }}>
    <PSection kicker="placement">
      <div style={{ display: 'flex', gap: 6 }}>
        {[3, 4, 5, 6, 7, 8].map(g => <button key={g} onClick={() => onEvent('grade', g)}
          style={{ ...pBase, width: 48, height: 48, border: `2px solid ${color.ink}`, background: g === grade ? color.ink : 'none',
            color: g === grade ? '#fff' : color.ink, fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>{g}</button>)}</div>
      <div style={{ fontSize: 12, color: color.textMuted, marginTop: 10 }}>Grades level up by test — 20 questions, 16 to pass, failing costs nothing.</div></PSection>
    <PSection kicker="pace" style={{ marginTop: 34 }}>
      <div style={row}>{lbl('Session length', 'Times the session, never the kid — a gentle wind-down, no cutoffs.')}
        <Segmented value={sessionMins} onChange={(v) => onEvent('session', v)}
          options={[{ value: 0, label: 'Off' }, { value: 10, label: '10m' }, { value: 15, label: '15m' }, { value: 20, label: '20m' }]} /></div>
      <div style={row}>{lbl('Focus mode', 'Hides Kredits and streak while a question is up.')}
        <Toggle on={focusMode} onChange={(v) => onEvent('focus', v)} /></div></PSection>
    <PSection kicker="sound & voice" style={{ marginTop: 34 }}>
      <div style={row}>{lbl('Sound effects')}<Toggle on={sound} onChange={(v) => onEvent('sound', v)} /></div>
      <div style={row}>{lbl('Read-aloud voice', 'Best on Edge (Natural voices), then Chrome.')}
        <PButton variant="outline" style={{ padding: '7px 12px' }} onClick={() => onEvent('voice_test')}>Hear it</PButton></div></PSection>
    <PSection kicker="danger" style={{ marginTop: 34 }}>
      <div style={row}>{lbl('Full reset', 'Erases all progress, Kredits and tickets on this device.')}
        <PButton variant="destructive" style={{ padding: '7px 12px' }} onClick={() => onEvent('reset')}>Reset everything</PButton></div></PSection></div>;
}

/** Parent onboarding — 4 steps, Modernist structure, adult copy. onEvent: 'done'|'later' with settings payload. */
export function ParentOnboarding({ kidGrade = 4, blobDir = 'blobs/', onEvent = () => {} }) {
  const [step, setStep] = React.useState(0);
  const [s, set] = React.useState({ grade: kidGrade, sessionMins: 0, focusMode: true, menu: [
    { name: '30 min screen time', cost: 3 }, { name: 'Pick the movie', cost: 4 }, { name: '$5 treat / 500 Kredits', cost: 10 }] });
  const H = ({ k, t, children }) => <div>
    <PKicker style={{ marginBottom: 14 }}>{k}</PKicker>
    <h1 style={{ fontFamily: pFont, fontSize: 42, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.05, margin: '0 0 14px' }}>{t}</h1>
    <div style={{ fontSize: 15.5, lineHeight: 1.55, color: color.textSecondary, marginBottom: 26 }}>{children}</div></div>;
  const steps = [
    <div key="0"><img src={blobDir + 'Coach.svg'} alt="" style={{ width: 150, height: 150, objectFit: 'contain', margin: '0 0 8px -14px' }} />
      <H k="grown-ups setup · 2 minutes" t="Your kid plays. You steer.">Kampus is self-paced math with a real-world reward loop. Kredits are in-game; tickets are real — you hand them out. Nothing here is visible to your kid.</H>
      <div style={{ display: 'flex', gap: 10 }}><PButton variant="primary" arrow onClick={() => setStep(1)} style={{ minWidth: 180 }}>Set it up</PButton>
        <PButton variant="outline" onClick={() => onEvent('later', s)}>Later</PButton></div></div>,
    <div key="1"><H k="step 1 of 3" t="Confirm the grade.">They picked grade {kidGrade}. Grades level up by test — 20 questions, 16 to pass, failing costs nothing.</H>
      <div style={{ display: 'flex', gap: 6, marginBottom: 26 }}>
        {[3, 4, 5, 6, 7, 8].map(g => <button key={g} onClick={() => set({ ...s, grade: g })}
          style={{ ...pBase, width: 52, height: 52, border: `2px solid ${color.ink}`, background: g === s.grade ? color.ink : 'none',
            color: g === s.grade ? '#fff' : color.ink, fontSize: 17, fontWeight: 800, cursor: 'pointer' }}>{g}</button>)}</div>
      <PButton variant="primary" arrow onClick={() => setStep(2)} style={{ minWidth: 180 }}>Looks right</PButton></div>,
    <div key="2"><H k="step 2 of 3" t="Set the pace.">Both of these can change any time on the Grown-ups screen.</H>
      <div style={{ borderTop: `2px solid ${color.ink}`, marginBottom: 26 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: `1px solid ${color.border}` }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Session length<br /><span style={{ fontSize: 12, color: color.textMuted, fontWeight: 500 }}>Times the session, never the kid — a gentle wind-down, no cutoffs.</span></span>
          <Segmented value={s.sessionMins} onChange={(v) => set({ ...s, sessionMins: v })}
            options={[{ value: 0, label: 'Off' }, { value: 10, label: '10m' }, { value: 15, label: '15m' }, { value: 20, label: '20m' }]} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: `1px solid ${color.border}` }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Focus mode<br /><span style={{ fontSize: 12, color: color.textMuted, fontWeight: 500 }}>Hides Kredits and streak while a question is up.</span></span>
          <Toggle on={s.focusMode} onChange={(v) => set({ ...s, focusMode: v })} /></div></div>
      <PButton variant="primary" arrow onClick={() => setStep(3)} style={{ minWidth: 180 }}>Next</PButton></div>,
    <div key="3"><H k="step 3 of 3" t="Set the reward menu.">Tickets cap at 10 a week. Rule of thumb: 1 ticket ≈ 50¢.</H>
      <div style={{ borderTop: `2px solid ${color.ink}`, marginBottom: 26 }}>
        {s.menu.map((m, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: `1px solid ${color.border}`, fontSize: 13.5 }}>
          <TicketIcon size={16} /><span style={{ flex: 1, fontWeight: 600 }}>{m.name}</span>
          <button onClick={() => set({ ...s, menu: s.menu.map((x, xi) => xi === i ? { ...x, cost: Math.max(1, x.cost - 1) } : x) })} style={{ ...pBase, width: 26, height: 26, border: `2px solid ${color.ink}`, background: 'none', fontWeight: 800, cursor: 'pointer' }}>−</button>
          <span style={{ fontWeight: 800, minWidth: 20, textAlign: 'center' }}>{m.cost}</span>
          <button onClick={() => set({ ...s, menu: s.menu.map((x, xi) => xi === i ? { ...x, cost: x.cost + 1 } : x) })} style={{ ...pBase, width: 26, height: 26, border: `2px solid ${color.ink}`, background: 'none', fontWeight: 800, cursor: 'pointer' }}>+</button></div>)}</div>
      <PButton variant="primary" arrow onClick={() => onEvent('done', s)} style={{ minWidth: 220 }}>Done — hand it back</PButton></div>];
  return <div style={{ ...pBase, background: color.ground, padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
    <div style={{ maxWidth: 520, width: '92%' }}>{steps[step]}</div></div>;
}

