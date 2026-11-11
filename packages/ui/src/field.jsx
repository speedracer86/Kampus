/* The field mission — one a week, optional (§0f "Field and Shop", 44a/44b).

   A grown-up or the kid brings back two or three real numbers from the world,
   and ONE question is built from them. That is the whole feature, and the
   restraint is the point: the engine's menu asks for the fewest numbers that
   make the maths real, never more than three, because friction is this
   feature's enemy. A mission nobody can be bothered to start teaches nothing.

   Two steps, shown on the left so the end is in sight from the first screen —
   she can see that bringing back three numbers is most of it.

   The rules it inherits, all of them standing laws rather than decoration:

     - OPTIONAL, and said so on the screen: "A week without one is a normal
       week." No streak, no catch-up, no badge for doing it.
     - PAID FOR DOING IT, like a lesson, never for getting it right. The engine
       owns that (`FIELD_PAY_REASON`); this screen only says so.
     - UNTIMED, and the question reuses the locked lesson layout and the voice
       bar, so the one piece of maths at the end feels like every other.

   Zero-dependency as the package contract requires: the assignment, the
   question and the pay all arrive as props. Nothing here knows how a question
   is built, and nothing here decides what anything is worth. */
import { color, radius, font, numeral } from './tokens.js';
import { Button, Kicker } from './primitives.jsx';
import { useWidth } from './util.jsx';
import { Question } from './question.jsx';

const fBase = { fontFamily: font.family, boxSizing: 'border-box' };

/** The two steps, with the one she is on marked. Never a progress bar. */
function Steps({ at, phone }) {
  const rows = [
    ['Bring back three numbers', 0],
    ['Answer one question', 1],
  ];
  return <div style={{ ...fBase, display: 'flex', flexDirection: 'column',
    borderBottom: `1.5px solid ${color.navRule}` }}>
    {rows.map(([label, i]) => {
      const done = at > i, now = at === i;
      return <div key={label} data-field-step={i + 1} data-state={done ? 'done' : now ? 'now' : 'todo'}
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
          borderTop: `1.5px solid ${color.navRule}` }}>
        <span style={{ width: 28, height: 28, flex: 'none', borderRadius: radius.full,
          display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800,
          background: done ? color.green : now ? color.ink : color.surface,
          color: done || now ? '#fff' : 'rgba(35,37,43,.5)' }}>{done ? '✓' : i + 1}</span>
        <span style={{ fontSize: 15, fontWeight: 700,
          color: done || now ? color.ink : 'rgba(35,37,43,.5)' }}>{label}</span>
      </div>;
    })}
  </div>;
}

export function FieldMission({
  assignment, values = {}, question = null, pay,
  onChange = () => {}, onMake = () => {}, onAnswer = () => {}, onSkip, onExit,
  voice, mode = 'c', muted = false, onRate, onMuted, blobDir = '/blobs/',
}) {
  const ref = React.useRef(null);
  const phone = useWidth(ref) < 860;
  const at = question ? 1 : 0;
  if (!assignment) return null;

  const ready = assignment.inputs.every(i => {
    const v = values[i.key];
    return v !== undefined && v !== '' && !Number.isNaN(Number(v));
  });

  const left = <div style={{ ...fBase, display: 'flex', flexDirection: 'column', gap: 28 }}>
    <div>
      <Kicker>This week · optional</Kicker>
      <div style={{ fontSize: phone ? 24 : 28, fontWeight: 600, letterSpacing: '-.025em',
        lineHeight: 1.2, marginTop: 4 }}>Real-world mission</div>
    </div>
    <Steps at={at} phone={phone} />
    {at === 0
      ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Said on the screen, not just true in the engine: it pays for DOING
            it, and skipping a week costs nothing at all. */}
        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.45, color: color.mutedDeep }}>
          Pays the same as a lesson, for doing it. A week without one is a normal week.</div>
        {onSkip && <button onClick={onSkip} style={{ ...fBase, alignSelf: 'flex-start', border: 'none',
          cursor: 'pointer', background: color.surface, borderRadius: radius.full,
          padding: '9px 16px', fontSize: 13.5, fontWeight: 700 }}>Skip this week</button>}
      </div>
      : <div>
        {/* Her numbers stay on screen while she answers: she brought them back,
            and having to remember them would be a second task. */}
        <Kicker style={{ marginBottom: 10 }}>Your numbers</Kicker>
        <div style={{ borderBottom: `1.5px solid ${color.navRule}` }}>
          {assignment.inputs.map(i => <div key={i.key} data-field-number={i.key}
            style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '14px 0',
              borderTop: `1.5px solid ${color.navRule}` }}>
            <span style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>{i.label}</span>
            <span style={{ ...numeral(phone ? 30 : 40) }}>{String(values[i.key] ?? '')}</span>
          </div>)}
        </div>
      </div>}
  </div>;

  const sheet = at === 0
    ? <div style={{ background: color.surface, borderRadius: radius.sheet, padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: phone ? '20px 16px' : '40px 40px 28px' }}>
        <Kicker style={{ marginBottom: 10 }}>{assignment.title}</Kicker>
        <div style={{ fontSize: phone ? 24 : 40, fontWeight: 600, letterSpacing: '-.025em',
          lineHeight: 1.18, textWrap: 'pretty', maxWidth: 680 }}>{assignment.ask}</div>

        <div style={{ borderBottom: `1.5px solid ${color.rule}`, marginTop: phone ? 18 : 26 }}>
          {assignment.inputs.map(i => <div key={i.key} style={{ display: 'grid',
            gridTemplateColumns: phone ? '1fr 120px' : 'minmax(0,1fr) 220px', alignItems: 'center',
            gap: 20, padding: '14px 0', borderTop: `1.5px solid ${color.rule}` }}>
            <label htmlFor={`field-${i.key}`} style={{ fontSize: phone ? 16 : 19, fontWeight: 600 }}>{i.label}</label>
            <input id={`field-${i.key}`} data-field-input={i.key}
              inputMode="decimal" value={values[i.key] ?? ''}
              onChange={(e) => onChange(i.key, e.target.value)}
              style={{ ...fBase, ...numeral(phone ? 28 : 40), height: phone ? 56 : 72,
                padding: '0 22px', borderRadius: radius.lg, border: 'none',
                background: color.fill, color: color.ink, width: '100%' }} />
          </div>)}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        padding: phone ? '16px' : '20px 40px', borderTop: `1px solid ${color.rule}` }}>
        <span style={{ flex: 1, minWidth: 180, fontSize: 16, fontWeight: 600, color: color.muted }}>
          A grown-up can type these in.</span>
        {/* Disabled until the numbers are there, because a question cannot be
            built from a blank — and that is a statement about the DATA, not a
            judgement about her, so nothing scolds. */}
        <Button variant="ink" disabled={!ready} onClick={onMake}>Make my question →</Button>
      </div>
    </div>
    : <Question question={question} context="quiz" feedback={null}
      voice={voice} mode={mode} muted={muted} onRate={onRate} onMuted={onMuted} blobDir={blobDir}
      onAnswer={onAnswer} onHelp={() => {}}
      footer="Pick one. No timer." />;

  return <div ref={ref} style={{ ...fBase, background: color.ground, minHeight: '100%',
    padding: phone ? '20px 16px 40px' : '36px 48px 48px' }}>
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      {phone
        ? <>{left}<div style={{ marginTop: 22 }}>{sheet}</div></>
        : <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 48, alignItems: 'start' }}>
          {left}{sheet}
        </div>}
    </div>
  </div>;
}
