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
import { color, radius, font, numeral, world } from './tokens.js';
import { Button, Kicker, Blob } from './primitives.jsx';
import { Question } from './question.jsx';
import { useWidth } from './util.jsx';

const plBase = { fontFamily: font.family, boxSizing: 'border-box' };

/** What she is told before she starts. Every claim here is enforced in the engine. */
export function PlacementIntro({ name, minutes = 15, onStart, onExit, blobDir = '/blobs/' }) {
  const ref = React.useRef(null);
  const phone = useWidth(ref) < 860;
  return <div ref={ref} style={{ ...plBase, background: color.ground, minHeight: '100vh',
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
 * @param {{asked:number, of:number}} p.progress
 * @param {(choiceIndex:number) => void} p.onAnswer
 */
export function PlacementRunner({ question, progress = { asked: 0, of: 24 }, onAnswer, onExit }) {
  const ref = React.useRef(null);
  const phone = useWidth(ref) < 860;
  // Never shrink: a settled topic shortens the check, and a bar that went backwards
  // would read as losing ground.
  const [high, setHigh] = React.useState(0);
  const pct = Math.min(100, Math.round((progress.asked / Math.max(1, progress.of)) * 100));
  React.useEffect(() => { setHigh(h => Math.max(h, pct)); }, [pct]);

  return <div ref={ref} style={{ ...plBase, background: color.ground, minHeight: '100vh',
    padding: phone ? '18px 16px 40px' : '28px 48px 56px' }}>
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
        {onExit && <button onClick={onExit} style={{ ...plBase, border: 'none', cursor: 'pointer',
          background: color.surface, borderRadius: radius.full, padding: '8px 16px',
          fontSize: 13, fontWeight: 700 }}>Exit</button>}
        <Kicker style={{ flex: 1 }}>Finding your level</Kicker>
        {/* Says untimed in as many words, where a test would put a clock. */}
        <span style={{ ...plBase, background: color.surface, borderRadius: radius.full,
          padding: '7px 13px', fontSize: 13, fontWeight: 700 }}>Untimed</span>
      </div>

      <div style={{ height: 8, borderRadius: 4, background: color.track, overflow: 'hidden', marginBottom: 26 }}>
        <span style={{ display: 'block', height: '100%', width: `${high}%`, background: color.ink,
          borderRadius: 4, transition: 'width .3s ease' }} />
      </div>

      {/* 'quiz' context: "Read it" only. No hints and no Teach me — help here would
          tell us she can do work she cannot yet do on her own. */}
      <Question question={question} context="quiz" feedback={null} onAnswer={(i) => onAnswer(i)} />

      <p style={{ fontSize: 15, color: color.muted, marginTop: 20 }}>
        Not sure? Pick the one you think is closest. Guessing costs you nothing here.</p>
    </div>
  </div>;
}

/** Where she starts — a start line, not a score. */
export function PlacementResult({ result, name, onStart, blobDir = '/blobs/' }) {
  const ref = React.useRef(null);
  const phone = useWidth(ref) < 860;
  const WORLD_BY_TOPIC = Object.fromEntries(Object.values(world).map(w => [w.topic, w]));
  const rows = Object.entries(result?.perTopic || {});

  return <div ref={ref} style={{ ...plBase, background: color.ground, minHeight: '100vh',
    padding: phone ? '24px 16px 40px' : '40px 48px 48px' }}>
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: color.surface, borderRadius: radius.sheet, padding: phone ? 24 : 40, textAlign: 'center' }}>
        <Blob name="Winner" size={phone ? 100 : 130} dir={blobDir} />
        <Kicker style={{ margin: '16px 0 10px' }}>All done</Kicker>
        <div style={{ fontSize: 18, color: color.muted }}>You’re starting at</div>
        <div style={{ fontSize: phone ? 40 : 52, fontWeight: 600, letterSpacing: '-.03em' }}>Grade</div>
        <div style={{ ...numeral(phone ? 130 : 200), lineHeight: 1 }}>{result?.grade}</div>
        <p style={{ fontSize: 17.5, lineHeight: 1.55, color: color.muted, maxWidth: 520, margin: '18px auto 0' }}>
          That is where your lessons begin, not a mark. Anything you already know will
          go quickly{result?.grade > 3
            ? ', and everything below is yours to review whenever you like.'
            : ', and the rest is yours to take at your own pace.'}</p>
      </div>

      {/* Per world, because almost nobody is level across all four — and seeing a
          world she is ahead in is the one genuinely nice thing this screen can say. */}
      {!!rows.length && <div style={{ background: color.surface, borderRadius: radius.sheet,
        padding: phone ? 20 : 32, marginTop: 18 }}>
        <Kicker style={{ marginBottom: 14 }}>Where each world starts you</Kicker>
        {rows.map(([topic, g], i) => {
          const w = WORLD_BY_TOPIC[topic] || {};
          return <div key={topic} style={{ display: 'flex', alignItems: 'center', gap: 14,
            padding: '13px 0', borderBottom: i < rows.length - 1 ? `1px solid ${color.rule}` : 'none' }}>
            <span style={{ width: 34, height: 34, borderRadius: radius.full, flex: 'none', background: w.color }} />
            <span style={{ flex: 1, fontSize: 17, fontWeight: 600 }}>{w.name || topic}</span>
            <span style={{ ...numeral(28) }}>{g}</span>
          </div>;
        })}
      </div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <Button variant="ink" onClick={onStart} style={phone ? { width: '100%', minHeight: 56 } : undefined}>
          {name ? `Let’s go, ${name} →` : 'Let’s go →'}</Button>
      </div>
    </div>
  </div>;
}
