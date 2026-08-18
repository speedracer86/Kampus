// AUTO-GENERATED preview bundle: all library files inlined (no ESM imports).
// Source of truth is the individual files in this folder — regenerate rather than hand-edit.

// ===== tokens.js =====
// Kampus design tokens — single source of truth, mirrors docs/STYLE_GUIDE.md
const color = {
  ground: '#F7F5F1', surface: '#FFFFFF', ink: '#23252B', inkHover: '#3A3D45',
  textSecondary: '#5D5A52', textMuted: '#8A8578', textFaint: '#B5B0A4',
  border: '#E5E2DA', borderFaint: '#F1EEE6', track: '#ECE9E1', trackOff: '#D8D4C9', fillHover: '#EEEBE3',
  onInkMuted: 'rgba(255,255,255,.72)', onInkTrack: 'rgba(255,255,255,.22)',
  green: '#58B372', greenHover: '#4AA263', greenDeep: '#2E7C46', greenTint: '#EAF6EE',
  gold: '#E8C94F', goldDeep: '#A8862A', goldMid: '#D9B96A', goldAlt: '#D9A93F', goldTint: '#FBF3E4', goldBorder: '#E8D9B8',
  red: '#E4766C', redTint: '#FBEDEC',
  lime: '#D9DE62', limeDeep: '#5B5E1F', limeBody: '#4A4D1E',
  orange: '#EE8A55', orangeDeep: '#7C4A1D', peach: '#F4BE93',
};
const world = {
  fractions: { color: '#F0AFCE', name: 'Fraction Factory', blob: 'Ice_cream' },
  trade: { color: '#F4BE93', name: 'Trade Tycoon', blob: 'Cash' },
  weather: { color: '#5E9FE0', name: 'Weather Station', blob: 'Rain' },
  equations: { color: '#8F97DE', name: 'Equation Lab', blob: 'Learning' },
};
const worldTint = (c) => `color-mix(in oklab, ${c} 24%, white)`;
const font = { family: "'Inter Tight', sans-serif" };
const type = {
  display: { fontSize: 52, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.02 },
  h1: { fontSize: 44, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.05 },
  cardTitle: { fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' },
  body: { fontSize: 16, fontWeight: 400, lineHeight: 1.5 },
  label: { fontSize: 14.5, fontWeight: 700 },
  kicker: { fontSize: 11.5, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase' },
  meta: { fontSize: 12.5, fontWeight: 600 },
};
const radius = { sm: 6, md: 8, lg: 10, full: 99 };
const shadow = { card: '0 1px 3px rgba(35,37,43,.04)' };
const motion = { bar: 'width .4s ease', fade: 'opacity .3s', knob: 'left .2s' };
// Grade-band sizing for Play surfaces: band(grade) -> sizes
const band = (g) => g <= 4 ? { mascot: 132, question: 62, answer: 26, pad: 24 }
  : g <= 6 ? { mascot: 100, question: 54, answer: 22, pad: 20 }
  : { mascot: 76, question: 46, answer: 20, pad: 16 };
const streakColors = { STARTER: '#8A8578', INTERN: '#8F97DE', PRO: '#D9A93F', MANAGER: '#58B372', BOSS: '#EE8A55', CEO: '#5E9FE0', LEGEND: '#8F97DE' };
const confetti = ['#8F97DE', '#F4BE93', '#7CBF8B', '#F0AFCE', '#5E9FE0', '#D9DE62'];


// ===== primitives.jsx =====
// Kampus primitives — zero-dependency React components, inline-styled from tokens.
// Usage: import { Button, Card, ... } from './primitives.jsx' (or transpile into your build).

const __base_primitives = { fontFamily: font.family, boxSizing: 'border-box' };

function Button({ variant = 'primary', size = 'md', disabled, style, children, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const pad = size === 'lg' ? '16px 30px' : size === 'sm' ? '9px 14px' : '12px 20px';
  const fs = size === 'lg' ? 18 : size === 'sm' ? 13.5 : 15;
  const variants = {
    primary: { background: hover ? color.greenHover : color.green, color: '#fff', border: 'none' },
    ink: { background: hover ? color.inkHover : color.ink, color: '#fff', border: 'none' },
    outline: { background: color.surface, color: color.ink, border: `1px solid ${hover ? color.ink : color.border}` },
    gold: { background: color.goldTint, color: color.goldDeep, border: `1px solid ${color.goldBorder}`, filter: hover ? 'brightness(.96)' : 'none' },
    ghost: { background: 'none', color: hover ? color.ink : color.textMuted, border: 'none' },
    destructive: { background: color.surface, color: color.red, border: `1px solid ${hover ? color.red : color.border}` },
  };
  return <button {...rest} disabled={disabled}
    onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    style={{ ...__base_primitives, padding: pad, fontSize: fs, fontWeight: variant === 'ghost' ? 600 : 700 + (size === 'lg' ? 100 : 0),
      borderRadius: size === 'sm' ? radius.sm : radius.md, cursor: disabled ? 'not-allowed' : 'pointer',
      ...(disabled ? { background: color.ground, color: color.textFaint, border: `1px solid ${color.border}` } : variants[variant]), ...style }}>
    {children}</button>;
}

function Card({ padding = 20, dashed, tint, style, children }) {
  return <div style={{ ...__base_primitives, background: tint || color.surface, borderRadius: radius.lg, padding,
    border: dashed ? `1px dashed ${color.border}` : tint ? 'none' : `1px solid ${color.border}`,
    boxShadow: tint || dashed ? 'none' : shadow.card, ...style }}>{children}</div>;
}

function Kicker({ color: c = color.textMuted, style, children }) {
  return <div style={{ ...__base_primitives, ...type.kicker, color: c, ...style }}>{children}</div>;
}

function Chip({ dot, style, children }) {
  return <div style={{ ...__base_primitives, display: 'inline-flex', alignItems: 'center', gap: 7, background: color.surface,
    border: `1px solid ${color.border}`, borderRadius: radius.md, padding: '7px 14px', fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', ...style }}>
    {dot && <span style={{ width: 7, height: 7, borderRadius: radius.full, background: dot, flex: 'none' }} />}{children}</div>;
}

function ProgressBar({ value = 0, fill = color.gold, track = color.track, height = 8, segments, style }) {
  // segments: [{pct, color}] for stacked bars (e.g. earned vs spent)
  return <div style={{ ...__base_primitives, display: 'flex', height, borderRadius: radius.md, overflow: 'hidden', background: track, ...style }}>
    {segments ? segments.map((s, i) => <div key={i} style={{ width: s.pct + '%', background: s.color, transition: motion.bar }} />)
      : <div style={{ width: Math.max(0, Math.min(100, value)) + '%', background: fill, borderRadius: radius.md, transition: motion.bar }} />}</div>;
}

function Toggle({ on, onChange }) {
  return <button onClick={() => onChange && onChange(!on)} aria-pressed={!!on}
    style={{ ...__base_primitives, background: on ? color.green : color.trackOff, border: 'none', borderRadius: radius.full,
      width: 44, height: 26, position: 'relative', cursor: 'pointer', flex: 'none' }}>
    <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: radius.full,
      background: '#fff', transition: motion.knob, boxShadow: '0 1px 2px rgba(0,0,0,.2)' }} /></button>;
}

function Segmented({ options, value, onChange }) {
  // options: [{value, label}]
  return <div style={{ ...__base_primitives, display: 'flex', gap: 6 }}>
    {options.map(o => { const sel = o.value === value;
      return <button key={String(o.value)} onClick={() => onChange && onChange(o.value)}
        style={{ ...__base_primitives, background: sel ? color.ink : color.surface, color: sel ? '#fff' : color.ink,
          border: `1px solid ${sel ? color.ink : color.border}`, borderRadius: radius.sm, padding: '7px 12px',
          fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>{o.label}</button>; })}</div>;
}

function TierDots({ earned = 0, total = 3 }) {
  return <div style={{ display: 'flex', gap: 6 }}>
    {Array.from({ length: total }, (_, i) => <span key={i} style={{ width: 9, height: 9, borderRadius: radius.full,
      background: i < earned ? color.gold : color.track }} />)}</div>;
}

function KreditCoin({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color.ink} strokeWidth="2" fill={color.gold} />
    <text x="12" y="16.2" textAnchor="middle" fontSize="12" fontWeight="800" fill={color.goldDeep} fontFamily={font.family}>K</text></svg>;
}

function TicketIcon({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M3 9C4.1 9 5 9.9 5 11C5 12.1 4.1 13 3 13V16C3 16.6 3.4 17 4 17H20C20.6 17 21 16.6 21 16V13C19.9 13 19 12.1 19 11C19 9.9 19.9 9 21 9V6C21 5.4 20.6 5 20 5H4C3.4 5 3 5.4 3 6V9Z"
      stroke={color.goldDeep} strokeWidth="1.8" strokeLinejoin="round" fill={color.gold} /></svg>;
}

function Logo({ size = 26, wordmark = true }) {
  return <span style={{ ...__base_primitives, display: 'inline-flex', alignItems: 'center', gap: 9 }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 21V3" stroke={color.ink} strokeWidth="2" strokeLinecap="round" />
      <path d="M5 4H19L15.5 8L19 12H5V4Z" stroke={color.ink} strokeWidth="1.8" strokeLinejoin="round" fill={color.orange} /></svg>
    {wordmark && <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.02em', color: color.ink }}>Kampus</span>}</span>;
}

function Blob({ name, size = 84, dir = 'blobs/', opacity = 1, style, ...rest }) {
  return <img src={dir + name + '.svg'} alt="" {...rest}
    style={{ width: size, height: size, objectFit: 'contain', opacity, ...style }} />;
}


/** Text field with label; kid-side styling. */
function TextField({ label, value, onChange, placeholder, type: t = 'text', style }) {
  const [focus, setFocus] = React.useState(false);
  return <label style={{ ...__base_primitives, display: 'block', ...style }}>
    {label && <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: color.textSecondary }}>{label}</span>}
    <input type={t} value={value} placeholder={placeholder} onChange={e => onChange && onChange(e.target.value)}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{ ...__base_primitives, width: '100%', padding: '11px 14px', fontSize: 15, fontWeight: 600, color: color.ink,
        background: color.surface, border: focus ? `2px solid ${color.green}` : `1px solid ${color.border}`,
        margin: focus ? -1 : 0, borderRadius: radius.md, outline: 'none' }} /></label>;
}

/** Radio group (vertical). options: [{value, label, hint?}] */
function RadioGroup({ options, value, onChange, style }) {
  return <div style={{ ...__base_primitives, display: 'grid', gap: 8, ...style }}>
    {options.map(o => { const sel = o.value === value;
      return <button key={String(o.value)} onClick={() => onChange && onChange(o.value)}
        style={{ ...__base_primitives, display: 'flex', alignItems: 'flex-start', gap: 11, textAlign: 'left', cursor: 'pointer',
          background: sel ? color.greenTint : color.surface, border: `1.5px solid ${sel ? color.green : color.border}`,
          borderRadius: radius.md, padding: '12px 14px' }}>
        <span style={{ width: 18, height: 18, borderRadius: radius.full, border: `2px solid ${sel ? color.green : color.textFaint}`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none', marginTop: 1 }}>
          {sel && <span style={{ width: 8, height: 8, borderRadius: radius.full, background: color.green }} />}</span>
        <span><span style={{ fontSize: 14.5, fontWeight: 700, color: color.ink }}>{o.label}</span>
          {o.hint && <span style={{ display: 'block', fontSize: 12.5, color: color.textMuted, marginTop: 2 }}>{o.hint}</span>}</span></button>; })}</div>;
}

/** Checkbox row. */
function Checkbox({ checked, onChange, label, style }) {
  return <button onClick={() => onChange && onChange(!checked)} style={{ ...__base_primitives, display: 'flex', alignItems: 'center', gap: 10,
    background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', ...style }}>
    <span style={{ width: 20, height: 20, borderRadius: radius.sm, border: `2px solid ${checked ? color.green : color.textFaint}`,
      background: checked ? color.green : color.surface, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
      {checked && <svg width="12" height="12" viewBox="0 0 24 24"><path d="M4 12L10 18L20 6" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}</span>
    <span style={{ fontSize: 14.5, fontWeight: 600, color: color.ink }}>{label}</span></button>;
}

/** Select dropdown (native, styled). options: [{value, label}] */
function Select({ options, value, onChange, label, style }) {
  return <label style={{ ...__base_primitives, display: 'block', ...style }}>
    {label && <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: color.textSecondary }}>{label}</span>}
    <select value={value} onChange={e => onChange && onChange(e.target.value)}
      style={{ ...__base_primitives, width: '100%', padding: '11px 12px', fontSize: 15, fontWeight: 600, color: color.ink,
        background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.md, cursor: 'pointer' }}>
      {options.map(o => <option key={String(o.value)} value={o.value}>{o.label}</option>)}</select></label>;
}

/** Number stepper (− n +). */
function Stepper({ value, onChange, min = 0, max = 99, style }) {
  const btn = { ...__base_primitives, width: 30, height: 30, borderRadius: radius.sm, border: `1px solid ${color.border}`,
    background: color.surface, fontSize: 16, fontWeight: 800, cursor: 'pointer', color: color.ink };
  return <span style={{ ...__base_primitives, display: 'inline-flex', alignItems: 'center', gap: 10, ...style }}>
    <button style={btn} onClick={() => onChange && onChange(Math.max(min, value - 1))}>−</button>
    <span style={{ fontSize: 16, fontWeight: 800, minWidth: 24, textAlign: 'center' }}>{value}</span>
    <button style={btn} onClick={() => onChange && onChange(Math.min(max, value + 1))}>+</button></span>;
}



// ===== app.jsx =====
// Kampus app components — composed from primitives + tokens.

const __base_app = { fontFamily: font.family, boxSizing: 'border-box' };

function NavBar({ items, active, onNav, weekLabel, kredits, avatar, onShop, blobDir }) {
  // items: [{id, label, dot}]
  return <nav style={{ ...__base_app, display: 'flex', alignItems: 'center', gap: 4, padding: '12px clamp(14px, 2.5vw, 32px)',
    borderBottom: `1px solid ${color.border}`, position: 'sticky', top: 0, background: color.ground, zIndex: 10, flexWrap: 'wrap', rowGap: 6 }}>
    <span style={{ marginRight: 'clamp(8px, 1.5vw, 22px)', flex: 'none' }}><Logo /></span>
    <div style={{ flex: 1 }} />
    {items.map(n => { const sel = n.id === active;
      return <NavItem key={n.id} label={n.label} dot={n.dot} active={sel} onClick={() => onNav && onNav(n.id)} />; })}
    <div style={{ flex: 1 }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 16 }}>
      {weekLabel && <Chip dot={color.orange}>{weekLabel}</Chip>}
      <button onClick={onShop} style={{ ...__base_app, display: 'flex', alignItems: 'center', gap: 7, background: color.surface,
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
    style={{ ...__base_app, display: 'flex', alignItems: 'center', gap: 9, background: active || hover ? color.fillHover : 'none',
      border: 'none', borderRadius: radius.sm, padding: '10px 14px', fontSize: 14.5, fontWeight: active ? 800 : 600,
      color: color.ink, cursor: 'pointer', whiteSpace: 'nowrap' }}>
    <span style={{ width: 8, height: 8, borderRadius: radius.full, background: dot, flex: 'none' }} />{label}</button>;
}

function GradeCard({ grade, status = 'locked', pct = 0, detail }) {
  // status: 'passed' | 'current' | 'locked'
  const cur = status === 'current', passed = status === 'passed';
  const fg = cur ? '#fff' : color.ink, sub = passed ? color.goldDeep : cur ? color.onInkMuted : color.textMuted;
  return <div style={{ ...__base_app, minWidth: 0, background: passed ? color.goldTint : cur ? color.ink : color.surface,
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

function WorldTile({ name, skill, worldColor, blob, tierLabel, tier = 0, onPlay, blobDir }) {
  const [hover, setHover] = React.useState(false);
  return <button onClick={onPlay} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    style={{ ...__base_app, background: color.surface, border: `1px solid ${hover ? color.ink : color.border}`, borderRadius: radius.lg,
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

function KreditsWeekCard({ earned = 0, spent = 0, hint }) {
  const total = earned + spent, earnPct = total ? Math.round(100 * earned / total) : 0;
  return <Card>
    <Kicker style={{ marginBottom: 12 }}>kredits this week</Kicker>
    <ProgressBar height={10} segments={total ? [{ pct: earnPct, color: color.green }, { pct: 100 - earnPct, color: color.red }] : []} style={{ marginBottom: 10 }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5, fontWeight: 700, fontFamily: font.family }}>
      <span style={{ color: color.greenDeep }}>+{earned} earned</span>
      <span style={{ color: color.red }}>−{spent} spent</span></div>
    {hint && <div style={{ fontSize: 12, color: color.textMuted, marginTop: 6, fontFamily: font.family }}>{hint}</div>}</Card>;
}

function TeachConfirm({ solo, withHelp, onTry, onTeach }) {
  return <div style={{ ...__base_app, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', background: color.goldTint,
    border: `1px solid ${color.goldBorder}`, borderRadius: radius.lg, padding: '14px 18px' }}>
    <span style={{ fontSize: 15, lineHeight: 1.4, flex: 1, minWidth: 220, color: color.ink }}>
      Help costs half a Kredit. Thinking is free. Solo this pays <strong>~{solo}</strong>, with help <strong>~{withHelp}</strong>.</span>
    <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
      <Button variant="ink" size="sm" onClick={onTry}>I'll try first</Button>
      <Button variant="gold" size="sm" onClick={onTeach} style={{ background: 'transparent' }}>Teach me anyway</Button></div></div>;
}



// ===== quiz.jsx =====
// Kampus quiz engine — fully working round logic from the prototype, UI + state included.
// Backend feeds questions and listens on onEvent(type, payload). See README for the event table.

const qBase = { fontFamily: font.family, boxSizing: 'border-box' };
const MULT = (s) => s >= 10 ? 3 : s >= 6 ? 2 : s >= 3 ? 1.5 : 1;
const TITLE = (s) => s >= 13 ? 'LEGEND' : s >= 10 ? 'CEO' : s >= 8 ? 'BOSS' : s >= 6 ? 'MANAGER' : s >= 4 ? 'PRO' : s >= 2 ? 'INTERN' : 'STARTER';

/** Built-in read-aloud (browser voice). */
function speak(text) {
  try {
    const u = new SpeechSynthesisUtterance(String(text).replace(/−/g, ' negative '));
    const vs = speechSynthesis.getVoices();
    u.voice = vs.find(v => /Natural/.test(v.name)) || vs.find(v => /Google US/.test(v.name)) || vs.find(v => /Samantha/.test(v.name)) || null;
    u.rate = 0.95; speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch (e) { /* no speech support */ }
}

/** Tap-the-number-line answer mode. vis: {from, to, start, end} */
function NumberLine({ vis, feedback, picked, onPick }) {
  const W = 560, pad = 26, n = vis.to - vis.from;
  const x = (val) => pad + (val - vis.from) / n * (W - 2 * pad);
  const step = n > 16 ? 2 : 1, ticks = [];
  for (let i = vis.from; i <= vis.to; i += step) ticks.push(i);
  return <svg width="100%" viewBox={`0 0 ${W} 96`} style={{ maxWidth: 560, display: 'block', margin: '0 auto' }}>
    <line x1={pad} y1="52" x2={W - pad} y2="52" stroke={color.ink} strokeWidth="2" />
    <text x={x(vis.start)} y="30" textAnchor="middle" fontSize="11" fontWeight="800" letterSpacing="1.5" fontFamily={font.family} fill="#5E9FE0">START</text>
    {ticks.map(t => {
      const isEnd = t === vis.end, isPick = t === picked;
      const fill = feedback && isEnd ? color.green : feedback === 'wrong' && isPick ? color.red : t === vis.start ? '#5E9FE0' : '#fff';
      return <g key={t} onClick={feedback ? undefined : () => onPick(t)} style={{ cursor: feedback ? 'default' : 'pointer' }}>
        <circle cx={x(t)} cy="52" r="15" fill="transparent" />
        <circle cx={x(t)} cy="52" r={t === vis.start || (feedback && (isEnd || isPick)) ? 7 : 5.5} fill={fill} stroke={color.ink} strokeWidth="1.4" />
        <text x={x(t)} y="80" textAnchor="middle" fontSize="13" fontWeight={t === vis.start ? 800 : 500} fontFamily={font.family} fill={t === vis.start ? color.ink : color.textSecondary}>{t}</text></g>;
    })}</svg>;
}

/** Tap-the-fraction-pieces answer mode. vis: {parts, target} — answer = number of segments tapped. */
function FractionPieces({ vis, feedback, picked, onPick }) {
  const [sel, setSel] = React.useState(0);
  const done = !!feedback;
  return <div style={{ ...qBase, textAlign: 'center' }}>
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 14 }}>
      {Array.from({ length: vis.parts }, (_, i) => {
        const on = i < (done ? picked : sel);
        const good = done && i < vis.target;
        return <div key={i} onClick={done ? undefined : () => setSel(i + 1 === sel ? i : i + 1)}
          style={{ width: 44, height: 56, borderRadius: radius.sm, border: `1.5px solid ${color.ink}`, cursor: done ? 'default' : 'pointer',
            background: done ? (good && on ? color.greenTint : on ? color.redTint : '#fff') : on ? '#F0AFCE' : '#fff',
            borderColor: done ? (good && on ? color.green : on ? color.red : color.border) : color.ink }} />;
      })}</div>
    <div style={{ fontSize: 13, fontWeight: 600, color: color.textMuted, marginBottom: 12 }}>{(done ? picked : sel)} of {vis.parts} shaded</div>
    {!done && <Button variant="ink" size="sm" disabled={sel === 0} onClick={() => onPick(sel)}>Lock it in</Button>}</div>;
}

/** Tap-coins money answer mode. vis: {target} in cents; denominations fixed. */
function MoneyCounter({ vis, feedback, picked, onPick }) {
  const [total, setTotal] = React.useState(0);
  const denoms = [{ v: 100, label: '$1' }, { v: 25, label: '25¢' }, { v: 10, label: '10¢' }, { v: 5, label: '5¢' }, { v: 1, label: '1¢' }];
  const done = !!feedback;
  const shown = done ? picked : total;
  return <div style={{ ...qBase, textAlign: 'center' }}>
    <div style={{ fontSize: 34, fontWeight: 800, marginBottom: 4, color: done ? (picked === vis.target ? color.greenDeep : color.red) : color.ink }}>
      ${(shown / 100).toFixed(2)}</div>
    {done && picked !== vis.target && <div style={{ fontSize: 13.5, fontWeight: 600, color: color.textMuted, marginBottom: 8 }}>needed ${(vis.target / 100).toFixed(2)}</div>}
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', margin: '10px 0 14px' }}>
      {denoms.map(d => <button key={d.v} disabled={done} onClick={() => setTotal(t => t + d.v)}
        style={{ ...qBase, width: d.v >= 100 ? 64 : 52, height: d.v >= 100 ? 40 : 52, borderRadius: d.v >= 100 ? radius.sm : radius.full,
          border: `1.5px solid ${color.ink}`, background: d.v >= 100 ? '#DDE9DC' : color.gold, fontSize: 13, fontWeight: 800,
          cursor: done ? 'default' : 'pointer', color: d.v >= 100 ? color.greenDeep : color.goldDeep }}>{d.label}</button>)}</div>
    {!done && <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      <Button variant="outline" size="sm" onClick={() => setTotal(0)}>Clear</Button>
      <Button variant="ink" size="sm" disabled={total === 0} onClick={() => onPick(total)}>That's it</Button></div>}</div>;
}

/** Slide-the-thermometer answer mode. vis: {min, max, target} */
function Thermometer({ vis, feedback, picked, onPick }) {
  const [val, setVal] = React.useState(Math.round((vis.min + vis.max) / 2));
  const done = !!feedback;
  const shown = done ? picked : val;
  return <div style={{ ...qBase, textAlign: 'center', maxWidth: 420, margin: '0 auto' }}>
    <div style={{ fontSize: 34, fontWeight: 800, marginBottom: 10, color: done ? (picked === vis.target ? color.greenDeep : color.red) : color.ink }}>{shown}°</div>
    {done && picked !== vis.target && <div style={{ fontSize: 13.5, fontWeight: 600, color: color.textMuted, marginBottom: 8 }}>it was {vis.target}°</div>}
    <input type="range" min={vis.min} max={vis.max} value={shown} disabled={done}
      onChange={e => setVal(Number(e.target.value))} style={{ width: '100%', accentColor: '#5E9FE0' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, color: color.textMuted, marginBottom: 14 }}>
      <span>{vis.min}°</span><span>{vis.max}°</span></div>
    {!done && <Button variant="ink" size="sm" onClick={() => onPick(val)}>Read it off</Button>}</div>;
}

/** Teach panel: one-step-at-a-time reveal with read-aloud. */
function TeachPanel({ steps, onClose }) {
  const [step, setStep] = React.useState(0);
  React.useEffect(() => { if (steps[step]) speak(steps[step]); }, [step]);
  return <div style={{ ...qBase, background: color.goldTint, border: `1px solid ${color.goldBorder}`, borderRadius: radius.lg, padding: '18px 20px' }}>
    {steps.slice(0, step + 1).map((s, i) => <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10,
      opacity: i < step ? 0.45 : 1, transform: i < step ? 'scale(.96)' : 'none', transformOrigin: 'left', transition: 'opacity .3s, transform .3s' }}>
      <span style={{ width: 24, height: 24, borderRadius: radius.full, border: `1.5px solid ${color.gold}`, color: color.goldDeep,
        fontSize: 13, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{i + 1}</span>
      <span style={{ fontSize: 16, lineHeight: 1.45 }}>{s}</span></div>)}
    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
      {step < steps.length - 1 && <Button variant="gold" size="sm" onClick={() => setStep(step + 1)}>Next step</Button>}
      <Button variant="outline" size="sm" onClick={onClose}>Got it, close</Button></div></div>;
}

/**
 * QuizRound — the full working round: streaks, Kredit math, teach economics, focus mode,
 * second-look retry, celebration, all four answer modes + multiple choice.
 * Props: questions [{text, mode:'choice'|'numline'|'fraction'|'money'|'thermo', choices?, answerIndex?, vis?, teach:[]}],
 *   grade (3-8), tier (1-3), gearBonus (%), worldColor, mascot (blob name), blobDir, focusMode, onEvent(type, payload), onQuit.
 */
function QuizRound({ questions, grade = 4, tier = 1, gearBonus = 0, worldColor = '#F0AFCE', mascot = 'Ice_cream', blobDir = 'blobs/', focusMode = true, onEvent = () => {}, onQuit }) {
  const bz = band(grade);
  const [st, set] = React.useState({ qNum: 0, order: questions.map((_, i) => i), retry: false, missed: [], correct: 0, asked: questions.length,
    streak: 0, best: 0, kredits: 0, feedback: null, picked: null, teachConfirm: false, teachOpen: false, halved: false, fixed: 0, resets: 0, gainKey: 0, gained: 0 });
  const q = questions[st.order[st.qNum]];
  const fullGain = Math.round((8 + 4 * tier) * MULT(st.streak + 1) * (1 + gearBonus / 100));

  const advance = (s) => {
    if (s.qNum + 1 < s.order.length) return { ...s, qNum: s.qNum + 1, feedback: null, picked: null, teachOpen: false, teachConfirm: false, halved: false };
    if (!s.retry && s.missed.length) return { ...s, retry: true, order: s.missed.slice(), missed: [], qNum: 0, asked: s.asked + s.missed.length, feedback: null, picked: null, teachOpen: false, teachConfirm: false, halved: false };
    const acc = Math.round(100 * s.correct / s.asked);
    onEvent('round_end', { kredits: s.kredits, correct: s.correct, asked: s.asked, acc, best: s.best, fixed: s.fixed, comeback: s.resets > 0 && s.best >= 3 });
    return { ...s, done: true, feedback: null };
  };
  const answer = (value, isRight) => set(s => {
    if (s.feedback) return s;
    if (isRight) {
      const streak = s.streak + 1;
      let gain = Math.round((8 + 4 * tier) * MULT(streak) * (1 + gearBonus / 100));
      if (s.halved) gain = Math.ceil(gain / 2);
      onEvent('answer', { right: true, gain, streak, halved: s.halved });
      setTimeout(() => set(advance), 1000);
      return { ...s, feedback: 'correct', picked: value, gained: gain, gainKey: s.gainKey + 1, kredits: s.kredits + gain,
        streak, best: Math.max(s.best, streak), correct: s.correct + 1, fixed: s.fixed + (s.retry ? 1 : 0), teachOpen: false, teachConfirm: false };
    }
    onEvent('answer', { right: false });
    return { ...s, feedback: 'wrong', picked: value, streak: 0, resets: s.resets + 1, missed: s.missed.concat(s.order[s.qNum]), teachOpen: false, teachConfirm: false };
  });

  if (st.done) return <EndOfRound kredits={st.kredits} acc={Math.round(100 * st.correct / st.asked)} best={st.best}
    fixed={st.fixed} comeback={st.resets > 0 && st.best >= 3} blobDir={blobDir} mascot={mascot}
    onAgain={() => { onEvent('again', {}); set({ qNum: 0, order: questions.map((_, i) => i), retry: false, missed: [], correct: 0, asked: questions.length, streak: 0, best: 0, kredits: 0, feedback: null, picked: null, teachConfirm: false, teachOpen: false, halved: false, fixed: 0, resets: 0, gainKey: 0, gained: 0 }); }}
    onHome={onQuit} />;

  const hudOp = focusMode && st.feedback !== 'correct' ? 0 : 1;
  const dim = st.teachOpen || st.teachConfirm ? 0.45 : 1;
  const modeUI = { numline: NumberLine, fraction: FractionPieces, money: MoneyCounter, thermo: Thermometer }[q.mode];
  const isRightFree = (v) => q.mode === 'numline' ? v === q.vis.end : q.mode === 'fraction' ? v === q.vis.target : v === q.vis.target;

  return <div style={{ ...qBase, background: color.ground, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px' }}>
      {onQuit && <button onClick={onQuit} style={{ ...qBase, width: 38, height: 38, background: '#fff', border: `1px solid ${color.border}`, borderRadius: radius.md, fontSize: 16, cursor: 'pointer' }}>✕</button>}
      <ProgressBar value={100 * (st.qNum + (st.feedback ? 1 : 0)) / st.order.length} fill={worldColor} height={6} style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: `1px solid ${color.border}`, borderRadius: radius.md,
        padding: '7px 14px', fontWeight: 700, fontSize: 15, opacity: hudOp, transition: 'opacity .3s' }}><KreditCoin />{st.kredits}</div></div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: 660, width: '100%', margin: '0 auto', padding: '0 24px 28px' }}>
      <Blob name={mascot} size={bz.mascot} dir={blobDir} style={{ cursor: 'pointer' }} onClick={() => speak(q.text)} />
      <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '.12em', color: streakColors[TITLE(st.streak)], margin: '10px 0 2px', opacity: hudOp, transition: 'opacity .3s' }}>
        {TITLE(st.streak)}{st.streak > 0 ? ` · ${st.streak} STREAK · ×${MULT(st.streak)}` : ''}</div>
      <h2 style={{ fontSize: bz.question, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.15, textAlign: 'center', margin: '10px 0 18px', textWrap: 'pretty', opacity: dim, transition: 'opacity .3s' }}>{q.text}</h2>
      {q.teach && !st.teachOpen && !st.feedback && <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <Button variant="gold" size="sm" onClick={() => set(s => ({ ...s, teachConfirm: true }))}>Teach me · costs half</Button>
        <Button variant="outline" size="sm" onClick={() => speak(q.text)}>Read it</Button></div>}
      {st.teachConfirm && <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', background: color.goldTint, border: `1px solid ${color.goldBorder}`, borderRadius: radius.lg, padding: '14px 18px', marginBottom: 18, width: '100%' }}>
        <span style={{ fontSize: 15, lineHeight: 1.4, flex: 1, minWidth: 220 }}>Help costs half a Kredit. Thinking is free. Solo this pays <strong>~{fullGain}</strong>, with help <strong>~{Math.ceil(fullGain / 2)}</strong>.</span>
        <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
          <Button variant="ink" size="sm" onClick={() => set(s => ({ ...s, teachConfirm: false }))}>I'll try first</Button>
          <Button variant="gold" size="sm" style={{ background: 'transparent' }} onClick={() => { onEvent('teach_open', {}); set(s => ({ ...s, teachConfirm: false, teachOpen: true, halved: true })); }}>Teach me anyway</Button></div></div>}
      {st.teachOpen && <div style={{ width: '100%', marginBottom: 18 }}><TeachPanel steps={q.teach} onClose={() => set(s => ({ ...s, teachOpen: false }))} /></div>}
      <div style={{ width: '100%', opacity: dim, transition: 'opacity .3s' }}>
        {q.mode === 'choice' || !q.mode
          ? <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {q.choices.map((c, i) => { const right = st.feedback && i === q.answerIndex, wrong = st.feedback === 'wrong' && i === st.picked;
              return <button key={i} onClick={() => !st.feedback && answer(i, i === q.answerIndex)}
                style={{ ...qBase, background: right ? color.greenTint : wrong ? color.redTint : '#fff',
                  border: `1.5px solid ${right ? color.green : wrong ? color.red : color.border}`, borderRadius: radius.md,
                  padding: `${bz.pad}px 18px`, fontSize: bz.answer, fontWeight: 700, cursor: st.feedback ? 'default' : 'pointer', color: color.ink }}>{c}</button>; })}</div>
          : React.createElement(modeUI, { vis: q.vis, feedback: st.feedback, picked: st.picked, onPick: (v) => answer(v, isRightFree(v)) })}</div>
      {st.feedback === 'wrong' && <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: color.redTint, border: `1px solid ${color.red}`, borderRadius: radius.md, padding: '12px 16px', marginTop: 18, width: '100%' }}>
        <span style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>Not this one — you'll see it again at the end.</span>
        <Button variant="ink" size="sm" onClick={() => set(advance)}>Next →</Button></div>}
      {st.feedback === 'correct' && <div key={st.gainKey} style={{ fontSize: 20, fontWeight: 800, color: color.greenDeep, marginTop: 16 }}>+{st.gained}</div>}
    </div></div>;
}

/** End-of-round summary with comeback + fixed banners. */
function EndOfRound({ kredits, acc, best, fixed = 0, comeback, mascot = 'Party', blobDir = 'blobs/', onAgain, onHome }) {
  const headline = acc === 100 ? 'Clean run. W.' : comeback ? 'Comeback. Respect.' : best >= 6 ? 'On fire.' : 'Round done.';
  return <div style={{ ...qBase, background: color.ground, minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
    <Blob name={acc >= 80 ? 'Party' : mascot} size={140} dir={blobDir} />
    <h1 style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-.03em', margin: '18px 0 26px' }}>{headline}</h1>
    <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
      {[['Kredits', '+' + kredits], ['accuracy', acc + '%'], ['best combo', '×' + best]].map(([k, v]) =>
        <div key={k} style={{ background: '#fff', border: `1px solid ${color.border}`, borderRadius: radius.lg, padding: '16px 26px' }}>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{v}</div>
          <div style={{ ...type.kicker, color: color.textMuted, marginTop: 4 }}>{k}</div></div>)}</div>
    {fixed > 0 && <div style={{ background: color.greenTint, border: `1px solid ${color.green}`, borderRadius: radius.md, padding: '12px 18px', marginBottom: 22, fontSize: 15, fontWeight: 600, color: color.greenDeep }}>
      Fixed {fixed} from earlier on the second look. That's the move.</div>}
    <div style={{ display: 'flex', gap: 12 }}>
      <Button variant="primary" size="lg" onClick={onAgain}>Run it back</Button>
      {onHome && <Button variant="outline" size="lg" onClick={onHome}>Home</Button>}</div></div>;
}



// ===== parent.jsx =====
// Grown-ups surfaces — Modernist structure (square corners, 2px rules, flush-left, modular grid)
// in Kampus colors. Everything behind the Grown-ups nav uses THESE primitives, not the kid ones.

const pFont = "'Inter Tight', sans-serif";
const pBase = { fontFamily: pFont, boxSizing: 'border-box', borderRadius: 0 };

/** 2px rule — the Modernist section divider. */
function PRule({ style }) { return <div style={{ height: 2, background: color.ink, ...style }} />; }

function PKicker({ children, style }) {
  return <div style={{ ...pBase, fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: color.textMuted, ...style }}>{children}</div>;
}

/** Section: kicker + 2px top rule; the only grouping device on parent surfaces. */
function PSection({ kicker, children, style }) {
  return <section style={{ ...pBase, ...style }}>
    <PRule /><PKicker style={{ margin: '10px 0 18px' }}>{kicker}</PKicker>{children}</section>;
}

/** Flush-left button: label starts at the left padding edge, trailing arrow pushed right. */
function PButton({ variant = 'primary', arrow, disabled, onClick, children, style }) {
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
function PTable({ headers, rows, align = [], renderCell }) {
  const cell = (c, ci) => ({ textAlign: align[ci] === 'r' ? 'right' : 'left', padding: '10px 12px 10px 0' });
  return <table style={{ ...pBase, width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
    <thead><tr>{headers.map((h, i) => <th key={i} style={{ ...cell(h, i), fontSize: 11, fontWeight: 700, letterSpacing: '.14em',
      textTransform: 'uppercase', color: color.textMuted, borderBottom: `2px solid ${color.ink}`, paddingBottom: 8 }}>{h}</th>)}</tr></thead>
    <tbody>{rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci} style={{ ...cell(c, ci), borderBottom: `1px solid ${color.border}`, fontWeight: ci === 0 ? 600 : 500 }}>
      {renderCell ? renderCell(c, ri, ci) : c}</td>)}</tr>)}</tbody></table>;
}

/** Accuracy bar row (per world/skill), flush-left label, right-aligned value. */
function PStatBar({ label, pct, barColor }) {
  return <div style={{ ...pBase, marginBottom: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
      <span>{label}</span><span style={{ color: pct < 70 ? color.red : color.ink }}>{pct}%</span></div>
    <div style={{ height: 8, background: color.track }}>
      <div style={{ width: pct + '%', height: '100%', background: barColor || (pct < 70 ? color.red : color.ink), transition: 'width .4s ease' }} /></div></div>;
}

/** Analytics block: accuracy by world + suggested focus + skills table. All data via props. */
function ParentAnalytics({ worlds = [], focus = [], skills = [] }) {
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
function TicketAdmin({ tickets = 0, weekTickets = 0, weekCap = 10, pending = [], menu = [], onEvent = () => {} }) {
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
function ParentSettings({ grade = 4, sessionMins = 0, focusMode = true, sound = true, onEvent = () => {} }) {
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
function ParentOnboarding({ kidGrade = 4, blobDir = 'blobs/', onEvent = () => {} }) {
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



// ===== flows.jsx =====
// Kid-side flows: student onboarding, rewards, shop. Kampus style, working state, onEvent bus.

const kBase = { fontFamily: font.family, boxSizing: 'border-box' };

/** Student onboarding — 3 steps: welcome, grade, avatar. onEvent('onboarded', {grade, avatar}). */
function StudentOnboarding({ blobDir = 'blobs/', onEvent = () => {} }) {
  const [step, setStep] = React.useState(0);
  const [grade, setGrade] = React.useState(null);
  const [avatar, setAvatar] = React.useState(null);
  const wrap = (children) => <div style={{ ...kBase, background: color.ground, minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
    <div style={{ maxWidth: 520, width: '92%' }}>{children}</div></div>;
  if (step === 0) return wrap(<div>
    <Blob name="Party" size={170} dir={blobDir} style={{ margin: '0 0 8px -18px' }} />
    <Kicker style={{ marginBottom: 14 }}>kampus · the campus of life</Kicker>
    <h1 style={{ ...type.display, margin: '0 0 16px' }}>Hey. This is Kampus.</h1>
    <p style={{ fontSize: 18, lineHeight: 1.5, color: color.textSecondary, margin: '0 0 28px' }}>
      Real-life math — money, deals, temperatures, plans. Earn Kampus Kredits, cash them in for real rewards. No timers unless you want one.</p>
    <Button variant="primary" size="lg" onClick={() => setStep(1)}>Bet</Button></div>);
  if (step === 1) return wrap(<div>
    <Kicker style={{ marginBottom: 14 }}>step 1 of 2</Kicker>
    <h1 style={{ ...type.h1, margin: '0 0 12px' }}>What grade?</h1>
    <p style={{ fontSize: 16, color: color.textSecondary, margin: '0 0 24px' }}>A grown-up can change this later. No test to get in.</p>
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {[3, 4, 5, 6, 7, 8].map(g => <button key={g} onClick={() => { setGrade(g); setStep(2); }}
        style={{ ...kBase, width: 70, height: 70, borderRadius: radius.md, border: `1px solid ${color.border}`, background: '#fff',
          fontSize: 24, fontWeight: 800, cursor: 'pointer', color: color.ink }}>{g}</button>)}</div></div>);
  return wrap(<div>
    <Kicker style={{ marginBottom: 14 }}>step 2 of 2</Kicker>
    <h1 style={{ ...type.h1, margin: '0 0 12px' }}>Pick your blob.</h1>
    <p style={{ fontSize: 16, color: color.textSecondary, margin: '0 0 24px' }}>Pets you buy later can take over this job.</p>
    <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
      {['Thinker', 'Magic', 'Skating', 'Explore'].map(a => <button key={a} onClick={() => setAvatar(a)}
        style={{ ...kBase, width: 104, height: 104, borderRadius: radius.lg, cursor: 'pointer',
          border: `1.5px solid ${avatar === a ? color.gold : color.border}`, background: avatar === a ? color.goldTint : '#fff', padding: 10 }}>
        <Blob name={a} size={78} dir={blobDir} /></button>)}</div>
    <Button variant="primary" size="lg" disabled={!avatar} onClick={() => onEvent('onboarded', { grade, avatar })}>Let's go</Button></div>);
}

/** Kid rewards: ticket balance, redeem menu, pending queue. onEvent('redeem', item). */
function RewardsPanel({ tickets = 0, nextReward, menu = [], pending = [], blobDir = 'blobs/', onEvent = () => {} }) {
  return <div style={{ ...kBase, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
    <Card padding={24}>
      <Kicker style={{ marginBottom: 12 }}>your tickets</Kicker>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
        <span style={{ fontSize: 52, fontWeight: 800, lineHeight: 1 }}>{tickets}</span><TicketIcon size={26} /></div>
      {nextReward && <>
        <ProgressBar value={100 * tickets / nextReward.cost} fill={color.gold} style={{ marginBottom: 8 }} />
        <div style={{ fontSize: 13, fontWeight: 600, color: color.textMuted }}>
          Earn {Math.max(0, nextReward.cost - tickets)} more tickets to unlock "{nextReward.name}"</div></>}</Card>
    <div style={{ display: 'grid', gap: 20 }}>
      <Card padding={24}>
        <Kicker style={{ marginBottom: 12 }}>spend on</Kicker>
        {menu.map((m, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
          borderBottom: i < menu.length - 1 ? `1px solid ${color.borderFaint}` : 'none' }}>
          <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600 }}>{m.name}</span>
          <span style={{ fontSize: 13, color: color.textMuted, fontWeight: 600 }}>{m.cost}</span>
          <Button variant={tickets >= m.cost ? 'gold' : 'outline'} size="sm" disabled={tickets < m.cost} onClick={() => onEvent('redeem', m)}>Redeem</Button></div>)}</Card>
      <Card padding={24} dashed={pending.length === 0}>
        <Kicker style={{ marginBottom: 12 }}>waiting for grown-up</Kicker>
        {pending.length === 0
          ? <div style={{ textAlign: 'center', padding: '8px 0' }}><Blob name="Timer" size={64} dir={blobDir} opacity={0.85} />
            <div style={{ fontSize: 13, color: color.textMuted, marginTop: 8 }}>Nothing pending.</div></div>
          : pending.map((p, i) => <div key={i} style={{ background: color.goldTint, border: `1px solid ${color.goldBorder}`, borderRadius: radius.md,
            padding: '10px 14px', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>{p.name} · waiting</div>)}</Card></div></div>;
}

/** Shop grid with tabs. items: {id, name, icon (emoji or node), cost, bonus?, owned}. onEvent('buy', item). */
function ShopGrid({ tabs = ['Upgrades', 'Pets', 'Themes'], activeTab, onTab, items = [], kredits = 0, onEvent = () => {} }) {
  return <div style={{ ...kBase }}>
    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
      {tabs.map(t => <button key={t} onClick={() => onTab && onTab(t)}
        style={{ ...kBase, background: t === activeTab ? color.ink : '#fff', color: t === activeTab ? '#fff' : color.ink,
          border: `1px solid ${t === activeTab ? color.ink : color.border}`, borderRadius: radius.full, padding: '9px 18px',
          fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>{t}</button>)}</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
      {items.map(it => <div key={it.id} style={{ background: it.owned ? color.green : color.track, borderRadius: radius.lg, padding: 5 }}>
        <div style={{ background: '#fff', borderRadius: 7, padding: '18px 16px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>{it.icon}</div>
          {it.bonus != null && <div style={{ display: 'inline-block', background: color.lime, color: color.limeDeep, borderRadius: radius.sm,
            padding: '3px 8px', fontSize: 10.5, fontWeight: 800, letterSpacing: '.08em', marginBottom: 8 }}>+{it.bonus}% KREDITS</div>}
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>{it.name}</div>
          <Button variant={it.owned ? 'outline' : kredits >= it.cost ? 'ink' : 'outline'} size="sm" disabled={it.owned || kredits < it.cost}
            onClick={() => onEvent('buy', it)} style={it.owned ? { background: color.greenTint, color: color.greenDeep, borderColor: color.green } : {}}>
            {it.owned ? 'Owned' : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><KreditCoin size={12} />{it.cost}</span>}</Button></div></div>)}</div></div>;
}



// ===== home.jsx =====
// Composed Home screen + Parent PIN gate. Responsive: grids collapse below ~900px and ~640px.

const hBase = { fontFamily: font.family, boxSizing: 'border-box' };

function useWidth(ref) {
  const [w, setW] = React.useState(1060);
  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(es => setW(es[0].borderBoxSize?.[0]?.inlineSize ?? es[0].target.getBoundingClientRect().width));
    ro.observe(ref.current); return () => ro.disconnect();
  }, []);
  return w;
}

/**
 * HomeScreen — the composed kid dashboard. Fully responsive:
 * ≥900px: main + 320px rail · <900px: single column · <640px: grade strip 3-up, world tiles 1-up.
 * Props: data {headline, grades:[{grade,status,pct,detail}], jumpBack:{world,tier,skill,blob,color},
 *   worlds:[WorldTile props], testReady?, tickets, nextReward, weekEarned, weekSpent, weekHint,
 *   recentRuns:[{world,color,meta}]}, blobDir, onEvent('play'|'quick6'|'world'|'test'|'stand'|'rewards', payload).
 */
function HomeScreen({ data, blobDir = 'blobs/', onEvent = () => {} }) {
  const ref = React.useRef(null);
  const w = useWidth(ref);
  const narrow = w < 900, phone = w < 640;
  const d = data;
  return <div ref={ref} style={{ ...hBase, background: color.ground, padding: phone ? '20px 16px 40px' : '30px 32px 48px' }}>
    <h1 style={{ fontSize: phone ? 32 : 46, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.05, margin: '0 0 24px', textWrap: 'pretty' }}>{d.headline}</h1>
    <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 320px', gap: 24 }}>
      <div style={{ minWidth: 0 }}>
        <Kicker style={{ marginBottom: 10 }}>your grades</Kicker>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${phone ? 3 : 6}, 1fr)`, gap: 10, marginBottom: 26 }}>
          {d.grades.map(g => <GradeCard key={g.grade} {...g} />)}</div>
        {d.jumpBack && <Card padding={20} style={{ marginBottom: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Blob name={d.jumpBack.blob} size={84} dir={blobDir} />
            <div style={{ flex: 1, minWidth: 140 }}>
              <Kicker style={{ marginBottom: 4 }}>jump back in</Kicker>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em' }}>{d.jumpBack.world}</div>
              <div style={{ fontSize: 13, color: color.textMuted, fontWeight: 600 }}>Tier {d.jumpBack.tier} · {d.jumpBack.skill}</div></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 'none' }}>
              <Button variant="primary" size="lg" onClick={() => onEvent('play', d.jumpBack)}>PLAY</Button>
              <Button variant="outline" size="sm" onClick={() => onEvent('quick6', d.jumpBack)}>Quick 6 →</Button></div></div></Card>}
        <Kicker style={{ marginBottom: 10 }}>worlds</Kicker>
        <div style={{ display: 'grid', gridTemplateColumns: phone ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 26 }}>
          {d.worlds.map(wd => <WorldTile key={wd.name} {...wd} blobDir={blobDir} onPlay={() => onEvent('world', wd)} />)}</div>
        {d.testReady && <div style={{ background: color.goldTint, border: `1px solid ${color.goldBorder}`, borderRadius: radius.lg, padding: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Blob name="Winner" size={64} dir={blobDir} />
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Grade {d.testReady.grade} test unlocked</div>
            <div style={{ fontSize: 13, color: color.goldDeep, fontWeight: 600 }}>{d.testReady.note}</div></div>
          <Button variant="outline" onClick={() => onEvent('test', d.testReady)}>See the test</Button></div>}
      </div>
      <div style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
        <Card padding={20}>
          <Kicker style={{ marginBottom: 10 }}>your tickets</Kicker>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{d.tickets}</span><TicketIcon size={20} /></div>
          {d.nextReward && <>
            <ProgressBar value={100 * d.tickets / d.nextReward.cost} fill={color.gold} style={{ margin: '12px 0 8px' }} />
            <div style={{ fontSize: 12.5, fontWeight: 600, color: color.textMuted }}>Earn {Math.max(0, d.nextReward.cost - d.tickets)} more tickets to unlock "{d.nextReward.name}"</div></>}
          <Button variant="ghost" size="sm" style={{ marginTop: 8, padding: '4px 0' }} onClick={() => onEvent('rewards')}>Rewards →</Button></Card>
        <KreditsWeekCard earned={d.weekEarned} spent={d.weekSpent} hint={d.weekHint} />
        <div style={{ background: color.lime, borderRadius: radius.lg, padding: '22px 20px 20px' }}>
          <Blob name="Startup" size={96} dir={blobDir} style={{ display: 'block', margin: '0 0 6px -6px' }} />
          <Kicker color={color.limeDeep} style={{ marginBottom: 6 }}>your business</Kicker>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.15, marginBottom: 6 }}>Lemonade stand</div>
          <div style={{ fontSize: 14, color: color.limeBody, lineHeight: 1.45, marginBottom: 14 }}>Set a price, make some cups, keep the profit. Banks as Kredits, ×10.</div>
          <Button variant="ink" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onEvent('stand')}>Open the stand →</Button></div>
        <Card padding={20} dashed={!d.recentRuns || d.recentRuns.length === 0}>
          <Kicker style={{ marginBottom: 10 }}>recent runs</Kicker>
          {(!d.recentRuns || d.recentRuns.length === 0)
            ? <div style={{ textAlign: 'center', padding: '6px 0' }}><Blob name="Coffee" size={56} dir={blobDir} opacity={0.85} />
              <div style={{ fontSize: 12.5, color: color.textMuted, marginTop: 6 }}>No runs yet.</div></div>
            : d.recentRuns.map((r, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
              borderBottom: i < d.recentRuns.length - 1 ? `1px solid ${color.borderFaint}` : 'none' }}>
              <span style={{ width: 8, height: 8, borderRadius: radius.full, background: r.color, flex: 'none' }} />
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700 }}>{r.world}</span>
              <span style={{ fontSize: 12, color: color.textMuted, fontWeight: 600 }}>{r.meta}</span></div>)}</Card>
      </div></div></div>;
}

/**
 * PinGate — 4-digit parent gate in front of Grown-ups. Not security, just a kid-stopper.
 * Props: pin ('1234'), onPass(), onCancel(). Wrong entry shakes and clears; no lockout (parent UX).
 */
function PinGate({ pin = '1234', onPass = () => {}, onCancel, blobDir = 'blobs/' }) {
  const [entered, setEntered] = React.useState('');
  const [wrong, setWrong] = React.useState(false);
  const press = (d) => {
    if (wrong) setWrong(false);
    const next = entered + d;
    if (next.length < 4) return setEntered(next);
    if (next === pin) return onPass();
    setEntered(''); setWrong(true);
  };
  return <div style={{ ...hBase, background: color.ground, minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
    <div style={{ textAlign: 'center', maxWidth: 320 }}>
      <Blob name="Access" size={90} dir={blobDir} />
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em', margin: '12px 0 6px' }}>Grown-ups only</div>
      <div style={{ fontSize: 14, color: color.textSecondary, marginBottom: 20 }}>{wrong ? 'Not it. Try again.' : 'Enter the 4-digit PIN.'}</div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 22 }}>
        {[0, 1, 2, 3].map(i => <span key={i} style={{ width: 16, height: 16, borderRadius: radius.full,
          border: `2px solid ${wrong ? color.red : color.ink}`, background: i < entered.length ? color.ink : 'transparent' }} />)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 64px)', gap: 10, justifyContent: 'center' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((k, i) => k === null ? <span key={i} />
          : <button key={i} onClick={() => k === 'del' ? setEntered(entered.slice(0, -1)) : press(String(k))}
            style={{ ...hBase, width: 64, height: 56, borderRadius: radius.md, border: `1px solid ${color.border}`, background: '#fff',
              fontSize: k === 'del' ? 14 : 20, fontWeight: 800, cursor: 'pointer', color: color.ink }}>{k === 'del' ? '⌫' : k}</button>)}</div>
      {onCancel && <Button variant="ghost" size="sm" style={{ marginTop: 18 }} onClick={onCancel}>← Back to the kid side</Button>}</div></div>;
}



// ===== gamify.jsx =====
// Gamification: DailyQuests (2/day, Kredit-paying) + CampusMap (skyline, grade districts).
// Both stateless-over-props: backend owns quest progress + unlock state, components emit onEvent.

const gBase = { fontFamily: font.family, boxSizing: 'border-box' };

/**
 * DailyQuests — Home card. quests: [{id, label, progress, target, reward, done}] (2 per day).
 * onEvent('quest_claim', quest) when a finished quest's Kredits are collected.
 */
function DailyQuests({ quests = [], onEvent = () => {}, compact }) {
  const inner = quests.map((q, i) => {
    const done = q.done || q.progress >= q.target;
    return <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: compact ? '8px 0' : '11px 0',
      borderBottom: i < quests.length - 1 ? `1px solid ${color.borderFaint}` : 'none' }}>
      <span style={{ width: 22, height: 22, borderRadius: radius.full, flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: `2px solid ${done ? color.green : color.border}`, background: done ? color.green : '#fff' }}>
        {done && <svg width="12" height="12" viewBox="0 0 24 24"><path d="M4 12L10 18L20 6" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: compact ? 13 : 14, fontWeight: 700, color: done ? color.textMuted : color.ink, textDecoration: done ? 'line-through' : 'none' }}>{q.label}</span>
        {!done && <ProgressBar value={100 * q.progress / q.target} height={4} fill={color.gold} style={{ marginTop: 5, maxWidth: 160 }} />}</span>
      {done && !q.claimed
        ? <button onClick={() => onEvent('quest_claim', q)} style={{ ...gBase, display: 'inline-flex', alignItems: 'center', gap: 6,
          background: color.goldTint, border: `1px solid ${color.goldBorder}`, borderRadius: radius.sm, padding: '6px 10px',
          fontSize: 12.5, fontWeight: 800, color: color.goldDeep, cursor: 'pointer' }}><KreditCoin size={12} />+{q.reward}</button>
        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: color.textFaint }}><KreditCoin size={12} />+{q.reward}</span>}
    </div>; });
  if (compact) return <div style={{ ...gBase }}>{inner}</div>;
  return <Card padding={20}><Kicker style={{ marginBottom: 8 }}>today's quests</Kicker>{inner}</Card>;
}

/** QuestChip — Play-HUD pill showing quest progress mid-round (respects focus-mode opacity via style). */
function QuestChip({ quest, style }) {
  if (!quest) return null;
  const done = quest.done || quest.progress >= quest.target;
  return <div style={{ ...gBase, display: 'inline-flex', alignItems: 'center', gap: 8, background: done ? color.greenTint : '#fff',
    border: `1px solid ${done ? color.green : color.border}`, borderRadius: radius.md, padding: '6px 12px', fontSize: 12.5, fontWeight: 700,
    color: done ? color.greenDeep : color.textSecondary, whiteSpace: 'nowrap', ...style }}>
    {done ? '✓' : `${quest.progress}/${quest.target}`} {quest.label}</div>;
}

// --- Campus map ---------------------------------------------------------
// Skyline in the flat icon grammar: 1.8px ink strokes, one accent fill per district.
const DISTRICT_COLORS = ['#F0AFCE', '#F4BE93', '#5E9FE0', '#8F97DE', '#7CBF8B', '#E8C94F'];

function Buildings({ i, x, w, unlocked, silhouette, accent }) {
  const ink = color.ink, sw = 1.8, gy = 150; // ground y
  const variants = [
    // per-district building trio (x-relative), heights vary for a real skyline
    [{ t: 'house', w: 42, h: 34 }, { t: 'tower', w: 26, h: 62 }, { t: 'house', w: 36, h: 26 }],
    [{ t: 'tower', w: 30, h: 48 }, { t: 'house', w: 44, h: 30 }, { t: 'flag', w: 24, h: 56 }],
    [{ t: 'house', w: 38, h: 28 }, { t: 'tower', w: 28, h: 70 }, { t: 'house', w: 40, h: 36 }],
    [{ t: 'flag', w: 26, h: 60 }, { t: 'house', w: 46, h: 32 }, { t: 'tower', w: 26, h: 50 }],
    [{ t: 'tower', w: 28, h: 66 }, { t: 'house', w: 40, h: 30 }, { t: 'house', w: 34, h: 24 }],
    [{ t: 'house', w: 44, h: 36 }, { t: 'flag', w: 24, h: 64 }, { t: 'tower', w: 30, h: 54 }],
  ][i % 6];
  const stroke = silhouette ? color.textFaint : ink;
  const dash = silhouette ? '4 4' : 'none';
  let bx = x + 8;
  const parts = variants.map((b, bi) => {
    const el = [];
    const fill = silhouette ? 'none' : bi === 1 ? accent : '#fff';
    if (b.t === 'house') {
      el.push(<rect key="b" x={bx} y={gy - b.h} width={b.w} height={b.h} fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} strokeLinejoin="round" />);
      el.push(<polygon key="r" points={`${bx},${gy - b.h} ${bx + b.w / 2},${gy - b.h - 14} ${bx + b.w},${gy - b.h}`} fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} strokeLinejoin="round" />);
    } else if (b.t === 'tower') {
      el.push(<rect key="b" x={bx} y={gy - b.h} width={b.w} height={b.h} fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} strokeLinejoin="round" />);
      el.push(<line key="w1" x1={bx + 6} y1={gy - b.h + 10} x2={bx + b.w - 6} y2={gy - b.h + 10} stroke={stroke} strokeWidth={1.4} strokeDasharray={dash} />);
      el.push(<line key="w2" x1={bx + 6} y1={gy - b.h + 20} x2={bx + b.w - 6} y2={gy - b.h + 20} stroke={stroke} strokeWidth={1.4} strokeDasharray={dash} />);
    } else { // flag pole + pennant (the Kampus mark planted per district)
      el.push(<line key="p" x1={bx + 4} y1={gy} x2={bx + 4} y2={gy - b.h} stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeDasharray={dash} />);
      el.push(<path key="f" d={`M${bx + 4} ${gy - b.h}H${bx + b.w}L${bx + b.w - 7} ${gy - b.h + 8}L${bx + b.w} ${gy - b.h + 16}H${bx + 4}Z`}
        fill={silhouette ? 'none' : color.orange} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} strokeLinejoin="round" />);
    }
    const g = <g key={bi}>{el}</g>; bx += b.w + 6; return g;
  });
  return <g opacity={silhouette ? 0.7 : 1}>{parts}</g>;
}

/**
 * CampusMap — skyline that grows as grades pass. districts: [{grade, name, unlocked}] (6, grades 3-8).
 * Next locked district renders as a dashed silhouette; later ones stay hidden (empty lots).
 * teaser: compact Home variant (no title, click-through). onEvent('open_map') from teaser CTA.
 */
function CampusMap({ districts = [], teaser, onEvent = () => {} }) {
  const W = 900, DW = W / 6;
  const nextIdx = districts.findIndex(d => !d.unlocked);
  return <div style={{ ...gBase }}>
    <svg viewBox={`0 0 ${W} 190`} style={{ width: '100%', display: 'block' }}>
      <line x1="0" y1="150" x2={W} y2="150" stroke={color.ink} strokeWidth="2" />
      {districts.map((d, i) => {
        const x = i * DW;
        if (!d.unlocked && i !== nextIdx) return <g key={d.grade}>
          <line x1={x + 18} y1="150" x2={x + DW - 18} y2="150" stroke={color.textFaint} strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" /></g>;
        return <g key={d.grade}>
          <Buildings i={i} x={x} w={DW} unlocked={d.unlocked} silhouette={!d.unlocked} accent={DISTRICT_COLORS[i % 6]} />
          <text x={x + 8} y="172" fontSize="11" fontWeight="800" letterSpacing="1.2" fontFamily={font.family}
            fill={d.unlocked ? color.ink : color.textFaint}>{`GRADE ${d.grade}`}</text>
          <text x={x + 8} y="186" fontSize="10.5" fontWeight="600" fontFamily={font.family}
            fill={d.unlocked ? color.textMuted : color.textFaint}>{d.unlocked ? d.name : 'pass the test to build'}</text></g>;
      })}</svg>
    {teaser && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: color.textMuted }}>
        {districts.filter(d => d.unlocked).length} of {districts.length} districts built</span>
      <button onClick={() => onEvent('open_map')} style={{ ...gBase, background: 'none', border: 'none', color: color.textMuted,
        fontSize: 12.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}>See the campus →</button></div>}</div>;
}

/** CampusPage — the full map page: headline, map, per-district legend. */
function CampusPage({ districts = [], onEvent = () => {} }) {
  const built = districts.filter(d => d.unlocked).length;
  return <div style={{ ...gBase, background: color.ground, padding: '30px 32px 48px' }}>
    <Kicker style={{ marginBottom: 8 }}>your campus</Kicker>
    <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.03em', margin: '0 0 6px' }}>
      {built === 0 ? 'An empty lot. For now.' : built === districts.length ? 'Campus complete.' : `${built} district${built > 1 ? 's' : ''} built.`}</h1>
    <p style={{ fontSize: 15, color: color.textSecondary, margin: '0 0 26px' }}>Every grade test you pass builds a district. No test, no bulldozers — nothing here can be lost.</p>
    <Card padding={24}><CampusMap districts={districts} onEvent={onEvent} /></Card></div>;
}



// ===== Gallery.jsx =====

function Row({ title, children }) {
  return <div style={{ marginBottom: 40 }}>
    <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#8A8578', marginBottom: 14 }}>{title}</div>
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>{children}</div></div>;
}
function Frame({ w = 720, h, children }) {
  return <div style={{ width: w, height: h, flex: 'none', border: '1px solid #E5E2DA', borderRadius: 10, overflow: 'hidden', background: '#F7F5F1' }}>{children}</div>;
}

const DEMO_QUESTS = [
  { id: 'q1', label: 'Fix 2 on the second look', progress: 1, target: 2, reward: 30 },
  { id: 'q2', label: 'One round with no help', progress: 1, target: 1, reward: 40, done: true }];
const DEMO_DISTRICTS = [
  { grade: 3, name: 'The Bakery', unlocked: true },
  { grade: 4, name: 'The Arcade', unlocked: false },
  { grade: 5, name: 'The Pet Shop', unlocked: false },
  { grade: 6, name: 'The Bus Line', unlocked: false },
  { grade: 7, name: 'The Cinema', unlocked: false },
  { grade: 8, name: 'The Skate Park', unlocked: false }];
const DEMO_HOME = {
  headline: 'You earned 210 Kredits this week.',
  grades: [
    { grade: 3, status: 'passed', detail: 'built The Bakery · +3 tickets' }, { grade: 4, status: 'current', pct: 42, detail: '2/4 worlds ready' },
    { grade: 5, status: 'locked', detail: 'after grade 4' }, { grade: 6, status: 'locked', detail: 'after grade 5' },
    { grade: 7, status: 'locked', detail: 'after grade 6' }, { grade: 8, status: 'locked', detail: 'after grade 7' }],
  jumpBack: { world: 'The Kitchen', tier: 2, skill: 'recipes & slices', blob: 'Ice_cream', color: '#F0AFCE' },
  worlds: [
    { name: 'The Kitchen', skill: 'recipes, slices & percents', worldColor: '#F0AFCE', blob: 'Ice_cream', tierLabel: '01 · Tier 2', tier: 2 },
    { name: 'The Store', skill: 'deals, change & money', worldColor: '#F4BE93', blob: 'Cash', tierLabel: '02 · Tier 3', tier: 3 },
    { name: 'The Trip', skill: 'weather, time & negatives', worldColor: '#5E9FE0', blob: 'Rain', tierLabel: '03 · Tier 1', tier: 1 },
    { name: 'The Build', skill: 'measuring & balancing', worldColor: '#8F97DE', blob: 'Learning', tierLabel: '04 · Tier 2', tier: 2 }],
  testReady: { grade: 4, note: 'All four worlds at tier 2+. 20 questions, 16 to pass. +3 tickets.' },
  tickets: 6, nextReward: { name: '$5 treat / 500 Kredits', cost: 10 },
  weekEarned: 210, weekSpent: 90, weekHint: 'Spent = help + shop. Thinking is free.',
  recentRuns: [
    { world: 'The Store', color: '#F4BE93', meta: '11/12 · +96 Kredits' },
    { world: 'The Kitchen', color: '#F0AFCE', meta: '9/12 · +64 Kredits' }],
};

const DEMO_QS = [
  { text: 'Pizza party for 6 kids. Each kid eats 3 slices. How many slices do you need?', mode: 'choice', choices: ['15', '18', '21', '12'], answerIndex: 1,
    teach: ['6 kids, 3 slices each.', 'That is 6 groups of 3.', '6 × 3 = 18 slices.'] },
  { text: 'A pizza has 8 slices. Shade how much of one pizza 6 slices is.', mode: 'fraction', vis: { parts: 8, target: 6 },
    teach: ['One pizza = 8 equal slices.', 'You are taking 6 of the 8.', 'Shade 6 pieces: that is 6/8, or 3/4.'] },
  { text: 'Pizzas cost $9 each and you need 3. You have $30. Pay with coins and bills: how much is left?', mode: 'money', vis: { target: 300 },
    teach: ['3 pizzas × $9 = $27.', 'You started with $30.', '$30 − $27 = $3. Make $3.00.'] },
  { text: 'The party starts at 4. Pizza takes 25 min to arrive. Order at 3:35 — how many minutes early is it?', mode: 'numline', vis: { from: 0, to: 10, start: 0, end: 0 },
    teach: ['3:35 plus 25 minutes is 4:00.', 'It lands exactly at start time.', 'That is 0 minutes early — cutting it close!'] },
  { text: 'Dessert: the freezer is at 18° and needs to drop to −4° for ice cream. Set it.', mode: 'thermo', vis: { min: -10, max: 20, target: -4 },
    teach: ['Start at 18 above zero.', 'Drop 18 to reach 0.', 'Keep going 4 more: negative 4.'] },
];

function Gallery() {
  const [on, setOn] = React.useState(true);
  const [seg, setSeg] = React.useState(15);
  const [nav, setNav] = React.useState('play');
  const [tab, setTab] = React.useState('Upgrades');
  const [quizKey, setQuizKey] = React.useState(0);
  const [txt, setTxt] = React.useState('');
  const [radio, setRadio] = React.useState('b');
  const [chk, setChk] = React.useState(true);
  const [sel, setSel] = React.useState('4');
  const [num, setNum] = React.useState(4);
  return <div style={{ fontFamily: "'Inter Tight', sans-serif", background: '#F7F5F1', minHeight: '100vh' }}>
    <NavBar items={[
      { id: 'play', label: 'Play', dot: color.green },
      { id: 'stand', label: 'My Stand', dot: color.lime },
      { id: 'shop', label: 'Shop', dot: '#8F97DE' },
      { id: 'rewards', label: 'Rewards', dot: color.gold },
      { id: 'parents', label: 'Grown-ups', dot: color.textFaint }]}
      active={nav} onNav={setNav} weekLabel="Week 1 · 3 days" kredits="128" avatar="Thinker" blobDir="blobs/" />
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '34px 32px 60px' }}>
      <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.03em', margin: '0 0 6px' }}>Component library</h1>
      <p style={{ fontSize: 15, color: '#5D5A52', margin: '0 0 34px' }}>Live render of react/ — kid side in Kampus style, Grown-ups surfaces in Modernist structure. Everything is working code: play the quiz, poke the settings.</p>

      <Row title="Home screen — composed, responsive (desktop + phone)">
        <Frame w={960}><HomeScreen data={DEMO_HOME} blobDir="blobs/" /></Frame>
        <Frame w={390}><HomeScreen data={DEMO_HOME} blobDir="blobs/" /></Frame>
      </Row>
      <Row title="Daily quests (Home card + Play HUD chip) · Campus map (teaser + full page)">
        <div style={{ width: 340 }}><DailyQuests quests={DEMO_QUESTS} /></div>
        <QuestChip quest={DEMO_QUESTS[0]} />
        <QuestChip quest={DEMO_QUESTS[1]} />
        <div style={{ width: 560 }}><Card padding={20}><Kicker style={{ marginBottom: 10 }}>your campus</Kicker><CampusMap districts={DEMO_DISTRICTS} teaser /></Card></div>
      </Row>
      <Row title="Campus page — full">
        <Frame w={960}><CampusPage districts={DEMO_DISTRICTS} /></Frame>
      </Row>
      <Row title="Parent PIN gate">
        <Frame w={420}><PinGate pin="1234" blobDir="blobs/" /></Frame>
      </Row>
      <Row title="Quiz round — a worked MISSION: throw the pizza party (5 chained real-world questions)">
        <Frame w={860} h={780}><QuizRound key={quizKey} questions={DEMO_QS} grade={4} tier={2} worldColor="#F0AFCE" mascot="Ice_cream" blobDir="blobs/" onQuit={() => setQuizKey(k => k + 1)} /></Frame>
      </Row>
      <Row title="Student onboarding — working">
        <Frame w={720} h={480}><StudentOnboarding blobDir="blobs/" onEvent={() => {}} /></Frame>
      </Row>
      <Row title="Parent onboarding — Modernist structure">
        <Frame w={720} h={520}><ParentOnboarding kidGrade={4} blobDir="blobs/" onEvent={() => {}} /></Frame>
      </Row>
      <Row title="Rewards (kid)">
        <div style={{ width: 860 }}><RewardsPanel tickets={6} nextReward={{ name: '$5 treat / 500 Kredits', cost: 10 }}
          menu={[{ name: '30 min screen time', cost: 3 }, { name: 'Pick the movie', cost: 4 }, { name: '$5 treat / 500 Kredits', cost: 10 }]}
          pending={[{ name: 'Pick the movie' }]} blobDir="blobs/" /></div>
      </Row>
      <Row title="Shop">
        <div style={{ width: 640 }}><ShopGrid activeTab={tab} onTab={setTab} kredits={128}
          items={[{ id: 'jar', name: 'Kredit Jar', icon: '🫙', cost: 100, bonus: 10, owned: true },
            { id: 'stall', name: 'Market Stall', icon: '🏪', cost: 250, bonus: 20, owned: false },
            { id: 'truck', name: 'Food Truck', icon: '🚚', cost: 600, bonus: 35, owned: false }]} /></div>
      </Row>
      <Row title="Grown-ups: analytics (Modernist structure, Kampus colors)">
        <div style={{ width: 560 }}><ParentAnalytics
          worlds={[{ name: 'The Kitchen', pct: 84, color: '#F0AFCE' }, { name: 'The Store', pct: 91, color: '#F4BE93' }, { name: 'The Trip', pct: 62, color: '#5E9FE0' }, { name: 'The Build', pct: 77, color: '#8F97DE' }]}
          focus={[{ skill: 'Reading negative temperatures', note: '58% over 12 tries' }]}
          skills={[{ skill: 'Equivalent fractions', tries: 24, hints: 3, acc: 88 }, { skill: 'Making change', tries: 18, hints: 1, acc: 94 }, { skill: 'Negative numbers', tries: 12, hints: 6, acc: 58 }]} /></div>
      </Row>
      <Row title="Grown-ups: ticket admin">
        <div style={{ width: 560 }}><TicketAdmin tickets={6} weekTickets={4} pending={[{ name: 'Pick the movie', cost: 4 }]}
          menu={[{ name: '30 min screen time', cost: 3 }, { name: 'Pick the movie', cost: 4 }, { name: '$5 treat / 500 Kredits', cost: 10 }]} /></div>
      </Row>
      <Row title="Grown-ups: settings">
        <div style={{ width: 560 }}><ParentSettings grade={4} sessionMins={15} focusMode={true} sound={true} /></div>
      </Row>

      <Row title="Buttons">
        <Button variant="primary" size="lg">Run it back</Button>
        <Button variant="primary">Bet</Button>
        <Button variant="ink">I'll try first</Button>
        <Button variant="outline">Home</Button>
        <Button variant="gold" size="sm">Teach me · costs half</Button>
        <Button variant="ghost" size="sm">Grown-ups →</Button>
        <Button variant="destructive" size="sm">Full reset</Button>
        <Button disabled>120 Kredits</Button>
      </Row>
      <Row title="Chips, icons, dots">
        <Chip dot={color.orange}>Week 1 · 3 days</Chip>
        <Chip><KreditCoin /> 128</Chip>
        <Chip><TicketIcon size={15} /> 6 tickets</Chip>
        <Logo />
        <TierDots earned={2} />
      </Row>
      <Row title="Form elements">
        <div style={{ width: 260, display: 'grid', gap: 14 }}>
          <TextField label="Reward name" placeholder="e.g. Pick the movie" value={txt} onChange={setTxt} />
          <Select label="Grade" value={sel} onChange={setSel} options={[3, 4, 5, 6, 7, 8].map(g => ({ value: String(g), label: 'Grade ' + g }))} />
          <Checkbox checked={chk} onChange={setChk} label="Read questions out loud" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ fontSize: 13.5, fontWeight: 600 }}>Ticket cost</span><Stepper value={num} onChange={setNum} min={1} /></div>
        </div>
        <div style={{ width: 320 }}><RadioGroup value={radio} onChange={setRadio} options={[
          { value: 'a', label: 'Standard round', hint: '12 questions, ticket for a sharp run' },
          { value: 'b', label: 'Quick 6', hint: 'Half-size round, no ticket' }]} /></div>
      </Row>
      <Row title="Controls & progress">
        <Toggle on={on} onChange={setOn} />
        <Segmented value={seg} onChange={setSeg} options={[{ value: 0, label: 'Off' }, { value: 10, label: '10m' }, { value: 15, label: '15m' }, { value: 20, label: '20m' }]} />
        <div style={{ width: 240 }}><ProgressBar value={64} /></div>
        <div style={{ width: 240 }}><ProgressBar height={10} segments={[{ pct: 70, color: color.green }, { pct: 30, color: color.red }]} /></div>
      </Row>
      <Row title="Grade cards">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 172px)', gap: 10 }}>
          <GradeCard grade={3} status="passed" detail="built The Bakery · +3 tickets" />
          <GradeCard grade={4} status="current" pct={42} detail="2/4 worlds ready" />
          <GradeCard grade={5} status="locked" detail="after grade 4" />
        </div>
      </Row>
      <Row title="World tile · Kredits week · Teach confirm">
        <div style={{ width: 300 }}><WorldTile name="The Kitchen" skill="recipes & slices" worldColor="#F0AFCE" blob="Ice_cream" tierLabel="01 · Tier 2" tier={2} blobDir="blobs/" /></div>
        <div style={{ width: 300 }}><KreditsWeekCard earned={210} spent={90} hint="Spent = help + shop. Thinking is free." /></div>
        <div style={{ width: 380 }}><TeachConfirm solo={24} withHelp={12} /></div>
      </Row>
      <Row title="Cards & blobs">
        <Card style={{ width: 220 }}><Kicker style={{ marginBottom: 8 }}>white card</Kicker><div style={{ fontSize: 15 }}>Default surface with 1px border and the one allowed shadow.</div></Card>
        <Card dashed style={{ width: 220, textAlign: 'center' }}><Blob name="Coffee" size={64} dir="blobs/" opacity={0.85} /><div style={{ fontSize: 13, color: '#8A8578', marginTop: 8 }}>Empty state</div></Card>
        <Blob name="Party" size={96} dir="blobs/" />
        <Blob name="Startup" size={96} dir="blobs/" />
      </Row>
    </div></div>;
}



module.exports = { Gallery };
