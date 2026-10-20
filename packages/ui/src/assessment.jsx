/* Unit quiz (§0 8a/8b) and grade test (§0 10a/10b).

   Both run the same shell: an intro of plain rule rows, then the questions with a
   map of every slot, then results. Nothing is marked right or wrong until the kid
   hands the paper in, and no result anywhere is a percentage or a letter grade —
   the vocabulary is Solid / Shaky / Not yet, and a missed test gives a repair plan.

   Presentational: grading happens in @kampus/engine and arrives as `result`. */
import { color, radius, font, numeral, dollars } from './tokens.js';
import { Button, Kicker, Chip } from './primitives.jsx';
import { useWidth } from './util.jsx';
import { Question } from './question.jsx';

const aBase = { fontFamily: font.family, boxSizing: 'border-box' };

const VERDICT_STYLE = {
  solid: { background: color.greenTint, color: color.greenDeep, label: 'Solid' },
  shaky: { background: color.held, color: color.goldDeep, label: 'Shaky' },
  notyet: { background: color.track, color: color.mutedDeep, label: 'Not yet' },
};

export function VerdictPill({ verdict, style }) {
  const v = VERDICT_STYLE[verdict] || VERDICT_STYLE.notyet;
  return <span style={{ ...aBase, background: v.background, color: v.color, borderRadius: radius.full,
    padding: '6px 13px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', ...style }}>{v.label}</span>;
}

/** A row of per-question dots. Only ever shown after the paper is handed in. */
function Dots({ dots = [], size = 14 }) {
  return <span style={{ display: 'inline-flex', gap: 6 }}>
    {dots.map((ok, i) => <i key={i} style={{ width: size, height: size, borderRadius: radius.full,
      background: ok ? color.green : color.red }} />)}</span>;
}

/** The shared intro: plain rule rows, no cards (§0). */
export function AssessmentIntro({ kind = 'quiz', grade, unit, intro, onStart, phone }) {
  const rows = [
    ['Questions', kind === 'quiz' ? '10' : '20'],
    ['Timer', 'None'],
    ['Help', 'Read it only'],
    ['Reward', dollars(kind === 'quiz' ? 100 : 150) + ' for taking it'],
    ['Retake', kind === 'quiz' ? 'Any time' : 'After a repair plan'],
  ];
  return <div style={{ ...aBase, display: phone ? 'block' : 'grid', gridTemplateColumns: '340px 1fr', gap: 48, alignItems: 'start' }}>
    <div>
      <Kicker style={{ marginBottom: 14 }}>{kind === 'quiz' ? `Unit ${unit} quiz` : `Grade ${grade} test`}</Kicker>
      <div style={{ borderTop: `1px solid ${color.rule}` }}>
        {rows.map(([k, v]) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16,
          padding: '13px 0', borderBottom: `1px solid ${color.rule}`, fontSize: 15 }}>
          <span style={{ fontWeight: 700 }}>{k}</span><span style={{ color: color.muted, fontWeight: 600 }}>{v}</span>
        </div>)}
      </div>
    </div>
    <div style={{ background: color.surface, borderRadius: radius.sheet, padding: phone ? 22 : 36, marginTop: phone ? 20 : 0 }}>
      <h2 style={{ fontSize: phone ? 28 : 40, fontWeight: 600, letterSpacing: '-.025em', margin: '0 0 12px' }}>
        {kind === 'quiz' ? 'Ready for the unit quiz?' : `Grade ${grade} test`}</h2>
      <p style={{ fontSize: 18, lineHeight: 1.5, color: color.muted, margin: '0 0 28px' }}>{intro}</p>
      <Button variant="ink" size="lg" onClick={onStart}>Start</Button>
    </div>
  </div>;
}

/** Every slot at a glance: answered cells fill ink, the current one takes a ring (§0). */
export function QuestionMap({ total, answers = [], at, onJump, phone }) {
  return <div style={{ ...aBase, display: 'grid',
    gridTemplateColumns: `repeat(${phone ? 10 : 5}, 1fr)`, gap: 8 }}>
    {Array.from({ length: total }, (_, i) => {
      const answered = answers[i] !== null && answers[i] !== undefined;
      const current = i === at;
      return <button key={i} onClick={() => onJump && onJump(i)} style={{ ...aBase, cursor: 'pointer',
        height: phone ? 36 : 46, borderRadius: radius.dayCell, fontSize: 14, fontWeight: 700,
        background: answered ? color.ink : color.fill, color: answered ? '#fff' : color.mutedDeep,
        border: current ? `2px solid ${color.ink}` : '2px solid transparent' }}>{i + 1}</button>;
    })}
  </div>;
}

/**
 * The runner. Holds only the answer sheet and position; grading is the engine's job.
 * questions: the engine's tagged questions. onHandIn(answers) when the paper goes in.
 */
export function AssessmentRunner({ kind = 'quiz', questions = [], onHandIn, onExit }) {
  const ref = React.useRef(null);
  const phone = useWidth(ref) < 900;
  const [answers, setAnswers] = React.useState(() => questions.map(() => null));
  const [at, setAt] = React.useState(0);
  const q = questions[at];
  const blanks = answers.reduce((n, a, i) => (a === null ? [...n, i] : n), []);
  const last = at === questions.length - 1;

  const pick = (i) => setAnswers(a => a.map((x, j) => (j === at ? i : x)));
  const advance = () => {
    if (!last) return setAt(at + 1);
    if (blanks.length) return setAt(blanks[0]);     // "Go to blank"
    onHandIn && onHandIn(answers);
  };

  return <div ref={ref} style={{ ...aBase, background: color.ground, minHeight: '100%', padding: phone ? '18px 16px 40px' : '28px 48px 56px' }}>
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        {onExit && <button onClick={onExit} style={{ ...aBase, border: 'none', cursor: 'pointer', background: color.surface,
          borderRadius: radius.full, padding: '8px 16px', fontSize: 13, fontWeight: 700 }}>Exit</button>}
        <span style={{ fontSize: 13, fontWeight: 700, color: color.muted }}>
          {kind === 'quiz' ? 'Unit quiz' : 'Grade test'} · {at + 1} of {questions.length}</span>
        <span style={{ flex: 1 }} />
        <span style={{ ...aBase, background: color.surface, borderRadius: radius.full, padding: '7px 13px', fontSize: 13, fontWeight: 700 }}>Untimed</span>
      </div>

      {!phone && <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 48, alignItems: 'start', marginBottom: 22 }}>
        <QuestionMap total={questions.length} answers={answers} at={at} onJump={setAt} />
        <span />
      </div>}

      {/* feedback stays null: nothing is right or wrong until it is handed in */}
      {q && <Question question={q} context={kind} selected={answers[at]} feedback={null}
        tokensLeft={0} onAnswer={pick} onHelp={() => {}} />}

      {phone && <div style={{ marginTop: 20 }}>
        <QuestionMap total={questions.length} answers={answers} at={at} onJump={setAt} phone /></div>}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 26, flexWrap: 'wrap' }}>
        <Button variant="outline" disabled={at === 0} onClick={() => setAt(Math.max(0, at - 1))}>Back</Button>
        <Button variant="ink" onClick={advance}>
          {!last ? 'Next' : blanks.length ? 'Go to blank' : 'Hand it in'}</Button>
      </div>
    </div>
  </div>;
}

/** Unit quiz results: a verdict per skill, a tally, and the effort pay. */
export function UnitQuizResults({ result, onDone, onPractice }) {
  const ref = React.useRef(null);
  const phone = useWidth(ref) < 900;
  const r = result || { perSkill: [], tally: {}, rewardCents: 100 };
  return <div ref={ref} style={{ ...aBase, background: color.ground, minHeight: '100%', padding: phone ? '20px 16px 40px' : '48px' }}>
    <div style={{ maxWidth: 1180, margin: '0 auto', display: phone ? 'block' : 'grid',
      gridTemplateColumns: '340px 1fr', gap: 48, alignItems: 'start' }}>
      <div>
        <Kicker style={{ marginBottom: 14 }}>How it went</Kicker>
        {['solid', 'shaky', 'notyet'].map(v => <div key={v} style={{ display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 16, padding: '13px 0', borderBottom: `1px solid ${color.rule}` }}>
          <VerdictPill verdict={v} />
          <span style={{ ...numeral(32) }}>{r.tally?.[v] || 0}</span>
        </div>)}
        <div style={{ marginTop: 22 }}>
          <div style={{ ...numeral(40), color: color.greenDeep }}>{dollars(r.rewardCents)}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: color.muted, marginTop: 4 }}>For taking it</div>
        </div>
      </div>
      <div style={{ background: color.surface, borderRadius: radius.sheet, overflow: 'hidden', marginTop: phone ? 20 : 0 }}>
        {r.perSkill.map((s, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          padding: phone ? '18px 20px' : '20px 32px', borderBottom: `1px solid ${color.rule}` }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 19, fontWeight: 700 }}>{s.skill}</div>
            <div style={{ fontSize: 14.5, color: color.muted, marginTop: 3 }}>{s.nextStep}</div>
          </div>
          <Dots dots={s.dots} />
          <VerdictPill verdict={s.verdict} />
        </div>)}
        <div style={{ display: 'flex', gap: 10, padding: phone ? '18px 20px' : '20px 32px', flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={onPractice}>Practise the shaky ones</Button>
          <Button variant="ink" onClick={onDone}>Back to Today</Button>
        </div>
      </div>
    </div>
  </div>;
}

/** Grade test results: two checks, then the district card or a repair plan. Never a fail. */
export function GradeTestResults({ grade, result, worlds = {}, onDone, onRepair }) {
  const ref = React.useRef(null);
  const phone = useWidth(ref) < 900;
  const r = result || { perCluster: [], checks: {}, repairPlan: [], rewardCents: 150 };

  const checkRow = (ok, label) => <div style={{ display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 0', borderBottom: `1px solid ${color.rule}` }}>
    <span style={{ width: 24, height: 24, borderRadius: radius.full, display: 'grid', placeItems: 'center',
      background: ok ? color.green : color.track, color: ok ? '#fff' : color.mutedDeep, fontSize: 13, fontWeight: 800 }}>
      {ok ? '✓' : '–'}</span>
    <span style={{ fontSize: 15, fontWeight: 600 }}>{label}</span>
  </div>;

  return <div ref={ref} style={{ ...aBase, background: color.ground, minHeight: '100%', padding: phone ? '20px 16px 40px' : '48px' }}>
    <div style={{ maxWidth: 1180, margin: '0 auto', display: phone ? 'block' : 'grid',
      gridTemplateColumns: '340px 1fr', gap: 48, alignItems: 'start' }}>
      <div>
        <Kicker style={{ marginBottom: 10 }}>The two checks</Kicker>
        <div style={{ borderTop: `1px solid ${color.rule}` }}>
          {checkRow(r.checks?.enoughRight, `${r.score} of ${r.asked} right · 16 needed`)}
          {checkRow(r.checks?.everyClusterHasOne, 'Every cluster has one right')}
        </div>
        <div style={{ marginTop: 22 }}>
          <div style={{ ...numeral(40), color: color.greenDeep }}>{dollars(r.rewardCents)}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: color.muted, marginTop: 4 }}>For taking it</div>
        </div>
      </div>

      <div style={{ marginTop: phone ? 20 : 0 }}>
        {r.passed
          ? <div style={{ background: color.ink, color: '#fff', borderRadius: 22, padding: phone ? 24 : 36 }}>
            <h2 style={{ fontSize: phone ? 26 : 36, fontWeight: 600, letterSpacing: '-.025em', margin: '0 0 20px' }}>
              The Grade {grade} district is built.</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {Object.values(worlds).map((w, i) => <span key={i} style={{ background: w.color, color: color.ink,
                borderRadius: radius.lg, padding: '16px 18px', fontSize: 14, fontWeight: 700, minWidth: 110 }}>{w.name}</span>)}
            </div>
          </div>
          : <div style={{ background: color.surface, borderRadius: radius.sheet, padding: phone ? 22 : 32 }}>
            <Kicker style={{ marginBottom: 14 }}>Repair plan · {r.repairPlan.length} units</Kicker>
            <div style={{ borderTop: `1px solid ${color.rule}` }}>
              {r.repairPlan.map(u => <div key={u.index} style={{ display: 'flex', alignItems: 'center', gap: 16,
                padding: '18px 0', borderBottom: `1px solid ${color.rule}`, flexWrap: 'wrap' }}>
                <span style={{ ...numeral(36), color: color.muted, minWidth: 48 }}>{u.index}</span>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{u.unit}</div>
                  <div style={{ fontSize: 14, color: color.muted, marginTop: 2 }}>{u.reason}</div>
                </div>
                <Chip dot={worlds[u.world]?.color} style={{ background: color.fill }}>{worlds[u.world]?.name || u.world}</Chip>
              </div>)}
            </div>
            <div style={{ marginTop: 22 }}><Button variant="ink" onClick={onRepair}>Start the first unit →</Button></div>
          </div>}

        {/* The 5x2 cluster grid: all right, one missed, both missed. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 22 }}>
          {r.perCluster.map(c => {
            const bg = c.right === 2 ? color.fill : c.right === 1 ? color.held : color.redTint;
            return <div key={c.id} title={c.label} style={{ background: bg, borderRadius: radius.dayCell,
              padding: '14px 12px', minHeight: 72 }}>
              <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>{c.label}</div>
              <div style={{ marginTop: 8 }}><Dots dots={c.dots} size={10} /></div>
            </div>;
          })}
        </div>

        <div style={{ marginTop: 22 }}><Button variant="outline" onClick={onDone}>Back to Today</Button></div>
      </div>
    </div>
  </div>;
}
