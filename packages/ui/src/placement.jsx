/* The placement check (§0a 13k, "Let Kampus find her level").

   Deliberately NOT built on AssessmentRunner. That component shows the whole
   paper with a question map, blanks and a hand-in — the right model for Inspection
   Day, and the wrong one here, because a placement check is adaptive: the next
   question depends on the last answer, so there is nothing to jump back to. A map
   she cannot use would be a lie about how the screen works.

   What the screen must never show, because the check must never become an exam:
   a score, a right/wrong mark, a running tally, a timer, or money. She answers,
   it moves on. The only output is a grade, and it reads as a start line.

   Zero-dependency as the package contract requires: the adaptive state machine is
   `packages/engine/src/placement.js` and the caller drives it. This renders one
   question and reports one answer. */
import { color, radius, font, numeral, WORLD_BY_TOPIC } from './tokens.js';
import { Button, Kicker, Blob } from './primitives.jsx';
import { Question } from './question.jsx';
import { useWidth } from './util.jsx';

const plBase = { fontFamily: font.family, boxSizing: 'border-box' };

/* The lowest grade the check can place her in — PLACEMENT_MIN_GRADE in the
   engine, repeated here because the package takes no engine dependency. A kid
   placed here has nothing below her, and the copy has to know that. */
const FLOOR_GRADE = 3;

/** What she is told before she starts. Every claim here is enforced in the engine. */
export function PlacementIntro({ name, minutes = 15, onStart, onExit, blobDir = '/blobs/' }) {
  const ref = React.useRef(null);
  const phone = useWidth(ref) < 860;
  return <div ref={ref} style={{ ...plBase, background: color.ground, minHeight: '100vh',
    display: 'flex', flexDirection: 'column', justifyContent: phone ? 'flex-start' : 'center',
    padding: phone ? '24px 16px 40px' : '40px 48px 48px' }}>
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {onExit && <button onClick={onExit} style={{ ...plBase, border: 'none', cursor: 'pointer',
        background: color.surface, borderRadius: radius.full, padding: '8px 16px',
        fontSize: 13, fontWeight: 700, marginBottom: 22 }}>Exit</button>}
      <div style={{ background: color.surface, borderRadius: radius.sheet, padding: phone ? 24 : 40 }}>
        <Blob name="Target" size={phone ? 100 : 130} dir={blobDir} />
        <Kicker style={{ margin: '16px 0 10px' }}>Finding your level</Kicker>
        <h1 style={{ fontSize: phone ? 30 : 44, fontWeight: 600, letterSpacing: '-.03em', lineHeight: 1.1, margin: 0 }}>
          Let’s see where you start{name ? `, ${name}` : ''}.</h1>
        <p style={{ fontSize: 18, lineHeight: 1.55, color: color.muted, marginTop: 14 }}>
          Some of these will be too easy and some will be too hard. That is the whole
          point — it is how Kampus works out where to begin. Answer what you can.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '24px 0 4px' }}>
          {[`About ${minutes} minutes`, 'No timer', 'Doesn’t pay', 'Doesn’t cost'].map(t =>
            <span key={t} style={{ ...plBase, background: color.fill, borderRadius: radius.full,
              padding: '9px 16px', fontSize: 14.5, fontWeight: 600 }}>{t}</span>)}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <Button variant="ink" onClick={onStart} style={phone ? { width: '100%', minHeight: 56 } : undefined}>
          Start →</Button>
      </div>
    </div>
  </div>;
}

/**
 * One question at a time.
 * @param {object} p
 * @param {object} p.question the engine's current probe, already built
 * @param {Array<{topic:string, status:'looking'|'found'|'next'}>} p.topics
 *   placementTopics(machine) — which world the check is searching now
 * @param {(choiceIndex:number) => void} p.onAnswer
 */
/* THE CHECK IS FOUR SHORT SEARCHES, AND THE BAR SAYS SO (§0e).

   What stood here was a single progress bar: one long stripe filling up, which
   is the shape of a test. The four worlds, each with its own state, say the true
   thing instead — two of these are already done, this one is being looked at
   now, two are waiting — and a kid who stalls on a question can see that the
   screen is not one unbroken climb.

   NO GLOBAL MENU. Placement runs during first-run setup and the only way out is
   Exit, so the nav is deliberately absent. And never a score, a mark, a tally, a
   timer or money, on this screen or the next: the ONLY output is a grade, and it
   reads as a start line.

   Placement is also the first maths a new kid ever meets here, sat before anyone
   knows what she can read, so Hope reads the question with the sweep exactly as
   she does everywhere else. */
const STATUS_LABEL = { looking: 'Looking now', found: 'Found ✓', next: 'Up next' };

function WorldCell({ w, status, phone }) {
  const found = status === 'found', looking = status === 'looking';
  return <div data-world-cell data-world={w.name} data-status={status}
    style={{ ...plBase, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <span style={{ width: 14, height: 14, flex: 'none', borderRadius: radius.full, background: w.color,
        opacity: status === 'next' ? 0.45 : 1,
        // The world being looked at wears an ink ring, held off the dot by white.
        boxShadow: looking ? `0 0 0 2px ${color.surface}, 0 0 0 4px ${color.ink}` : 'none' }} />
      <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-.01em', whiteSpace: 'nowrap',
        overflow: 'hidden', textOverflow: 'ellipsis',
        color: status === 'next' ? 'rgba(35,37,43,.5)' : color.ink }}>{w.name}</span>
    </div>
    <div style={{ fontSize: 12.5, fontWeight: 700,
      color: found ? color.greenDeep : status === 'next' ? 'rgba(35,37,43,.5)' : color.ink }}>
      {STATUS_LABEL[status]}</div>
    <span style={{ height: 6, borderRadius: radius.full, display: 'block',
      background: found ? color.green : looking ? color.ink : color.todo }} />
  </div>;
}

export function PlacementRunner({ question, topics = [], progress = { asked: 0, of: 24 }, onAnswer, onExit,
  voice, mode = 'c', blobDir = '/blobs/', muted = false, worldColor, onRate, onMuted }) {
  const ref = React.useRef(null);
  const w = useWidth(ref);
  const phone = w < 860;
  const cells = topics.map(t => ({ ...t, world: WORLD_BY_TOPIC[t.topic] || {} })).filter(c => c.world.name);
  const looking = cells.find(c => c.status === 'looking');

  const exitPill = (label) => <button onClick={onExit} style={{ ...plBase, border: 'none', cursor: 'pointer',
    background: color.fill, borderRadius: radius.full, padding: phone ? '9px 14px' : '10px 16px',
    fontSize: 13.5, fontWeight: 700, flex: 'none' }}>{label}</button>;
  const untimed = <span style={{ ...plBase, background: color.fill, borderRadius: radius.full,
    padding: phone ? '8px 13px' : '10px 16px', fontSize: 13, fontWeight: 700, flex: 'none' }}>Untimed</span>;

  const sheet = <Question question={question} context="quiz" feedback={null} onAnswer={(i) => onAnswer(i)}
    voice={voice} mode={mode} blobDir={blobDir} muted={muted} worldColor={looking?.world.color || worldColor}
    onRate={onRate} onMuted={onMuted} checkLabel="Next →"
    footer="Not sure? Pick the one you think is closest. Guessing costs nothing here." />;

  if (phone) {
    return <div ref={ref} style={{ ...plBase, background: color.ground, minHeight: '100vh',
      padding: '16px 16px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        {onExit && exitPill('\u2715')}
        <span style={{ flex: 1, fontSize: 15, fontWeight: 800 }}>Finding your level</span>
        {untimed}
      </div>
      {/* Four segments, one per world: the same four states, at phone size. */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {cells.map(c => <span key={c.topic} data-world-cell data-world={c.world.name} data-status={c.status}
          style={{ flex: 1, height: 5, borderRadius: radius.full,
          background: c.status === 'found' ? color.green : c.status === 'looking' ? color.ink : color.todo }} />)}
      </div>
      {looking && <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
        <span style={{ ...plBase, display: 'inline-flex', alignItems: 'center', gap: 7,
          background: color.surface, borderRadius: radius.full, padding: '7px 13px', fontSize: 13.5, fontWeight: 800 }}>
          <span style={{ width: 11, height: 11, borderRadius: radius.full, background: looking.world.color }} />
          {looking.world.name}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: color.muted }}>Looking now</span>
      </div>}
      {sheet}
    </div>;
  }

  return <div ref={ref} style={{ ...plBase, background: color.ground, minHeight: '100vh',
    padding: '40px 24px 56px' }}>
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      {/* The floating bar: Exit, the four worlds, Untimed. Nothing else — this
          screen has no nav by design. */}
      <div style={{ background: color.surface, borderRadius: radius.sheet, padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 20, marginBottom: 12 }}>
        {onExit && exitPill('\u2190 Exit')}
        <div style={{ flex: 1, display: 'flex', gap: 18, minWidth: 0 }}>
          {cells.map(c => <WorldCell key={c.topic} w={c.world} status={c.status} />)}
        </div>
        {untimed}
      </div>
      {sheet}
    </div>
  </div>;
}

/* WHERE SHE STARTS — A START LINE, NOT A SCORE (§0e 28a).

   The normal top bar comes back here: the check is over, she is in the product
   again. The grade is the biggest thing on the screen and it is on the GROUND,
   not in the sheet, because it is a fact about her year rather than a result the
   sheet is reporting. The sheet beside it does the one genuinely nice thing this
   screen can say: name the world she is already ahead in.

   Still no score, no mark, no tally, no money. "Grade 6" is where lessons begin. */
function tagFor(g, grade) {
  if (g > grade) return { label: 'Ahead', ink: true };
  if (g < grade) return { label: 'Starts earlier', ink: false };
  return null;
}

export function PlacementResult({ result, name, onStart, blobDir = '/blobs/' }) {
  const ref = React.useRef(null);
  const phone = useWidth(ref) < 860;
  const grade = result?.grade;
  const rows = Object.entries(result?.perTopic || {})
    .map(([topic, g]) => ({ topic, g, w: WORLD_BY_TOPIC[topic] || {} }))
    .filter(r => r.w.name);
  const ahead = rows.filter(r => r.g > grade).sort((a, b) => b.g - a.g)[0];
  /* Naming a world she is ahead in is the point of the headline — but when she
     placed level across all four there is no such world, and inventing one would
     be the first thing this screen says being untrue. */
  const headline = ahead
    ? `You\u2019re already ahead in ${ahead.w.name}.`
    : 'You start level across all four.';

  const numberBlock = <>
    <div style={{ fontSize: 18, fontWeight: 600, color: color.muted }}>You’re starting at</div>
    <div style={{ fontSize: phone ? 34 : 48, fontWeight: 600, letterSpacing: '-.03em', lineHeight: 1.1 }}>Grade</div>
    <div style={{ ...numeral(phone ? 120 : 200), lineHeight: 1 }}>{grade}</div>
    {!phone && <div style={{ fontSize: 15, fontWeight: 600, color: color.muted, maxWidth: 280, marginTop: 10 }}>
      That is where your lessons begin, not a mark.</div>}
  </>;

  const sheet = <div style={{ background: color.surface, borderRadius: radius.sheet, padding: 0, overflow: 'hidden' }}>
    <div style={{ padding: phone ? '22px 16px 6px' : '36px 40px 10px' }}>
      <Kicker style={{ marginBottom: 10 }}>Where each world starts you</Kicker>
      <h2 style={{ fontSize: phone ? 25 : 34, fontWeight: 600, letterSpacing: '-.025em',
        lineHeight: 1.18, margin: 0, textWrap: 'pretty' }}>{headline}</h2>
    </div>
    <div style={{ padding: phone ? '0 16px' : '0 40px' }}>
      {rows.map((r, i) => {
        const tag = tagFor(r.g, grade);
        return <div key={r.topic} style={{ display: 'flex', alignItems: 'center', gap: 14,
          padding: phone ? '14px 0' : '16px 0',
          borderTop: i === 0 ? 'none' : `1.5px solid ${color.rule}` }}>
          <span style={{ width: 34, height: 34, flex: 'none', borderRadius: radius.full, background: r.w.color }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: phone ? 16.5 : 18, fontWeight: 600 }}>{r.w.name}</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: color.muted }}>
              {r.w.area}{phone && tag ? ` \u00b7 ${tag.label}` : ''}</div>
          </div>
          {!phone && tag && <span style={{ ...plBase, flex: 'none', borderRadius: radius.full,
            padding: '7px 13px', fontSize: 13, fontWeight: 700,
            background: tag.ink ? color.ink : color.fill, color: tag.ink ? '#fff' : color.ink }}>{tag.label}</span>}
          <span style={{ fontSize: 13, fontWeight: 700, color: color.muted, flex: 'none' }}>Grade</span>
          <span style={{ ...numeral(phone ? 32 : 44), flex: 'none' }}>{r.g}</span>
        </div>;
      })}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      padding: phone ? '16px' : '20px 40px', borderTop: `1px solid ${color.rule}`, marginTop: phone ? 8 : 14 }}>
      {/* There is nothing below Grade 3 — Kampus starts there — and the version
          of this line that was here before the redraw knew that. Promising a
          grade-3 kid a review shelf she does not have is a small lie on the
          first screen she sees after the check. */}
      <span style={{ flex: 1, minWidth: 200, fontSize: 16, fontWeight: 600, color: color.muted }}>
        {grade > FLOOR_GRADE
          ? `Everything below Grade ${grade} is yours to review whenever you like.`
          : `Grade ${FLOOR_GRADE} is where Kampus begins, so nothing is behind you.`}</span>
      {!phone && <Button variant="ink" onClick={onStart}>
        {name ? `Let\u2019s go, ${name} \u2192` : 'Let\u2019s go \u2192'}</Button>}
    </div>
  </div>;

  return <div ref={ref} style={{ ...plBase, background: color.ground, minHeight: '100vh' }}>
    {/* The normal top bar returns: the check is over and she is in the product. */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: phone ? '16px' : '20px 48px',
      borderBottom: `1.5px solid ${color.navRule}` }}>
      <span style={{ flex: 1, fontSize: phone ? 18 : 21, fontWeight: 900, letterSpacing: '-.03em' }}>Kampus</span>
      <span style={{ width: 38, height: 38, borderRadius: radius.full, background: color.fill,
        display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 800 }}>
        {(name || 'K').slice(0, 1).toUpperCase()}</span>
    </div>

    {phone
      ? <div style={{ padding: '22px 16px 40px' }}>
        <div style={{ marginBottom: 18 }}>{numberBlock}</div>
        {sheet}
        <Button variant="ink" onClick={onStart} style={{ width: '100%', minHeight: 56, marginTop: 18 }}>
          {name ? `Let\u2019s go, ${name} \u2192` : 'Let\u2019s go \u2192'}</Button>
      </div>
      : <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 48, alignItems: 'start',
        padding: '44px 48px 56px' }}>
        <div style={{ paddingTop: 4 }}>{numberBlock}</div>
        {sheet}
      </div>}
  </div>;
}
