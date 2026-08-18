// Kampus app components — composed from primitives + tokens.
import { color, type, radius, shadow, font, worldTint } from './tokens.js';
import { Button, Card, Kicker, Chip, ProgressBar, TierDots, KreditCoin, Logo, Blob } from './primitives.jsx';

const base = { fontFamily: font.family, boxSizing: 'border-box' };

export function NavBar({ items, active, onNav, weekLabel, kredits, avatar, onShop, blobDir }) {
  // items: [{id, label, dot}]
  return <nav style={{ ...base, display: 'flex', alignItems: 'center', gap: 4, padding: '12px clamp(14px, 2.5vw, 32px)',
    borderBottom: `1px solid ${color.border}`, position: 'sticky', top: 0, background: color.ground, zIndex: 10, flexWrap: 'wrap', rowGap: 6 }}>
    <span style={{ marginRight: 'clamp(8px, 1.5vw, 22px)', flex: 'none' }}><Logo /></span>
    <div style={{ flex: 1 }} />
    {items.map(n => { const sel = n.id === active;
      return <NavItem key={n.id} label={n.label} dot={n.dot} active={sel} onClick={() => onNav && onNav(n.id)} />; })}
    <div style={{ flex: 1 }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 16 }}>
      {weekLabel && <Chip dot={color.orange}>{weekLabel}</Chip>}
      <button onClick={onShop} style={{ ...base, display: 'flex', alignItems: 'center', gap: 7, background: color.surface,
        border: `1px solid ${color.border}`, borderRadius: radius.md, padding: '7px 8px 7px 14px', fontSize: 13.5, fontWeight: 700,
        cursor: 'pointer', whiteSpace: 'nowrap', flex: 'none' }}>
        <KreditCoin />{kredits}
        <span style={{ width: 20, height: 20, borderRadius: radius.full, background: color.green, color: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>+</span></button>
      {avatar && <Blob name={avatar} size={30} dir={blobDir} style={{ background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.sm, padding: 3 }} />}
    </div></nav>;
}

function NavItem({ label, dot, active, onClick }) {
  const [hover, setHover] = React.useState(false);
  return <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    style={{ ...base, display: 'flex', alignItems: 'center', gap: 9, background: active || hover ? color.fillHover : 'none',
      border: 'none', borderRadius: radius.sm, padding: '10px 14px', fontSize: 14.5, fontWeight: active ? 800 : 600,
      color: color.ink, cursor: 'pointer', whiteSpace: 'nowrap' }}>
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
      <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-.01em', color: fg }}>Grade {grade}</span>
      {passed && <svg width="18" height="18" viewBox="0 0 24 24"><path d="M8 21L10.5 14M16 21L13.5 14" stroke={color.goldDeep} strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="9" r="6.5" fill={color.gold} stroke={color.goldDeep} strokeWidth="1.8" /><path d="M12 6.2L12.9 8H14.8L13.3 9.3L13.8 11.2L12 10.1L10.2 11.2L10.7 9.3L9.2 8H11.1Z" fill={color.goldDeep} /></svg>}
      {status === 'locked' && <svg width="14" height="14" viewBox="0 0 24 24"><path d="M7 10V8a5 5 0 0110 0v2M6 10h12v10H6z" stroke={color.textMuted} strokeWidth="2" fill="none" strokeLinejoin="round" /></svg>}
    </div>
    <div style={{ ...type.kicker, fontSize: 11, letterSpacing: '.1em', color: sub }}>{passed ? 'conquered' : status}</div>
    <ProgressBar value={passed ? 100 : cur ? pct : 0} height={5} style={{ marginTop: 9 }}
      track={cur ? color.onInkTrack : passed ? '#F1E4C4' : color.track} fill={passed ? color.gold : cur ? color.lime : color.ink} />
    <div style={{ fontSize: 11, fontWeight: 600, color: sub, marginTop: 6 }}>{detail}</div></div>;
}

export function WorldTile({ name, skill, worldColor, blob, tierLabel, tier = 0, onPlay, blobDir }) {
  const [hover, setHover] = React.useState(false);
  return <button onClick={onPlay} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    style={{ ...base, background: color.surface, border: `1px solid ${hover ? color.ink : color.border}`, borderRadius: radius.lg,
      padding: 0, cursor: 'pointer', textAlign: 'left', overflow: 'hidden', boxShadow: shadow.card, display: 'block', width: '100%' }}>
    <div style={{ background: worldTint(worldColor), height: 150, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ position: 'absolute', top: 10, left: 10, background: color.surface, borderRadius: radius.sm,
        padding: '4px 9px', fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: color.textSecondary }}>{tierLabel}</span>
      <Blob name={blob} size={96} dir={blobDir} /></div>
    <div style={{ padding: '14px 16px 16px' }}>
      <div style={{ ...type.cardTitle, fontSize: 21, color: color.ink, marginBottom: 7 }}>{name}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <TierDots earned={tier} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: color.textFaint }}>{skill}</span></div></div></button>;
}

export function KreditsWeekCard({ earned = 0, spent = 0, hint }) {
  const total = earned + spent, earnPct = total ? Math.round(100 * earned / total) : 0;
  return <Card>
    <Kicker style={{ marginBottom: 12 }}>kredits this week</Kicker>
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
