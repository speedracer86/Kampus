// Kampus quiz engine — fully working round logic from the prototype, UI + state included.
// Backend feeds questions and listens on onEvent(type, payload). See README for the event table.
import { color, type, radius, band, streakColors, confetti, font } from './tokens.js';
import { Button, Kicker, ProgressBar, KreditCoin, Blob } from './primitives.jsx';

const qBase = { fontFamily: font.family, boxSizing: 'border-box' };
const MULT = (s) => s >= 10 ? 3 : s >= 6 ? 2 : s >= 3 ? 1.5 : 1;
const TITLE = (s) => s >= 13 ? 'LEGEND' : s >= 10 ? 'CEO' : s >= 8 ? 'BOSS' : s >= 6 ? 'MANAGER' : s >= 4 ? 'PRO' : s >= 2 ? 'INTERN' : 'STARTER';

/** Built-in read-aloud (browser voice). */
export function speak(text) {
  try {
    const u = new SpeechSynthesisUtterance(String(text).replace(/−/g, ' negative '));
    const vs = speechSynthesis.getVoices();
    u.voice = vs.find(v => /Natural/.test(v.name)) || vs.find(v => /Google US/.test(v.name)) || vs.find(v => /Samantha/.test(v.name)) || null;
    u.rate = 0.95; speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch (e) { /* no speech support */ }
}

/** Tap-the-number-line answer mode. vis: {from, to, start, end} */
export function NumberLine({ vis, feedback, picked, onPick }) {
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
export function FractionPieces({ vis, feedback, picked, onPick }) {
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
export function MoneyCounter({ vis, feedback, picked, onPick }) {
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
export function Thermometer({ vis, feedback, picked, onPick }) {
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
export function TeachPanel({ steps, onClose }) {
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
export function QuizRound({ questions, grade = 4, tier = 1, gearBonus = 0, worldColor = '#F0AFCE', mascot = 'Ice_cream', blobDir = 'blobs/', focusMode = true, onEvent = () => {}, onQuit }) {
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
export function EndOfRound({ kredits, acc, best, fixed = 0, comeback, mascot = 'Party', blobDir = 'blobs/', onAgain, onHome }) {
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

