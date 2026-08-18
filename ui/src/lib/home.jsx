// Composed Home screen + Parent PIN gate. Responsive: grids collapse below ~900px and ~640px.
import { color, type, radius, shadow, font, worldTint } from './tokens.js';
import { Button, Card, Kicker, ProgressBar, TicketIcon, Blob } from './primitives.jsx';
import { GradeCard, WorldTile, KreditsWeekCard } from './app.jsx';

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
export function HomeScreen({ data, blobDir = 'blobs/', onEvent = () => {} }) {
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
export function PinGate({ pin = '1234', onPass = () => {}, onCancel, blobDir = 'blobs/' }) {
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
