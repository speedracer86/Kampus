// Kid-side flows: student onboarding, rewards, shop. Kampus style, working state, onEvent bus.
import { color, type, radius, shadow, font } from './tokens.js';
import { Button, Card, Kicker, ProgressBar, TicketIcon, KreditCoin, Blob } from './primitives.jsx';

const kBase = { fontFamily: font.family, boxSizing: 'border-box' };

/** Student onboarding — 3 steps: welcome, grade, avatar. onEvent('onboarded', {grade, avatar}). */
export function StudentOnboarding({ blobDir = 'blobs/', onEvent = () => {} }) {
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
export function RewardsPanel({ tickets = 0, nextReward, menu = [], pending = [], blobDir = 'blobs/', onEvent = () => {} }) {
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
export function ShopGrid({ tabs = ['Upgrades', 'Pets', 'Themes'], activeTab, onTab, items = [], kredits = 0, onEvent = () => {} }) {
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

