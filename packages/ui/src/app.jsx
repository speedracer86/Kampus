// Kampus app frame — composed from primitives + tokens.
import { color, radius, font, money } from './tokens.js';
import { Chip, Logo } from './primitives.jsx';

const base = { fontFamily: font.family, boxSizing: 'border-box' };

/**
 * §0 app frame: the nav sits on the ground (no frosted card) under a 1.5px rule,
 * Kredits read with a $, and the avatar is a 38px world-colour disc with an ink
 * initial — never a blob illustration (§0 "Avatar").
 */
export function NavBar({ items, active, onNav, weekLabel, kredits, avatar, avatarColor, onShop }) {
  // items: [{id, label, dot}]
  return <nav style={{ ...base, borderBottom: `1.5px solid ${color.navRule}`, position: 'sticky', top: 0,
    background: color.ground, zIndex: 10, padding: '14px clamp(16px, 3vw, 48px)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, maxWidth: 1280, margin: '0 auto', flexWrap: 'wrap', rowGap: 6 }}>
    <span style={{ marginRight: 'clamp(8px, 1.5vw, 22px)', flex: 'none' }}><Logo /></span>
    <div style={{ flex: 1 }} />
    {items.map(n => { const sel = n.id === active;
      return <NavItem key={n.id} label={n.label} dot={n.dot} active={sel} onClick={() => onNav && onNav(n.id)} />; })}
    <div style={{ flex: 1 }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 16 }}>
      {weekLabel && <Chip style={{ background: color.surface }}>{weekLabel}</Chip>}
      <button onClick={onShop} style={{ ...base, display: 'flex', alignItems: 'center', gap: 7, background: color.surface,
        border: 'none', borderRadius: radius.full, padding: '8px 16px', fontSize: 14, fontWeight: 700,
        cursor: 'pointer', whiteSpace: 'nowrap', flex: 'none' }}>
        <span style={{ color: color.ink }}>{money(kredits)}</span></button>
      {avatar && <span style={{ ...base, width: 38, height: 38, borderRadius: radius.full, flex: 'none',
        background: avatarColor || color.world?.fractions?.color || '#F0AFCE', color: color.ink,
        display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 800 }}>
        {String(avatar).trim().charAt(0).toUpperCase()}</span>}
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
