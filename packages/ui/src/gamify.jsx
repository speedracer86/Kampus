// Gamification: DailyQuests (2/day, Kredit-paying) + CampusMap (skyline, grade districts).
// Both stateless-over-props: backend owns quest progress + unlock state, components emit onEvent.
import { color, type, radius, shadow, font } from './tokens.js';
import { Card, Kicker, ProgressBar, KreditCoin } from './primitives.jsx';

const gBase = { fontFamily: font.family, boxSizing: 'border-box' };

/**
 * DailyQuests — Home card. quests: [{id, label, progress, target, reward, done}] (2 per day).
 * onEvent('quest_claim', quest) when a finished quest's Kredits are collected.
 */
export function DailyQuests({ quests = [], onEvent = () => {}, compact }) {
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
export function QuestChip({ quest, style }) {
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
export function CampusMap({ districts = [], teaser, onEvent = () => {} }) {
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
export function CampusPage({ districts = [], onEvent = () => {} }) {
  const built = districts.filter(d => d.unlocked).length;
  return <div style={{ ...gBase, background: color.ground, padding: '30px 32px 48px' }}>
    <Kicker style={{ marginBottom: 8 }}>your campus</Kicker>
    <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.03em', margin: '0 0 6px' }}>
      {built === 0 ? 'An empty lot. For now.' : built === districts.length ? 'Campus complete.' : `${built} district${built > 1 ? 's' : ''} built.`}</h1>
    <p style={{ fontSize: 15, color: color.textSecondary, margin: '0 0 26px' }}>Every grade test you pass builds a district. No test, no bulldozers — nothing here can be lost.</p>
    <Card padding={24}><CampusMap districts={districts} onEvent={onEvent} /></Card></div>;
}

