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
import { Button, Kicker, Blob } from './primitives.jsx';
import { useWidth, speak } from './util.jsx';
import { Question, rich, richWords, plainSpeech } from './question.jsx';
import { INTERACTIVES } from './interactives.jsx';
import { TEACH_LAYOUTS, TakeawayBand, NotesCounter, VoiceRow, voiceMode } from './teach-layouts.jsx';
import { CountUp, Confetti, useReducedMotion } from './juice.jsx';
import { SayItShowIt, clipsFor, clipMetaFor, useSpokenLine, SweptLine, rateFor, whenVoiceQuiet } from './say-it-show-it.jsx';

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
export function TeachSteps({ teach, grade = 6, worldColor, blobDir = '/blobs/', voice, muted = false,
  onDone, onEvent = () => {}, phone, voiceRate, onRate }) {
  // The second worked example is IN teach.steps, spliced in by the seam (year.js)
  // before the final Try it. It used to sit behind a "Show me another one" button;
  // owner verdict, Nov 2026: an opt-in affordance asks for exactly the executive
  // function an ADHD kid is short on, so the kid who needs it most never taps it.
  // The full teaching is the default; nothing here is gated on asking.
  // Never dereference a missing teach: the phase/move mismatch above is fixed at
  // source, but rendering nothing beats taking the application down with it.
  const steps = teach?.steps || [];
  const [at, setAt] = React.useState(0);
  // A step with nothing to solve is solved on arrival; a layout or an interactive
  // has to be done. Next reads this array and nothing else.
  const [solved, setSolved] = React.useState(() => steps.map(s => !s.interactive && !s.layout));
  const [notes, setNotes] = React.useState([]);
  const [fresh, setFresh] = React.useState(null);     // the note highlighted for one beat
  const [quiet, setQuiet] = React.useState(false);
  // The cue from the line Karla is on. A nonce rather than a plain string so the
  // same cue twice running (Again, or two lines that both pulse) fires twice.
  const [cue, setCue] = React.useState({ name: null, nonce: 0 });
  const step = steps[at];
  const canNext = solved[at];
  const setSolvedAt = (i, v) => setSolved(s => (s[i] === v ? s : s.map((x, j) => (j === i ? v : x))));
  // Clear the cue when the step changes: a cue left over from the previous step
  // would fire into a layout it was never written for.
  React.useEffect(() => { setCue(c => ({ name: null, nonce: c.nonce })); }, [at]);

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
  /* The size the prompt actually renders at — band a gets 40 on desktop. ONE
     variable, because the spoken line is supposed to match it: two expressions
     drifted apart the moment the hero script arrived (34 against the h2's 40). */
  const headlineSize = Layout ? (mode === 'a' && !phone ? 40 : promptSize) : (phone ? 24 : 36);

  /* Say-it-show-it takes over the voice row wherever the bank has a script AND the
     manifest has clips for this step. Everywhere else the old VoiceRow stands, so
     an unauthored tranche degrades to exactly what shipped before.

     NOTE for anyone touching this: nothing below feeds `solved`, `canNext` or Next
     in any way. Audio never gates (docs/VOICE_PASS.md §2) and the spec asserts the
     gating logic is identical with clips present. */
  // Resolved from the step's own voiceRef, never from its on-screen position.
  const sayLines = step?.speakLines;
  const clips = step?.voiceRef && voice?.manifest
    ? clipsFor(voice.manifest, voice.skill, step.voiceRef.kind, step.voiceRef.index, voice.base)
    : null;
  // The same entries, unmapped: per-word timings will ride on them.
  const clipMeta = step?.voiceRef && voice?.manifest
    ? clipMetaFor(voice.manifest, voice.skill, step.voiceRef.kind, step.voiceRef.index)
    : null;
  const body = <div style={{ background: color.surface, borderRadius: radius.sheet, padding: phone ? 20 : 32 }}>
    {sayLines?.length
      ? <SayItShowIt lines={sayLines} clips={clips} meta={clipMeta} muted={muted} phone={phone}
          mode={mode} worldColor={worldColor || color.ink} blobDir={blobDir}
          voiceRate={voiceRate} onRate={onRate}
          speak={speak} fallbackText={step?.speak || step?.prompt}
          onCue={(name, i) => {
            setCue(c => ({ name, nonce: c.nonce + 1 }));
            onEvent('speak_line', { cue: name, index: i, step: at });
          }} />
      : mode !== 'c' && <VoiceRow mode={mode} text={step?.speak || step?.prompt} worldColor={worldColor || color.ink}
        quiet={quiet} onQuiet={setQuiet} speak={speak} blobDir={blobDir} phone={phone} />}
    {kicker && <Kicker style={{ marginBottom: 10 }}>{kicker}</Kicker>}
    {/* `prompt` and `takeaway` highlight what they name — the only two cues that
        point at screen furniture rather than at the math. Safe on a Try it: they
        draw the eye and change nothing. */}
    <h2 style={{ fontSize: headlineSize,
      fontWeight: 600, letterSpacing: '-.025em', lineHeight: 1.2, margin: '0 0 22px',
      background: cue.name === 'prompt' ? (color.goldTint || '#FBF3E4') : 'transparent',
      borderRadius: radius.sm, transition: 'background .3s',
      boxShadow: cue.name === 'prompt' ? '0 0 0 8px ' + (color.goldTint || '#FBF3E4') : 'none' }}>{step?.prompt}</h2>
    {/* Keyed by step identity, not left to React's reconciler: two walks in a row
        are the same component type, and an un-keyed layout keeps the previous
        step's reveal state — the next walk arrives pre-revealed and self-solved,
        or pre-revealed and UNSOLVABLE, since its reveal effect never re-fires.
        The key makes every step start un-revealed and earn its own solve. */}
    {Layout && <Layout key={step.id ?? at} step={step} solved={solved[at]} phone={phone} cue={cue}
      onSolve={(ok) => { setSolvedAt(at, ok); if (ok) onEvent('teach_solved', { index: at, layout: step.layout }); }} />}
    {Interactive && <Interactive key={step.id ?? at} {...(step.config || {})} onSolve={(ok) => setSolvedAt(at, ok)} />}
    {!Interactive && !Layout && step?.body && <div style={{ fontSize: 18, lineHeight: 1.55 }}>{step.body}</div>}
    {/* The takeaway band only opens once the step is actually solved. */}
    {canNext && step?.takeaway && <TakeawayBand note={step.takeaway} written={notes.includes(step.takeaway)}
      lit={cue.name === 'takeaway'} onWrite={writeNote} phone={phone} />}
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

/** A Snag with no honest distractors: the question, then the answer on request.
    Nothing is scored here either way — the Snag never pays and never penalises. */
export function SnagReveal({ sn, shown, onReveal, phone, sweep }) {
  return <div style={{ ...lBase, background: color.surface, borderRadius: radius.sheet, padding: phone ? 22 : 32 }}>
    {/* Through rich(), like every other question: this one rendered its string
        raw, so a fraction or an exponent in a Snag would have printed its tags. */}
    <h2 style={{ fontSize: phone ? 24 : 34, fontWeight: 600, letterSpacing: '-.025em', lineHeight: 1.25, margin: 0 }}>
      {rich(sn.q, sweep && sweep.word >= 0 ? sweep : undefined)}</h2>
    {shown
      ? <div style={{ marginTop: 22, background: color.greenTint, borderRadius: radius.dayCell, padding: phone ? '16px 18px' : '20px 24px' }}>
        <Kicker style={{ marginBottom: 6 }}>What it was</Kicker>
        <div style={{ fontSize: phone ? 26 : 34, fontWeight: 600, color: color.greenDeep }}>{sn.ans}</div>
      </div>
      : <>
        <p style={{ fontSize: 17, color: color.muted, lineHeight: 1.5, marginTop: 16 }}>
          Say it out loud or just think it. Then look — this one is not marked.</p>
        <Button variant="outline" style={{ marginTop: 18 }} onClick={onReveal}>Show me what it was</Button>
      </>}
  </div>;
}

/* Karla hosts every move (owner, Nov 2026).

   A kid used to arrive at four questions with nobody introducing them. One
   spoken line when a move opens says what this stretch is for — "Quick ones
   first", "Last stretch. No help on these" — so the shape of the lesson is
   audible, not just inferred from a label.

   Band policy is the one that already governs the voice: a is read to without
   asking, b has the companion to tap, c reads the line. And like everything
   else in the voice path, it cannot gate — it renders above the move and
   touches nothing the move depends on. */
function MoveHost({ intro, voice, mode = 'c', muted = false, worldColor, blobDir = '/blobs/', phone }) {
  const src = intro && voice?.manifest
    ? (clipsFor(voice.manifest, intro.voiceSkill, intro.kind, intro.index, voice.base) || [])[0]
    : null;
  const meta = intro && voice?.manifest
    ? (clipMetaFor(voice.manifest, intro.voiceSkill, intro.kind, intro.index) || [])[0]
    : null;
  const line = useSpokenLine({ src, text: intro?.say, meta, muted, rate: rateFor(mode, voice?.rate) });
  const { play, stop } = line;
  // The manifest arrives a moment after the first render, so auto-play waits for
  // it to SETTLE (null means not yet, an object means answered). Speaking before
  // then used the browser voice every time on a cold load, and then got cut off
  // by the clip when it turned up.
  const settled = !!voice?.manifest;
  React.useEffect(() => {
    const cancel = (intro && settled && mode === 'a' && !muted) ? whenVoiceQuiet(() => play()) : null;
    return () => { cancel?.(); stop(); };
  }, [intro?.say, settled, mode, muted]);   // eslint-disable-line react-hooks/exhaustive-deps
  if (!intro) return null;

  return <div data-move-host style={{ ...lBase, display: 'flex', alignItems: 'center', gap: 12,
    marginBottom: phone ? 14 : 18, flexWrap: 'wrap' }}>
    {mode !== 'c' && <button onClick={() => play()} aria-label="Hear it again" style={{ ...lBase, border: 'none',
      padding: 0, cursor: 'pointer', width: 44, height: 44, flex: 'none', borderRadius: radius.full,
      background: worldColor || color.ink, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
      <Blob name="Singing" size={34} dir={blobDir} /></button>}
    <div style={{ fontSize: phone ? 15 : 16.5, fontWeight: 600, lineHeight: 1.4, flex: 1, minWidth: 220 }}>
      {line.speaking && line.word >= 0
        ? <SweptLine plan={line.plan} word={line.word} />
        : <span style={{ color: line.speaking ? color.ink : color.muted }}>{intro.say}</span>}
    </div>
  </div>;
}

/* The Snag reads too (owner's play-test, Nov 2026).

   It was the one question surface still silent, and it is the FIRST beat of a
   new idea — the kid meets it before anything has been taught, which is the
   worst possible moment to leave her decoding alone.

   One reader for the whole beat: the scene, then the question, as one sentence.
   The held word crosses from the scene paragraph into the question's own
   heading, which is why `rich()` takes an offset and why Question accepts an
   external sweep instead of starting a second voice of its own.

   "No pay, just a look" means there is nothing here to protect: no answer to
   give away, no gate to open. The standard law still holds — nothing read
   aloud points at the answer, and nothing here touches what the Snag records. */
function SnagScreen({ sn, intro, pickable, snagTried, onAttempt, onReveal, phone, tokensLeft,
  voice, mode = 'c', blobDir = '/blobs/', muted = false, worldColor }) {
  /* Karla's intro, the scene and the question are ONE beat, read by one voice.

     They were three things a moment ago: the move host read the intro with its
     own face and its own clip while this screen read the scene with a second
     face — two companions on one surface and two utterances cancelling each
     other, which is the bug this whole order is about. The intro is folded in
     here instead, so there is one reader, one face, and the kid hears
     "Wait — look at this first", the scene, and the question in that order.

     The cost is that the Snag does not use the recorded move_snag clip; the
     whole beat is one line, and the voice cache will serve it as one clip the
     moment the Worker ships. */
  const introWords = React.useMemo(() => (intro?.say ? richWords(intro.say) : []), [intro?.say]);
  const sceneWords = React.useMemo(() => richWords(sn.scene), [sn.scene]);
  const leadWords = introWords.length + sceneWords.length;
  const words = React.useMemo(
    () => [...introWords, ...sceneWords, ...richWords(sn.q)], [introWords, sceneWords, sn.q]);
  const saying = React.useMemo(
    () => [intro?.say, sn.scene, sn.q].filter(Boolean).map(plainSpeech).join(' ').trim(),
    [intro?.say, sn.scene, sn.q]);
  const clipSrc = voice?.cacheUrl && saying.length <= 200
    ? `${voice.cacheUrl}?text=${encodeURIComponent(saying)}`
    : null;
  const line = useSpokenLine({ src: clipSrc, text: words, speech: saying, muted,
    rate: rateFor(mode, voice?.rate) });
  const { play, stop } = line;
  React.useEffect(() => {
    const cancel = (mode === 'a' && !muted) ? whenVoiceQuiet(() => play()) : null;
    return () => { cancel?.(); stop(); };
  }, [sn.q, mode, muted]);   // eslint-disable-line react-hooks/exhaustive-deps

  const live = line.speaking && line.word >= 0;
  /* The pale "not reached yet" grey belongs INSIDE the line being read, not
     across the whole screen. The beat is three blocks and thirty-odd words, so
     a single sweep spanning all of them left the question greyed for the ten
     seconds it took to read the intro and the scene — which is the "greyed out"
     a kid saw, just not stuck. A block that is not being read right now renders
     normally; only the one she is on carries the sweep. */
  const at = line.word;
  const on = (start, end) => (live && at >= start && at < end ? { word: at, offset: start } : undefined);
  const sweep = { word: on(leadWords, words.length) ? at : -1, offset: leadWords, onRead: () => play() };

  return <>
    {!!intro?.say && <div style={{ ...lBase, fontSize: phone ? 15 : 16.5, fontWeight: 600,
      lineHeight: 1.4, marginBottom: 12, color: color.muted }}>
      {rich(intro.say, on(0, introWords.length))}</div>}
    {mode !== 'c' && <div style={{ ...lBase, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <button onClick={() => play()} aria-label="Read it to me" style={{ ...lBase, border: 'none', padding: 0,
        cursor: 'pointer', width: 44, height: 44, flex: 'none', borderRadius: radius.full,
        background: worldColor || color.ink, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
        <Blob name="Singing" size={34} dir={blobDir} /></button>
      <span style={{ fontSize: 14, fontWeight: 600, color: color.muted }}>
        {line.speaking ? 'Reading it to you\u2026' : 'Tap me to hear it.'}</span>
    </div>}
    <div style={{ background: color.surface, borderRadius: radius.sheet, padding: phone ? 22 : 32, marginBottom: 18 }}>
      <Kicker style={{ marginBottom: 10 }}>The snag</Kicker>
      <p style={{ fontSize: phone ? 18 : 22, lineHeight: 1.45, margin: 0 }}>
        {rich(sn.scene, on(introWords.length, leadWords))}</p>
    </div>
    {pickable
      ? <Question
        snag
        question={{ text: sn.q, answers: sn.answers, correct: sn.answers.indexOf(String(sn.ans)) }}
        context="lesson" tokensLeft={tokensLeft} feedback={null}
        sweep={sweep} worldColor={worldColor} blobDir={blobDir} muted={muted} mode={mode}
        onAnswer={onAttempt}
        onHelp={() => {}} />
      : <SnagReveal sn={sn} shown={snagTried} phone={phone} sweep={sweep}
        onReveal={onReveal} />}
  </>;
}

/** The New idea / re-teach view: title, lede, three ruled step rows, last value green.

    This is the lowest moment in the lesson — she has just missed the prove-it — so
    it is the one teaching surface that most needs Karla's voice, and the last to get
    it (owner's call, Nov 2026). The plumbing is here; the scripts arrive with the
    tranche-3 bank patch. Until they do, `teach.speakLines` is undefined and this
    renders exactly as it did before — no voice row, no highlight, nothing new.

    Two differences from TeachSteps, both deliberate:

      - a `row.N` cue HIGHLIGHTS its row, it does not reveal it. The rows are a
        reference she is reading after a miss; hiding four of them to reveal them
        one at a time takes information away at the worst possible moment.
      - nothing here can be solved, so there is no `onSolve` for a cue to reach.
        `onContinue` is the only control and no cue, clip or audio state touches it:
        the button is enabled from first paint whether or not Karla is talking.
        AUDIO NEVER GATES (docs/VOICE_PASS.md §2), in both directions — it may not
        block her, and it may not advance her either. */
export function ReteachView({ teach, onContinue, label = 'Try one →', phone,
  voice, muted = false, onEvent }) {
  const [cue, setCue] = React.useState({ name: null, nonce: 0 });
  const lines = teach?.speakLines;
  const clips = teach?.voiceRef && voice?.manifest
    ? clipsFor(voice.manifest, voice.skill, teach.voiceRef.kind, teach.voiceRef.index, voice.base)
    : null;
  const clipMeta = teach?.voiceRef && voice?.manifest
    ? clipMetaFor(voice.manifest, voice.skill, teach.voiceRef.kind, teach.voiceRef.index)
    : null;
  // `row.3` means the third row, 1-based, as the bank's cue vocabulary has it.
  const litRow = /^row\.\d+$/.test(cue.name || '') ? Number(cue.name.slice(4)) - 1 : -1;
  const litTitle = cue.name === 'prompt';
  const held = color.goldTint || '#FBF3E4';

  return <div style={{ ...lBase, background: color.surface, borderRadius: radius.sheet, padding: phone ? 22 : 36 }}>
    <Kicker style={{ marginBottom: 10 }}>{teach.kicker || 'New idea'}</Kicker>
    <h2 data-reteach-title data-lit={litTitle ? 'yes' : 'no'}
      style={{ fontSize: phone ? 28 : 40, fontWeight: 600, letterSpacing: '-.025em', margin: '0 0 10px',
        background: litTitle ? held : 'transparent', borderRadius: radius.sm, transition: 'background .3s',
        boxShadow: litTitle ? `0 0 0 8px ${held}` : 'none' }}>{teach.title}</h2>
    {teach.lede && <p style={{ fontSize: 18, lineHeight: 1.5, color: color.muted, margin: '0 0 24px' }}>{teach.lede}</p>}
    {!!lines?.length && <SayItShowIt lines={lines} clips={clips} meta={clipMeta} muted={muted} phone={phone}
      speak={speak} fallbackText={teach.speak || teach.title}
      onCue={(name, i) => {
        setCue(c => ({ name, nonce: c.nonce + 1 }));
        onEvent?.('speak_line', { cue: name, index: i, where: 'reteach' });
      }} />}
    <div style={{ borderTop: `1px solid ${color.rule}` }}>
      {(teach.rows || []).map((r, i, all) => <div key={i} data-reteach-row={i + 1}
        data-lit={i === litRow ? 'yes' : 'no'} style={{ display: 'flex', alignItems: 'baseline', gap: 18,
          justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${color.rule}`,
          background: i === litRow ? held : 'transparent', transition: 'background .3s' }}>
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
  // An earning moment, so: the money counts up and a calm burst lands. No sound —
  // the one register in the product belongs to the books closing.
  const reduced = useReducedMotion();
  return <div style={{ ...lBase, position: 'relative', display: phone ? 'block' : 'grid', gridTemplateColumns: '340px 1fr', gap: 48, alignItems: 'start' }}>
    <Confetti run reduced={reduced} />
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
          <div style={{ ...numeral(56), color: color.greenDeep }}>
            <CountUp value={earned} from={0} format={(v) => `+$${v}`} reduced={reduced} /></div>
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
/** Which phase a move opens in. A function rather than only an effect, because
    advancing has to set `at` and `phase` in the SAME batch — see finishMove. */
const phaseFor = (m) => (m?.snag ? 'snag' : (m?.teach && !m.questions) ? 'teach' : 'run');

export function DailyLesson({ lesson, tier = 1, grade = 6, tokensPerRun = 3, rewardCents = 50,
  blobDir = '/blobs/', voiceManifest = null, voiceBase = '/voice/', voiceCacheUrl = null,
  voiceRate = null, onVoiceRate, muted = false,
  pricer = defaultPricer, onEvent = () => {}, onExit, onDone }) {
  const ref = React.useRef(null);
  const phone = useWidth(ref) < 860;
  // Opened at all. Paired with lesson_complete, this is the only way to see how
  // many lessons are started and not finished — it had no emitter.
  const announced = React.useRef(false);
  React.useEffect(() => {
    if (announced.current) return;
    announced.current = true;
    onEvent('lesson_start', { unit: lesson?.unit, title: lesson?.title });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
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
    setPhase(phaseFor(move));
    if (move?.snag) {
      setSnagTried(false);
      // Measured from day one (§8.8). Without it the rollup cannot tell whether
      // opening with the problem is what pulls her into the lesson — it had no
      // emitter at all, so that rate read as "no data" forever.
      onEvent('snag_shown', { move: move.id });
    }
  }, [at]);

  const questions = fresh && move?.fresh ? move.fresh : (move?.questions || []);
  const q = questions[qi];
  const teachFree = !!move?.teachFree;
  const resetUi = () => setUi({ feedback: null, picked: null, help: null, teachConfirm: false, payout: null, teachUsed: false, tokenUsed: false, tries: 0 });

  const finishMove = () => {
    onEvent('move_complete', { move: move.id });
    if (at + 1 < moves.length) {
      // Set the phase HERE, not only in the effect on [at]. The effect runs after
      // render, so advancing alone left one render with `at` on the next move while
      // `phase` was still the old one — and a teach phase pointing at a move with no
      // teach data threw, which unmounted the whole app. Clicking "Start the mission"
      // blanked the screen for every kid, every lesson with a New idea.
      setPhase(phaseFor(moves[at + 1]));
      setAt(at + 1); setQi(0); setFresh(false); resetUi();
      return;
    }
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

  const host = (intro) => <MoveHost intro={intro} voice={{ manifest: voiceManifest, base: voiceBase, rate: voiceRate }}
    mode={voiceMode(grade)} muted={muted} worldColor={lesson.world?.color} blobDir={blobDir} phone={phone} />;

  if (phase === 'snag') {
    const sn = move.snag;
    /* A Snag is authored as a scene, not a quiz, so it only gets buttons when the
       answer is a plain number and real near misses exist (B7). Otherwise it is a
       scene and a reveal: think about it, then look. Four choices where one is
       "The 8-pack (43¢ vs 45¢)" and the rest are bare integers is not a question —
       she wins it by shape and learns nothing. */
    const pickable = (sn.answers?.length || 0) > 1;
    return frame(<div>
      <SnagScreen sn={sn} intro={move.snagIntro} pickable={pickable} snagTried={snagTried} phone={phone} tokensLeft={tokensLeft}
        voice={{ cacheUrl: voiceCacheUrl, rate: voiceRate }} mode={voiceMode(grade)} blobDir={blobDir} muted={muted}
        worldColor={lesson.world?.color}
        onAttempt={() => { onEvent('snag_attempt', { move: move.id }); setSnagTried(true); }}
        onReveal={() => { onEvent('snag_attempt', { move: move.id, revealed: true }); setSnagTried(true); }} />
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
    grade={grade} worldColor={lesson.world?.color} blobDir={blobDir} muted={muted}
    voice={{ manifest: voiceManifest, base: voiceBase, skill: lesson.skill }}
    voiceRate={voiceRate} onRate={onVoiceRate}
    onDone={() => { onEvent('move_complete', { move: move.id }); setProgress(p => ({ ...p, [move.id]: { done: 1 } })); finishMove(); }} />);

  if (phase === 'reteach') return frame(<ReteachView teach={lesson.reteach} phone={phone} label="2 fresh ones →"
    muted={muted} onEvent={onEvent}
    voice={{ manifest: voiceManifest, base: voiceBase, skill: lesson.skill }}
    onContinue={() => { setFresh(true); setQi(0); resetUi(); setPhase('run'); }} />);

  if (!q) return frame(<div style={{ fontSize: 17, color: color.muted }}>Nothing to practise here.</div>);

  return frame(<>
    {host(move.intro)}
    <Question question={q} context="lesson" teachFree={teachFree} tokensLeft={tokensLeft}
    worldColor={lesson.world?.color} mode={voiceMode(grade)} blobDir={blobDir} muted={muted}
    voice={{ cacheUrl: voiceCacheUrl, rate: voiceRate }}
    feedback={ui.feedback} picked={ui.picked} payout={ui.payout} help={ui.help} teachConfirm={ui.teachConfirm}
    onAnswer={answer}
    onHelp={(next, { needsConfirm } = {}) => setUi(u => ({ ...u, help: next, teachConfirm: next === 'teach' && !!needsConfirm && !teachFree }))}
    onTeachConfirm={(use) => {
      if (!use) return setUi(u => ({ ...u, help: null, teachConfirm: false }));
      onEvent('teach_used', { token: tokensLeft > 0, move: move.id, free: teachFree });
      if (!teachFree && tokensLeft > 0) setTokensLeft(t => t - 1);
      setUi(u => ({ ...u, teachConfirm: false, teachUsed: true, tokenUsed: teachFree || tokensLeft > 0 }));
    }}
    onNext={onWrongNext} onEvent={onEvent} />
  </>);
}
