// Kampus primitives — zero-dependency React components, inline-styled from tokens.
// Usage: import { Button, Card, ... } from './primitives.jsx' (or transpile into your build).
import { color, type, radius, shadow, motion, font } from './tokens.js';

const base = { fontFamily: font.family, boxSizing: 'border-box' };

export function Button({ variant = 'primary', size = 'md', disabled, style, children, ...rest }) {
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
    style={{ ...base, padding: pad, fontSize: fs, fontWeight: variant === 'ghost' ? 600 : 700 + (size === 'lg' ? 100 : 0),
      borderRadius: size === 'sm' ? radius.sm : radius.md, cursor: disabled ? 'not-allowed' : 'pointer',
      ...(disabled ? { background: color.ground, color: color.textFaint, border: `1px solid ${color.border}` } : variants[variant]), ...style }}>
    {children}</button>;
}

export function Card({ padding = 20, dashed, tint, style, children }) {
  return <div style={{ ...base, background: tint || color.surface, borderRadius: radius.lg, padding,
    border: dashed ? `1px dashed ${color.border}` : tint ? 'none' : `1px solid ${color.border}`,
    boxShadow: tint || dashed ? 'none' : shadow.card, ...style }}>{children}</div>;
}

export function Kicker({ color: c = color.textMuted, style, children }) {
  return <div style={{ ...base, ...type.kicker, color: c, ...style }}>{children}</div>;
}

export function Chip({ dot, style, children }) {
  return <div style={{ ...base, display: 'inline-flex', alignItems: 'center', gap: 7, background: color.surface,
    border: `1px solid ${color.border}`, borderRadius: radius.md, padding: '7px 14px', fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', ...style }}>
    {dot && <span style={{ width: 7, height: 7, borderRadius: radius.full, background: dot, flex: 'none' }} />}{children}</div>;
}

export function ProgressBar({ value = 0, fill = color.gold, track = color.track, height = 8, segments, style }) {
  // segments: [{pct, color}] for stacked bars (e.g. earned vs spent)
  return <div style={{ ...base, display: 'flex', height, borderRadius: radius.md, overflow: 'hidden', background: track, ...style }}>
    {segments ? segments.map((s, i) => <div key={i} style={{ width: s.pct + '%', background: s.color, transition: motion.bar }} />)
      : <div style={{ width: Math.max(0, Math.min(100, value)) + '%', background: fill, borderRadius: radius.md, transition: motion.bar }} />}</div>;
}

export function Toggle({ on, onChange }) {
  return <button onClick={() => onChange && onChange(!on)} aria-pressed={!!on}
    style={{ ...base, background: on ? color.green : color.trackOff, border: 'none', borderRadius: radius.full,
      width: 44, height: 26, position: 'relative', cursor: 'pointer', flex: 'none' }}>
    <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: radius.full,
      background: '#fff', transition: motion.knob, boxShadow: '0 1px 2px rgba(0,0,0,.2)' }} /></button>;
}

export function Segmented({ options, value, onChange }) {
  // options: [{value, label}]
  return <div style={{ ...base, display: 'flex', gap: 6 }}>
    {options.map(o => { const sel = o.value === value;
      return <button key={String(o.value)} onClick={() => onChange && onChange(o.value)}
        style={{ ...base, background: sel ? color.ink : color.surface, color: sel ? '#fff' : color.ink,
          border: `1px solid ${sel ? color.ink : color.border}`, borderRadius: radius.sm, padding: '7px 12px',
          fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>{o.label}</button>; })}</div>;
}

export function TierDots({ earned = 0, total = 3 }) {
  return <div style={{ display: 'flex', gap: 6 }}>
    {Array.from({ length: total }, (_, i) => <span key={i} style={{ width: 9, height: 9, borderRadius: radius.full,
      background: i < earned ? color.gold : color.track }} />)}</div>;
}

export function KreditCoin({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color.ink} strokeWidth="2" fill={color.gold} />
    <text x="12" y="16.2" textAnchor="middle" fontSize="12" fontWeight="800" fill={color.goldDeep} fontFamily={font.family}>K</text></svg>;
}

export function TicketIcon({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M3 9C4.1 9 5 9.9 5 11C5 12.1 4.1 13 3 13V16C3 16.6 3.4 17 4 17H20C20.6 17 21 16.6 21 16V13C19.9 13 19 12.1 19 11C19 9.9 19.9 9 21 9V6C21 5.4 20.6 5 20 5H4C3.4 5 3 5.4 3 6V9Z"
      stroke={color.goldDeep} strokeWidth="1.8" strokeLinejoin="round" fill={color.gold} /></svg>;
}

export function Logo({ size = 26, wordmark = true }) {
  return <span style={{ ...base, display: 'inline-flex', alignItems: 'center', gap: 9 }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 21V3" stroke={color.ink} strokeWidth="2" strokeLinecap="round" />
      <path d="M5 4H19L15.5 8L19 12H5V4Z" stroke={color.ink} strokeWidth="1.8" strokeLinejoin="round" fill={color.orange} /></svg>
    {wordmark && <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.02em', color: color.ink }}>Kampus</span>}</span>;
}

export function Blob({ name, size = 84, dir = 'blobs/', opacity = 1, style, ...rest }) {
  return <img src={dir + name + '.svg'} alt="" {...rest}
    style={{ width: size, height: size, objectFit: 'contain', opacity, ...style }} />;
}


/** Text field with label; kid-side styling. */
export function TextField({ label, value, onChange, placeholder, type: t = 'text', style }) {
  const [focus, setFocus] = React.useState(false);
  return <label style={{ ...base, display: 'block', ...style }}>
    {label && <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: color.textSecondary }}>{label}</span>}
    <input type={t} value={value} placeholder={placeholder} onChange={e => onChange && onChange(e.target.value)}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{ ...base, width: '100%', padding: '11px 14px', fontSize: 15, fontWeight: 600, color: color.ink,
        background: color.surface, border: focus ? `2px solid ${color.green}` : `1px solid ${color.border}`,
        margin: focus ? -1 : 0, borderRadius: radius.md, outline: 'none' }} /></label>;
}

/** Radio group (vertical). options: [{value, label, hint?}] */
export function RadioGroup({ options, value, onChange, style }) {
  return <div style={{ ...base, display: 'grid', gap: 8, ...style }}>
    {options.map(o => { const sel = o.value === value;
      return <button key={String(o.value)} onClick={() => onChange && onChange(o.value)}
        style={{ ...base, display: 'flex', alignItems: 'flex-start', gap: 11, textAlign: 'left', cursor: 'pointer',
          background: sel ? color.greenTint : color.surface, border: `1.5px solid ${sel ? color.green : color.border}`,
          borderRadius: radius.md, padding: '12px 14px' }}>
        <span style={{ width: 18, height: 18, borderRadius: radius.full, border: `2px solid ${sel ? color.green : color.textFaint}`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none', marginTop: 1 }}>
          {sel && <span style={{ width: 8, height: 8, borderRadius: radius.full, background: color.green }} />}</span>
        <span><span style={{ fontSize: 14.5, fontWeight: 700, color: color.ink }}>{o.label}</span>
          {o.hint && <span style={{ display: 'block', fontSize: 12.5, color: color.textMuted, marginTop: 2 }}>{o.hint}</span>}</span></button>; })}</div>;
}

/** Checkbox row. */
export function Checkbox({ checked, onChange, label, style }) {
  return <button onClick={() => onChange && onChange(!checked)} style={{ ...base, display: 'flex', alignItems: 'center', gap: 10,
    background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', ...style }}>
    <span style={{ width: 20, height: 20, borderRadius: radius.sm, border: `2px solid ${checked ? color.green : color.textFaint}`,
      background: checked ? color.green : color.surface, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
      {checked && <svg width="12" height="12" viewBox="0 0 24 24"><path d="M4 12L10 18L20 6" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}</span>
    <span style={{ fontSize: 14.5, fontWeight: 600, color: color.ink }}>{label}</span></button>;
}

/** Select dropdown (native, styled). options: [{value, label}] */
export function Select({ options, value, onChange, label, style }) {
  return <label style={{ ...base, display: 'block', ...style }}>
    {label && <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: color.textSecondary }}>{label}</span>}
    <select value={value} onChange={e => onChange && onChange(e.target.value)}
      style={{ ...base, width: '100%', padding: '11px 12px', fontSize: 15, fontWeight: 600, color: color.ink,
        background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.md, cursor: 'pointer' }}>
      {options.map(o => <option key={String(o.value)} value={o.value}>{o.label}</option>)}</select></label>;
}

/** Number stepper (− n +). */
export function Stepper({ value, onChange, min = 0, max = 99, style }) {
  const btn = { ...base, width: 30, height: 30, borderRadius: radius.sm, border: `1px solid ${color.border}`,
    background: color.surface, fontSize: 16, fontWeight: 800, cursor: 'pointer', color: color.ink };
  return <span style={{ ...base, display: 'inline-flex', alignItems: 'center', gap: 10, ...style }}>
    <button style={btn} onClick={() => onChange && onChange(Math.max(min, value - 1))}>−</button>
    <span style={{ fontSize: 16, fontWeight: 800, minWidth: 24, textAlign: 'center' }}>{value}</span>
    <button style={btn} onClick={() => onChange && onChange(Math.min(max, value + 1))}>+</button></span>;
}

