// Kampus app components — composed from primitives + tokens.
import { color, type, radius, shadow, font, numeral, worldTint, glassBlur, motion } from './tokens.js';
import { Button, Card, Kicker, Chip, ProgressBar, TierDots, KreditCoin, TicketIcon, Logo, Blob } from './primitives.jsx';

const base = { fontFamily: font.family, boxSizing: 'border-box' };

export function NavBar({ items, active, onNav, weekLabel, kredits, avatar, onShop, blobDir }) {
  // items: [{id, label, dot}]
  return <nav style={{ ...base, borderBottom: `1px solid ${color.hairline}`, position: 'sticky', top: 0, background: color.glass,
    backdropFilter: glassBlur, WebkitBackdropFilter: glassBlur, zIndex: 10, padding: '12px clamp(14px, 2.5vw, 32px)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, maxWidth: 1080, margin: '0 auto', flexWrap: 'wrap', rowGap: 6 }}>
    <span style={{ marginRight: 'clamp(8px, 1.5vw, 22px)', flex: 'none' }}><Logo /></span>
    <div style={{ flex: 1 }} />
    {items.map(n => { const sel = n.id === active;
      return <NavItem key={n.id} label={n.label} dot={n.dot} active={sel} onClick={() => onNav && onNav(n.id)} />; })}
    <div style={{ flex: 1 }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 16 }}>
      {weekLabel && <Chip dot={color.orange}>{weekLabel}</Chip>}
      <button onClick={onShop} style={{ ...base, display: 'flex', alignItems: 'center', gap: 7, background: color.surface,
        border: `1px solid ${color.border}`, borderRadius: radius.full, padding: '7px 8px 7px 14px', fontSize: 13.5, fontWeight: 700,
        cursor: 'pointer', whiteSpace: 'nowrap', flex: 'none' }}>
        <KreditCoin size={16} /><span style={{ color: color.greenDeep, fontSize: 15.5, fontWeight: 800 }}>{kredits}</span>
        <span style={{ width: 20, height: 20, borderRadius: radius.full, background: color.green, color: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>+</span></button>
      {avatar && <Blob name={avatar} size={30} dir={blobDir} style={{ background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.sm, padding: 3 }} />}
    </div></div></nav>;
}

function NavItem({ label, dot, active, onClick }) {
  const [hover, setHover] = React.useState(false);
  return <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    style={{ ...base, display: 'flex', alignItems: 'center', gap: 9, background: active || hover ? color.fillHover : 'none',
      border: 'none', borderRadius: radius.full, padding: '10px 16px', fontSize: 14.5, fontWeight: active ? 800 : 600,
      color: color.ink, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background .2s' }}>
    <span style={{ width: 8, height: 8, borderRadius: radius.full, background: dot, flex: 'none' }} />{label}</button>;
}

export function GradeCard({ grade, status = 'locked', pct = 0, detail }) {
  // status: 'passed' | 'current' | 'locked'
  const cur = status === 'current', passed = status === 'passed';
  const fg = cur ? '#fff' : color.ink, sub = passed ? color.goldDeep : cur ? color.onInkMuted : color.textMuted;
  return <div style={{ ...base, minWidth: 0, background: passed ? color.goldTint : cur ? color.ink : color.surface,
    border: `1px solid ${passed ? color.goldBorder : cur ? color.ink : color.border}`,
    borderRadius: radius.lg, padding: '14px 14px 12px', opacity: status === 'locked' ? 0.45 : 1 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
      <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.01em', color: fg, whiteSpace: 'nowrap' }}>Grade {grade}</span>
      {passed && <svg width="18" height="18" viewBox="0 0 24 24"><path d="M8 21L10.5 14M16 21L13.5 14" stroke={color.goldDeep} strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="9" r="6.5" fill={color.gold} stroke={color.goldDeep} strokeWidth="1.8" /><path d="M12 6.2L12.9 8H14.8L13.3 9.3L13.8 11.2L12 10.1L10.2 11.2L10.7 9.3L9.2 8H11.1Z" fill={color.goldDeep} /></svg>}
      {status === 'locked' && <svg width="14" height="14" viewBox="0 0 24 24"><path d="M7 10V8a5 5 0 0110 0v2M6 10h12v10H6z" stroke={color.textMuted} strokeWidth="2" fill="none" strokeLinejoin="round" /></svg>}
    </div>
    <div style={{ ...type.kicker, fontSize: 11, letterSpacing: '.1em', color: sub }}>{passed ? 'conquered' : status}</div>
    <ProgressBar value={passed ? 100 : cur ? pct : 0} height={5} style={{ marginTop: 9 }}
      track={cur ? color.onInkTrack : passed ? '#F1E4C4' : color.track} fill={passed ? color.gold : cur ? color.lime : color.ink} />
    <div style={{ fontSize: 11, fontWeight: 600, color: sub, marginTop: 6 }}>{detail}</div></div>;
}

export function WorldTile({ name, skill, worldColor, blob, tierLabel, tier = 0, onPlay, blobDir, wellH = 150, wellBlob = 96, tintPct = 24 }) {
  const [hover, setHover] = React.useState(false);
  return <button onClick={onPlay} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    style={{ ...base, background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.lg,
      padding: 0, cursor: 'pointer', textAlign: 'left', overflow: 'hidden', display: 'block', width: '100%',
      boxShadow: hover ? shadow.float : 'none', transform: hover ? 'translateY(-3px)' : 'none', transition: motion.lift }}>
    <div style={{ background: worldTint(worldColor, tintPct), height: wellH, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ position: 'absolute', top: 10, left: 10, background: color.surface, borderRadius: radius.sm,
        padding: '4px 9px', fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: color.textSecondary }}>{tierLabel}</span>
      <Blob name={blob} size={wellBlob} dir={blobDir} /></div>
    <div style={{ padding: '14px 16px 16px' }}>
      <div style={{ ...type.cardTitle, fontSize: 21, color: color.ink, marginBottom: 7 }}>{name}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <TierDots earned={tier} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: color.textFaint }}>{skill}</span></div></div></button>;
}

export function KreditsWeekCard({ earned = 0, spent = 0, hint }) {
  const total = earned + spent, earnPct = total ? Math.round(100 * earned / total) : 0;
  return <Card>
    <Kicker style={{ marginBottom: 10 }}>kredits this week</Kicker>
    <div style={{ ...numeral(48), marginBottom: 10 }}>{earned}</div>
    <ProgressBar height={10} segments={total ? [{ pct: earnPct, color: color.green }, { pct: 100 - earnPct, color: color.red }] : []} style={{ marginBottom: 10 }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5, fontWeight: 700, fontFamily: font.family }}>
      <span style={{ color: color.greenDeep }}>+{earned} earned</span>
      <span style={{ color: color.red }}>−{spent} spent</span></div>
    {hint && <div style={{ fontSize: 12, color: color.textMuted, marginTop: 6, fontFamily: font.family }}>{hint}</div>}</Card>;
}

export function TeachConfirm({ solo, withHelp, onTry, onTeach }) {
  return <div style={{ ...base, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', background: color.goldTint,
    border: `1px solid ${color.goldBorder}`, borderRadius: radius.lg, padding: '14px 18px' }}>
    <span style={{ fontSize: 15, lineHeight: 1.4, flex: 1, minWidth: 220, color: color.ink }}>
      Help costs half a Kredit. Thinking is free. Solo this pays <strong>~{solo}</strong>, with help <strong>~{withHelp}</strong>.</span>
    <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
      <Button variant="ink" size="sm" onClick={onTry}>I'll try first</Button>
      <Button variant="gold" size="sm" onClick={onTeach} style={{ background: 'transparent' }}>Teach me anyway</Button></div></div>;
}



/**
 * SideBar — the app shell's left rail (ShareWillow-style reference, Oct 2026):
 * warm cream panel, greeting, stacked nav pills, and the Kredit bank pinned to
 * the bottom so the money is always in view. Pairs with a white content sheet.
 * Props: items [{id,label,dot}], active, onNav, kredits, weekEarned, tickets,
 * avatar (blob name), blobDir, name.
 */
export function SideBar({ items, active, onNav, kredits = 0, weekEarned = 0, tickets = 0, avatar, name, blobDir }) {
  const fmtK = n => n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : String(n);
  return <aside style={{ ...base, width: 248, flex: 'none', background: color.sidebar, padding: '26px 20px 24px',
    display: 'flex', flexDirection: 'column', gap: 4, position: 'sticky', top: 0, height: '100vh', boxSizing: 'border-box' }}>
    <span style={{ marginBottom: 26 }}><Logo /></span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
      {avatar && <Blob name={avatar} size={40} dir={blobDir} />}
      <div>
        <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.1 }}>Welcome back{name ? ',' : '!'}</div>
        {name && <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.15 }}>{name}!</div>}</div></div>
    {items.map(n => { const sel = n.id === active;
      return <SideItem key={n.id} label={n.label} dot={n.dot} active={sel} onClick={() => onNav && onNav(n.id)} />; })}
    <div style={{ marginTop: 'auto', paddingTop: 20 }}>
      <Kicker style={{ marginBottom: 6 }}>kredit bank</Kicker>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <KreditCoin size={22} />
        <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-.02em', color: color.greenDeep, lineHeight: 1 }}>{fmtK(kredits)}</span></div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: color.textMuted, margin: '6px 0 10px' }}>+{weekEarned} this week</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: color.textSecondary }}>
        <TicketIcon size={15} /> {tickets} ticket{tickets === 1 ? '' : 's'}</div></div></aside>;
}

function SideItem({ label, dot, active, onClick }) {
  const [hover, setHover] = React.useState(false);
  return <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    style={{ ...base, display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
      background: active ? '#fff' : hover ? 'rgba(255,255,255,.55)' : 'none',
      border: 'none', borderRadius: radius.md, padding: '11px 14px', fontSize: 14.5, fontWeight: active ? 800 : 600,
      color: color.ink, cursor: 'pointer', transition: 'background .2s' }}>
    <span style={{ width: 8, height: 8, borderRadius: radius.full, background: dot, flex: 'none' }} />{label}</button>;
}


/**
 * GradeChips — the grade journey as a compact day-strip (task-manager reference):
 * small chips, current grade in ink with a lime progress sliver, passed get a
 * green check, locked fade back. One-third the height of the card strip.
 * grades: [{grade, status: 'passed'|'current'|'locked', pct, detail}]
 */
export function GradeChips({ grades = [] }) {
  return <div style={{ ...base, display: 'flex', gap: 8 }}>
    {grades.map(g => {
      const cur = g.status === 'current', passed = g.status === 'passed';
      return <div key={g.grade} style={{ flex: 1, minWidth: 0, textAlign: 'center',
        background: cur ? color.ink : color.surface,
        border: `1px solid ${cur ? color.ink : color.border}`, borderRadius: radius.md,
        padding: '10px 4px 9px', opacity: g.status === 'locked' ? 0.45 : 1 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', marginBottom: 3,
          color: cur ? color.onInkMuted : passed ? color.greenDeep : color.textFaint }}>
          {passed ? '✓ PASSED' : cur ? 'NOW' : 'LOCKED'}</div>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
          color: cur ? color.onInkMuted : color.textMuted }}>Grade</div>
        <div style={{ ...numeral(26), color: cur ? '#fff' : color.ink }}>{g.grade}</div>
        {cur && <ProgressBar value={g.pct} height={4} fill={color.lime} track={color.onInkTrack} style={{ margin: '6px 6px 0' }} />}
      </div>; })}</div>;
}


/**
 * RecordsLedger — stacked record bands (Tasky reference): big serif numeral
 * left, label right, one tint per row. rows: [{n, label, bg, fg}].
 */
export function RecordsLedger({ rows = [] }) {
  return <div style={{ ...base, display: 'flex', flexDirection: 'column', gap: 6 }}>
    {rows.map((r, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, background: r.bg, borderRadius: radius.md, padding: '10px 16px' }}>
      <span style={{ ...numeral(32), color: color.ink }}>{r.n}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: color.ink, textAlign: 'right' }}>{r.label}</span>
    </div>)}</div>;
}
