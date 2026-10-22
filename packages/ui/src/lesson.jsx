/* The Daily Lesson — STYLE_GUIDE §0 "Daily lesson" (7a desktop, 7b phone).

   Five moves, in order: Warm-up (drawn from the review queue) -> New idea (the
   teach phase, with its cheat-sheet column and hands-on steps) -> Guided (fading
   scaffolds) -> Mixed (interleaved) -> Prove it (no help; a miss branches into a
   re-teach and two fresh questions).

   The runner owns only session state and never persists anything: questions,
   teach content and pricing all arrive as props, and everything the backend
   needs leaves through onEvent (answer, teach_used, move_complete, reteach,
   lesson_complete). No timer appears anywhere — the lesson is untimed by rule. */
import { color, type, radius, font, numeral, dollars } from './tokens.js';
import { Button, Kicker } from './primitives.jsx';
import { useWidth, speak } from './util.jsx';
import { Question } from './question.jsx';
import { INTERACTIVES } from './interactives.jsx';
import { TEACH_LAYOUTS, TakeawayBand, NotesCounter, VoiceRow, voiceMode } from './teach-layouts.jsx';

const lBase = { fontFamily: font.family, boxSizing: 'border-box' };
export const MOVES = ['warmup', 'new', 'guided', 'mixed', 'prove'];
const MOVE_LABEL = { warmup: 'Warm-up', new: 'New idea', guided: 'Guided', mixed: 'Mixed', prove: 'Prove it' };

/* Mirrors packages/engine/src/metrics.js lessonReadiness/lessonEarnsPay, for the same
   reason defaultPricer mirrors payout.js: this library is zero-dependency by contract,
   so it cannot import the engine. The engine is the tested source of truth; these two
   predicates are four lines each and are kept deliberately trivial so they cannot
   drift in behaviour. AUDIT B4. */
const REQUIRED_MOVES = ['guided', 'prove'];
const lessonReadiness = (moves = []) => {
  const missing = REQUIRED_MOVES.filter(id => {
    const m = moves.find(x => x.id === id);
    return !m || !(m.questions?.length > 0);
  });
  return { playable: missing.length === 0, missing };
};
const lessonEarnsPay = (answered = {}) => REQUIRED_MOVES.every(id => (answered[id] || 0) > 0);

/** Mirrors packages/engine/src/payout.js so the library stays dependency-free.
    apps/web passes the engine's own payout() in as `pricer`; this is the fallback. */
const MULT = (s) => (s >= 10 ? 3 : s >= 6 ? 2 : s >= 3 ? 1.5 : 1);
const defaultPricer = ({ tier = 1, streak = 1, firstTry = false, teachUsed = false, tokenUsed = false }) => {
  const mult = MULT(streak);
  let amount = Math.round((8 + 4 * tier) * mult);
  const pills = [];
  if (mult > 1) pills.push({ label: `×${mult} streak`, kind: 'streak' });
  if (firstTry) { amount += 5; pills.push({ label: '+5 first try', kind: 'first' }); }
  if (teachUsed && tokenUsed) pills.push({ label: 'token used · full pay', kind: 'token' });
  if (teachUsed && !tokenUsed) { amount = Math.ceil(amount / 2); pills.push({ label: 'half pay · help', kind: 'help' }); }
  return { amount, pills };
};

/** §0 top bar: five labelled columns, one 6px segment per question, clickable to jump. */
export function LessonSpine({ moves, active, progress, earned, tokensLeft, onJump, phone }) {
  return <div style={{ ...lBase, display: 'flex', alignItems: 'flex-end', gap: phone ? 10 : 18, flexWrap: 'wrap' }}>
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${moves.length}, 1fr)`, gap: phone ? 8 : 14, flex: 1, minWidth: phone ? '100%' : 460 }}>
      {moves.map((m, mi) => {
        const segs = Math.max(1, m.questions?.length || 1);
        const done = progress[m.id]?.done || 0;
        const isCurrent = mi === active;
        return <button key={m.id} onClick={() => onJump && onJump(mi)} style={{ ...lBase, border: 'none', background: 'none',
          padding: 0, textAlign: 'left', cursor: onJump ? 'pointer' : 'default' }}>
          {!phone && <>
            <div style={{ fontSize: 13, fontWeight: 800, color: isCurrent ? color.ink : color.muted }}>{MOVE_LABEL[m.id]}</div>
            <div style={{ fontSize: 11.5, color: color.muted, marginBottom: 7 }}>{m.meta || ''}</div>
          </>}
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: segs }, (_, i) => <span key={i} style={{ flex: 1, height: 6, borderRadius: 3,
              background: i < done ? color.green : isCurrent && i === done ? color.ink : color.todo }} />)}
          </div>
        </button>;
      })}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ ...lBase, background: color.greenTint, color: color.greenDeep, borderRadius: radius.full,
        padding: '7px 13px', fontSize: 13, fontWeight: 700 }}>+${earned} today</span>
      <span style={{ ...lBase, display: 'inline-flex', alignItems: 'center', gap: 6, background: color.surface,
        borderRadius: radius.full, padding: '7px 13px', fontSize: 13, fontWeight: 700 }}>
        Teach Tokens
        {Array.from({ length: 3 }, (_, i) => <i key={i} style={{ width: 9, height: 9, borderRadius: radius.full,
          background: i < tokensLeft ? color.gold : 'transparent', boxShadow: i < tokensLeft ? 'none' : `inset 0 0 0 1.5px ${color.ink}` }} />)}
      </span>
      <span style={{ ...lBase, background: color.surface, borderRadius: radius.full, padding: '7px 13px', fontSize: 13, fontWeight: 700 }}>Untimed</span>
    </div>
  </div>;
}

/** The teach phase: cheat-sheet column on the left, one step at a time on the right.
    Each step gates Next — reading is not enough, the step has to be solved.

    Two shapes of step are supported. A §0b step carries `layout` and its payload
    and renders through TEACH_LAYOUTS; the older shape (prompt/body, optional
    `interactive`) still renders as it did, so panels the bank has not upgraded
    keep working. Lesson state is {stepIdx, solved[], notes[]} — notes are what
    "Write it down" appends, and they are the cheat-sheet column she keeps. */
export function TeachSteps({ teach, grade = 6, worldColor, blobDir = '/blobs/', onDone, onEvent = () => {}, phone }) {
  const steps = teach.steps || [];
  const [at, setAt] = React.useState(0);
  // A step with nothing to solve is solved on arrival; a layout or an interactive
  // has to be done. Next reads this array and nothing else.
  const [solved, setSolved] = React.useState(() => steps.map(s => !s.interactive && !s.layout));
  const [notes, setNotes] = React.useState([]);
  const [fresh, setFresh] = React.useState(null);     // the note highlighted for one beat
  const [quiet, setQuiet] = React.useState(false);
  const step = steps[at];
  const canNext = solved[at];
  const setSolvedAt = (i, v) => setSolved(s => (s[i] === v ? s : s.map((x, j) => (j === i ? v : x))));

  const Interactive = step?.interactive ? INTERACTIVES[step.interactive] : null;
  const Layout = step?.layout ? TEACH_LAYOUTS[step.layout] : null;
  const mode = voiceMode(grade);

  const writeNote = () => {
    const note = step?.takeaway;
    if (!note || notes.includes(note)) return;
    setNotes(n => [...n, note]);
    setFresh(note);
    onEvent('note_written', { index: at, note });
    setTimeout(() => setFresh(null), 1400);
  };

  const column = <div>
    <Kicker style={{ marginBottom: 14 }}>
      Kampus Class · 2–3 min<NotesCounter count={notes.length} /></Kicker>
    {steps.map((s, i) => {
      const isDone = i < at && solved[i], isNow = i === at;
      return <button key={i} onClick={() => i <= at && setAt(i)} style={{ ...lBase, display: 'flex', gap: 14, width: '100%',
        textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: i <= at ? 'pointer' : 'default' }}>
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 'none' }}>
          <span style={{ width: 24, height: 24, borderRadius: radius.full, display: 'grid', placeItems: 'center',
            fontSize: 13, fontWeight: 800, color: isDone ? '#fff' : color.ink,
            background: isDone ? color.green : 'transparent',
            boxShadow: isDone ? 'none' : `inset 0 0 0 ${isNow ? 2 : 1.5}px ${isNow ? color.ink : 'rgba(35,37,43,.22)'}` }}>
            {isDone ? '✓' : ''}</span>
          {i < steps.length - 1 && <span style={{ width: 1.5, flex: 1, minHeight: 26, background: 'rgba(35,37,43,.14)' }} />}
        </span>
        <span style={{ paddingBottom: 18 }}>
          <span style={{ display: 'block', fontSize: 20, fontWeight: 700, color: isNow || isDone ? color.ink : color.muted }}>
            {s.title || s.verb || `Step ${i + 1}`}</span>
          {isDone && s.takeaway && <span style={{ display: 'block', fontSize: 17, fontWeight: 400, color: color.muted, marginTop: 4 }}>{s.takeaway}</span>}
        </span>
      </button>;
    })}
    {/* The notes she wrote down, in the column she will look at during the mission. */}
    {!!notes.length && <div style={{ marginTop: 6 }}>
      <Kicker style={{ marginBottom: 10 }}>Your notes</Kicker>
      {notes.map(n => <div key={n} style={{ fontSize: 16, lineHeight: 1.4, padding: '10px 12px', marginBottom: 6,
        borderRadius: 12, background: fresh === n ? color.greenTint : 'transparent',
        transition: 'background .5s ease' }}>{n}</div>)}
    </div>}
  </div>;

  const kicker = step?.layout
    ? `New idea · step ${at + 1} of ${steps.length}${step.verb ? ` · ${step.verb}` : ''}`
    : null;
  const promptSize = phone ? 23 : (String(step?.prompt || '').length > 56 ? 32 : 34);

  const body = <div style={{ background: color.surface, borderRadius: radius.sheet, padding: phone ? 20 : 32 }}>
    {mode !== 'c' && <VoiceRow mode={mode} text={step?.speak || step?.prompt} worldColor={worldColor || color.ink}
      quiet={quiet} onQuiet={setQuiet} speak={speak} blobDir={blobDir} phone={phone} />}
    {kicker && <Kicker style={{ marginBottom: 10 }}>{kicker}</Kicker>}
    <h2 style={{ fontSize: Layout ? (mode === 'a' && !phone ? 40 : promptSize) : (phone ? 24 : 36),
      fontWeight: 600, letterSpacing: '-.025em', lineHeight: 1.2, margin: '0 0 22px' }}>{step?.prompt}</h2>
    {Layout && <Layout step={step} solved={solved[at]} phone={phone}
      onSolve={(ok) => { setSolvedAt(at, ok); if (ok) onEvent('teach_solved', { index: at, layout: step.layout }); }} />}
    {Interactive && <Interactive {...(step.config || {})} onSolve={(ok) => setSolvedAt(at, ok)} />}
    {!Interactive && !Layout && step?.body && <div style={{ fontSize: 18, lineHeight: 1.55 }}>{step.body}</div>}
    {/* The takeaway band only opens once the step is actually solved. */}
    {canNext && step?.takeaway && <TakeawayBand note={step.takeaway} written={notes.includes(step.takeaway)}
      onWrite={writeNote} phone={phone} />}
    <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: `1px solid ${color.rule}` }}>
      <Button variant="outline" size="sm" disabled={at === 0} onClick={() => setAt(a => Math.max(0, a - 1))}>Back</Button>
      <Button variant="ink" size="sm" disabled={!canNext} onClick={() => {
        onEvent('teach_step', { index: at, id: step?.id });
        if (at + 1 < steps.length) return setAt(at + 1);
        onDone();
      }}>{at + 1 < steps.length ? 'Next' : 'Start the mission →'}</Button>
    </div>
  </div>;

  return <div style={{ ...lBase }}>
    {mode === 'c' && step?.prompt && <div style={{ marginBottom: 14 }}>
      <VoiceRow mode="c" text={step.speak || step.prompt} speak={speak} /></div>}
    {phone ? <>{body}<div style={{ marginTop: 20 }}>{column}</div></>
      : <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 48, alignItems: 'start' }}>{column}{body}</div>}
  </div>;
}

/** The New idea / re-teach view: title, lede, three ruled step rows, last value green. */
export function ReteachView({ teach, onContinue, label = 'Try one →', phone }) {
  return <div style={{ ...lBase, background: color.surface, borderRadius: radius.sheet, padding: phone ? 22 : 36 }}>
    <Kicker style={{ marginBottom: 10 }}>{teach.kicker || 'New idea'}</Kicker>
    <h2 style={{ fontSize: phone ? 28 : 40, fontWeight: 600, letterSpacing: '-.025em', margin: '0 0 10px' }}>{teach.title}</h2>
    {teach.lede && <p style={{ fontSize: 18, lineHeight: 1.5, color: color.muted, margin: '0 0 24px' }}>{teach.lede}</p>}
    <div style={{ borderTop: `1px solid ${color.rule}` }}>
      {(teach.rows || []).map((r, i, all) => <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 18,
        justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${color.rule}` }}>
        <span style={{ ...numeral(40), flex: 'none', minWidth: 90 }}>{r.lead}</span>
        <span style={{ fontSize: 17, fontWeight: 600, flex: 1 }}>{r.how}</span>
        <span style={{ ...numeral(40), color: i === all.length - 1 ? color.greenDeep : color.ink }}>{r.value}</span>
      </div>)}
    </div>
    <div style={{ marginTop: 26 }}><Button variant="ink" onClick={onContinue}>{label}</Button></div>
  </div>;
}

/** Done: what today paid, in Kredits and in real money. */
export function LessonDone({ earned, rewardCents = 50, moves, onAgain, onDone, phone }) {
  return <div style={{ ...lBase, display: phone ? 'block' : 'grid', gridTemplateColumns: '340px 1fr', gap: 48, alignItems: 'start' }}>
    <div>
      <Kicker style={{ marginBottom: 14 }}>Today’s lesson</Kicker>
      {moves.map(m => <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ width: 24, height: 24, borderRadius: radius.full, background: color.green, color: '#fff',
          display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800 }}>✓</span>
        <span style={{ fontSize: 17, fontWeight: 600 }}>{MOVE_LABEL[m.id]}</span>
      </div>)}
    </div>
    <div style={{ background: color.surface, borderRadius: radius.sheet, padding: phone ? 22 : 32, marginTop: phone ? 20 : 0 }}>
      <h2 style={{ fontSize: phone ? 28 : 40, fontWeight: 700, letterSpacing: '-.025em', margin: '0 0 24px' }}>Lesson done.</h2>
      <div style={{ display: 'grid', gridTemplateColumns: phone ? '1fr' : '1fr 1fr', gap: 14 }}>
        <div style={{ background: color.fill, borderRadius: radius.lg, padding: 22 }}>
          <Kicker style={{ marginBottom: 8 }}>Kredits today</Kicker>
          <div style={{ ...numeral(56), color: color.greenDeep }}>+${earned}</div>
        </div>
        <div style={{ background: color.fill, borderRadius: radius.lg, padding: 22 }}>
          <Kicker style={{ marginBottom: 8 }}>Real reward</Kicker>
          <div style={{ ...numeral(56) }}>{dollars(rewardCents)}</div>
          <div style={{ fontSize: 13.5, color: color.muted, marginTop: 6 }}>Waiting on a grown-up</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 26, flexWrap: 'wrap' }}>
        <Button variant="outline" onClick={onAgain}>Run it again</Button>
        {/* There is no shop yet, and a button that goes nowhere teaches her the
            app lies. It points home until a shop exists (AUDIT B1). */}
        <Button variant="ink" onClick={onDone}>Back to Today</Button>
      </div>
    </div>
  </div>;
}

/**
 * The five-move runner.
 * lesson: {title, unit, world, moves:[{id, meta, questions?, teach?, teachFree?, scaffoldFades?}], reteach?}
 * pricer: ({tier, streak, firstTry, teachUsed, tokenUsed}) -> {amount, pills} — pass the engine's payout().
 */
export function DailyLesson({ lesson, tier = 1, grade = 6, tokensPerRun = 3, rewardCents = 50,
  blobDir = '/blobs/', pricer = defaultPricer, onEvent = () => {}, onExit, onDone }) {
  const ref = React.useRef(null);
  const phone = useWidth(ref) < 860;
  const moves = lesson.moves || [];

  const [at, setAt] = React.useState(0);          // move index
  const [qi, setQi] = React.useState(0);          // question index inside the move
  const [progress, setProgress] = React.useState({});
  // Questions actually ANSWERED per move. A lesson pays only if the teaching moves
  // really ran (AUDIT B4) — assembling them is not the same as doing them.
  const [answered, setAnswered] = React.useState({});
  const [earned, setEarned] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [tokensLeft, setTokensLeft] = React.useState(tokensPerRun);
  const [ui, setUi] = React.useState({ feedback: null, picked: null, help: null, teachConfirm: false, payout: null, teachUsed: false, tokenUsed: false, tries: 0 });
  const [phase, setPhase] = React.useState('run'); // run | snag | teach | reteach | done
  const [snagTried, setSnagTried] = React.useState(false);
  const [fresh, setFresh] = React.useState(false); // in the post-reteach fresh pair

  const move = moves[at];
  // A move that teaches opens with its Snag (PLAY_SYSTEM §1) before the teach panel.
  React.useEffect(() => {
    if (move?.snag) { setPhase('snag'); setSnagTried(false); }
    else if (move?.teach && !move.questions) setPhase('teach');
    else setPhase('run');
  }, [at]);

  const questions = fresh && move?.fresh ? move.fresh : (move?.questions || []);
  const q = questions[qi];
  const teachFree = !!move?.teachFree;
  const resetUi = () => setUi({ feedback: null, picked: null, help: null, teachConfirm: false, payout: null, teachUsed: false, tokenUsed: false, tries: 0 });

  const finishMove = () => {
    onEvent('move_complete', { move: move.id });
    if (at + 1 < moves.length) { setAt(at + 1); setQi(0); setFresh(false); resetUi(); return; }
    // No "done" and no real money unless the teaching moves actually ran questions.
    // A silent success here is how an empty lesson would pay out for nothing.
    if (!lessonEarnsPay(answered)) {
      onEvent('lesson_empty', { reason: 'required moves did not run', answered });
      setPhase('empty');
      return;
    }
    onEvent('lesson_complete', { kredits: earned, rewardCents });
    setPhase('done');
  };

  const nextQuestion = () => {
    resetUi();
    if (qi + 1 < questions.length) return setQi(qi + 1);
    if (fresh) { setFresh(false); return finishMove(); }
    finishMove();
  };

  const answer = (i) => {
    if (ui.feedback) return;
    const right = i === q.correct;
    if (right) {
      const s = streak + 1;
      const payout = pricer({ tier, streak: s, firstTry: ui.tries === 0, teachUsed: ui.teachUsed, tokenUsed: ui.tokenUsed });
      setStreak(s); setEarned(e => e + payout.amount);
      setProgress(p => ({ ...p, [move.id]: { done: Math.min(questions.length, (p[move.id]?.done || 0) + 1) } }));
      setAnswered(a => ({ ...a, [move.id]: (a[move.id] || 0) + 1 }));
      onEvent('answer', { right: true, move: move.id, gain: payout.amount, streak: s, firstTry: ui.tries === 0, teachUsed: ui.teachUsed, tokenUsed: ui.tokenUsed });
      setUi(u => ({ ...u, feedback: 'correct', picked: i, payout }));
      setTimeout(nextQuestion, 1400);
      return;
    }
    setStreak(0);
    onEvent('answer', { right: false, move: move.id });
    setUi(u => ({ ...u, feedback: 'wrong', picked: i, tries: u.tries + 1 }));
  };

  // Prove it is the only move where a miss branches into a re-teach + two fresh questions.
  const onWrongNext = () => {
    if (move.id === 'prove' && lesson.reteach && !fresh) {
      onEvent('reteach', { move: move.id, skill: q?.skill });
      setPhase('reteach');
      return;
    }
    resetUi();
  };

  // Assembly-time check: if the lesson came back without its teaching moves, say so
  // plainly rather than presenting a hollow lesson (AUDIT B4).
  const readiness = lessonReadiness(moves);
  React.useEffect(() => {
    if (!readiness.playable) onEvent('lesson_empty', { reason: 'assembled empty', missing: readiness.missing });
  }, [readiness.playable]);

  const frame = (children) => <div ref={ref} style={{ ...lBase, background: color.ground, minHeight: '100%', padding: phone ? '18px 16px 40px' : '28px 48px 56px' }}>
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
        {onExit && <button onClick={onExit} style={{ ...lBase, border: 'none', cursor: 'pointer', background: color.surface,
          borderRadius: radius.full, padding: '8px 16px', fontSize: 13, fontWeight: 700 }}>Exit</button>}
        <span style={{ fontSize: 13, fontWeight: 700, color: color.muted }}>{lesson.unit}</span>
      </div>
      {phase !== 'done' && <div style={{ marginBottom: phone ? 20 : 30 }}>
        <LessonSpine moves={moves} active={at} progress={progress} earned={earned} tokensLeft={tokensLeft}
          onJump={(i) => { if (i <= at) { setAt(i); setQi(0); setFresh(false); resetUi(); } }} phone={phone} />
      </div>}
      {children}
    </div>
  </div>;

  if (!readiness.playable || phase === 'empty') return frame(
    <div style={{ background: color.surface, borderRadius: radius.sheet, padding: phone ? 24 : 36, maxWidth: 560 }}>
      <Kicker style={{ marginBottom: 10 }}>Back in a moment</Kicker>
      <h2 style={{ fontSize: phone ? 26 : 34, fontWeight: 600, letterSpacing: '-.025em', margin: '0 0 12px' }}>
        This lesson is being restocked.</h2>
      <p style={{ fontSize: 17, lineHeight: 1.5, color: color.muted, margin: '0 0 24px' }}>
        Nothing you did wrong — today's questions didn't come through. Try free practice
        while we sort it, and this one will be here tomorrow.</p>
      <Button variant="ink" onClick={onExit}>Back to Today</Button>
    </div>);

  if (phase === 'done') return frame(<LessonDone earned={earned} rewardCents={rewardCents} moves={moves}
    onAgain={() => { setAt(0); setQi(0); setEarned(0); setStreak(0); setTokensLeft(tokensPerRun); resetUi(); setPhase('run'); }}
    onDone={onDone || onExit} phone={phone} />);

  if (phase === 'snag') {
    const sn = move.snag;
    return frame(<div>
      <div style={{ background: color.surface, borderRadius: radius.sheet, padding: phone ? 22 : 32, marginBottom: 18 }}>
        <Kicker style={{ marginBottom: 10 }}>The snag</Kicker>
        <p style={{ fontSize: phone ? 18 : 22, lineHeight: 1.45, margin: 0 }}>{sn.scene}</p>
      </div>
      <Question
        snag
        question={{ text: sn.q, answers: sn.answers || [String(sn.ans)],
          correct: (sn.answers || [String(sn.ans)]).indexOf(String(sn.ans)) }}
        context="lesson" tokensLeft={tokensLeft} feedback={null}
        onAnswer={() => { onEvent('snag_attempt', { move: move.id }); setSnagTried(true); }}
        onHelp={() => {}} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 20 }}>
        <span style={{ fontSize: 16, color: color.muted, flex: 1, minWidth: 220 }}>
          {snagTried ? 'You don’t have the move for this one yet. Here it is.' : 'Have a go. It costs nothing either way.'}</span>
        <Button variant="ink" onClick={() => { onEvent('snag_done', { move: move.id }); setPhase('teach'); }}>
          {snagTried ? 'Show me the move →' : 'Skip to the move →'}</Button>
      </div>
    </div>);
  }

  // The grade picks the voice mode, and the world picks the companion's colour.
  if (phase === 'teach') return frame(<TeachSteps teach={move.teach} phone={phone} onEvent={onEvent}
    grade={grade} worldColor={lesson.world?.color} blobDir={blobDir}
    onDone={() => { onEvent('move_complete', { move: move.id }); setProgress(p => ({ ...p, [move.id]: { done: 1 } })); finishMove(); }} />);

  if (phase === 'reteach') return frame(<ReteachView teach={lesson.reteach} phone={phone} label="2 fresh ones →"
    onContinue={() => { setFresh(true); setQi(0); resetUi(); setPhase('run'); }} />);

  if (!q) return frame(<div style={{ fontSize: 17, color: color.muted }}>Nothing to practise here.</div>);

  return frame(<Question question={q} context="lesson" teachFree={teachFree} tokensLeft={tokensLeft}
    feedback={ui.feedback} picked={ui.picked} payout={ui.payout} help={ui.help} teachConfirm={ui.teachConfirm}
    onAnswer={answer}
    onHelp={(next, { needsConfirm } = {}) => setUi(u => ({ ...u, help: next, teachConfirm: next === 'teach' && !!needsConfirm && !teachFree }))}
    onTeachConfirm={(use) => {
      if (!use) return setUi(u => ({ ...u, help: null, teachConfirm: false }));
      onEvent('teach_used', { token: tokensLeft > 0, move: move.id, free: teachFree });
      if (!teachFree && tokensLeft > 0) setTokensLeft(t => t - 1);
      setUi(u => ({ ...u, teachConfirm: false, teachUsed: true, tokenUsed: teachFree || tokensLeft > 0 }));
    }}
    onNext={onWrongNext} onEvent={onEvent} />);
}
