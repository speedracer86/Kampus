/* Home — STYLE_GUIDE §0 "Desktop Home layout" + the Brief v4 retrofit (3b desktop, 3a phone).

   Two columns on ground: left is a short greeting over the grade stack, right is a
   stat pair over the single white sheet. Progress counts units, never runs, and no
   percentage or letter grade appears anywhere.

   Stateless apart from the Today/Week switch; everything else arrives as data and
   leaves through onEvent. */
import { color, type, radius, shadow, font, numeral, money, signed, purpleFor, graduation, earlierGrades } from './tokens.js';
import { Kicker, Chip, PillLabel, Blob } from './primitives.jsx';
import { useWidth } from './util.jsx';

const hBase = { fontFamily: font.family, boxSizing: 'border-box' };
const MOVES = ['Warm-up', 'New idea', 'Guided', 'Mixed', 'Prove it'];

/**
 * The overlapping grade stack. Passed grades deepen along the purple ramp, the current
 * grade is ink with lime unit dots, locked grades are the flat locked fill. Opening a
 * passed grade grows its padding and pushes the cards below down (§0).
 */
export function GradeStack({ grades = [], earlier, onPick, phone }) {
  const [open, setOpen] = React.useState(null);
  const [foldOpen, setFoldOpen] = React.useState(false);
  const passedSoFar = (i) => grades.slice(0, i).filter(g => g.state === 'passed').length;

  /* The folded card for grades she placed past. It is NOT the purple ramp: those are
     Licenses she earned, and showing five of them for work she skipped would be a
     lie about her record (Task 3). */
  const earlierCard = earlier && <div style={{ ...hBase, background: earlierGrades, color: color.ink,
    borderRadius: `${radius.gradeCard}px ${radius.gradeCard}px 0 0`, padding: '20px', marginBottom: -14,
    position: 'relative', zIndex: grades.length + 1, boxShadow: shadow.stackTop, cursor: 'pointer' }}
    onClick={() => setFoldOpen(o => !o)}>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ ...numeral(phone ? 30 : 38) }}>{earlier.range}</span>
      <span style={{ fontSize: 12.5, fontWeight: 700, opacity: .7 }}>{foldOpen ? 'Hide' : 'Review anytime'}</span>
    </div>
    <div style={{ fontSize: 13.5, fontWeight: 600, opacity: .75, marginTop: 4 }}>Earlier grades</div>
    {foldOpen && <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {earlier.grades.map(g => <button key={g} onClick={(e) => { e.stopPropagation(); onPick && onPick({ grade: g, state: 'placed' }); }}
        style={{ ...hBase, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          background: 'rgba(255,255,255,.75)', border: 'none', borderRadius: radius.md, padding: '10px 14px',
          fontSize: 14.5, fontWeight: 700, cursor: 'pointer', color: color.ink }}>
        <span>Grade {g}</span><span style={{ fontSize: 12.5, fontWeight: 700, opacity: .7 }}>Review</span>
      </button>)}
    </div>}
  </div>;

  return <div style={{ ...hBase, position: 'relative' }}>
    {earlierCard}
    {grades.map((g, i) => {
      const { state } = g;
      const passed = state === 'passed', current = state === 'current';
      const graduated = state === 'graduation' && g.graduated;
      const locked = state === 'locked' || (state === 'graduation' && !g.graduated);
      const isOpen = open === g.grade && (passed || graduated);
      const last = i === grades.length - 1;
      const bg = graduated ? graduation
        : passed ? purpleFor(passedSoFar(i))
          : current ? color.ink
            : state === 'placed' ? earlierGrades : color.locked;
      const fg = locked ? color.disabledText : state === 'placed' ? color.ink : '#fff';
      return <div key={g.grade}
        onMouseEnter={() => (passed || graduated) && setOpen(g.grade)}
        onMouseLeave={() => (passed || graduated) && setOpen(null)}
        onClick={() => { if (passed || graduated) setOpen(o => (o === g.grade ? null : g.grade)); onPick && onPick(g); }}
        style={{
          ...hBase, background: bg, color: fg, cursor: locked ? 'default' : 'pointer',
          borderRadius: last ? radius.gradeCard : `${radius.gradeCard}px ${radius.gradeCard}px 0 0`,
          padding: isOpen ? '30px 20px 28px' : '22px 20px 20px',
          marginTop: i === 0 && !earlier ? 0 : -14,
          transition: `padding .25s cubic-bezier(.32,.72,.33,1)`,
          boxShadow: i === 0 && !earlier ? shadow.stackTop : `${shadow.stackTop}, ${shadow.stackEdge}`,
          position: 'relative', zIndex: grades.length - i,
        }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ ...numeral(phone ? 34 : 44), color: fg }}>{g.grade}</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, opacity: locked ? 1 : .72 }}>
            {graduated ? 'Graduated' : state === 'graduation' ? 'Graduation'
              : passed ? 'License earned' : current ? `Unit ${g.unit} of ${g.units}` : 'Locked'}</span>
        </div>
        {/* Locked cards say what earns them, rather than only that they are shut. */}
        {g.sub && !current && <div style={{ fontSize: 12.5, fontWeight: 600, opacity: .72, marginTop: 4 }}>{g.sub}</div>}
        {current && <div style={{ display: 'flex', gap: 5, marginTop: 12 }}>
          {Array.from({ length: g.units || 7 }, (_, u) => <span key={u} style={{ width: 9, height: 9, borderRadius: radius.full,
            background: u < (g.unit || 0) ? color.lime : 'rgba(255,255,255,.22)' }} />)}
        </div>}
        {isOpen && <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {g.test && <span style={{ ...hBase, background: 'rgba(255,255,255,.9)', color: color.ink, borderRadius: radius.full,
            padding: '6px 12px', fontSize: 12.5, fontWeight: 700 }}>Test {g.test}</span>}
          {typeof g.earned === 'number' && g.earned > 0 && <span style={{ ...hBase, background: color.ink, color: '#fff',
            borderRadius: radius.full, padding: '6px 12px', fontSize: 12.5, fontWeight: 700 }}>{signed(g.earned)}</span>}
        </div>}
      </div>;
    })}
  </div>;
}

/** Bank and the week, split by a hairline rule, with the Today/Week switch (§0). */
export function StatPair({ bank = 0, week = 0, view = 'today', onView, phone }) {
  const up = week >= 0;
  return <div style={{ ...hBase, display: 'flex', alignItems: 'flex-start', gap: phone ? 20 : 32, flexWrap: 'wrap' }}>
    <div style={{ flex: 'none' }}>
      <PillLabel style={{ marginBottom: 10 }}>Bank</PillLabel>
      <div style={{ ...numeral(44), color: color.ink }}>{money(bank)}</div>
    </div>
    <div style={{ width: 1.5, alignSelf: 'stretch', background: color.vRule, flex: 'none' }} />
    <div style={{ flex: 1, minWidth: 140 }}>
      <PillLabel style={{ marginBottom: 10 }}>Kredits this week</PillLabel>
      <div style={{ ...numeral(44), color: up ? color.greenDeep : color.loss }}>{signed(week)}</div>
    </div>
    {onView && <div style={{ display: 'flex', gap: 4, background: color.surface, borderRadius: radius.full, padding: 4, flex: 'none' }}>
      {['today', 'week'].map(v => <button key={v} onClick={() => onView(v)} style={{ ...hBase, border: 'none', cursor: 'pointer',
        borderRadius: radius.full, padding: '7px 14px', fontSize: 12.5, fontWeight: 700,
        background: view === v ? color.ink : 'transparent', color: view === v ? '#fff' : color.ink }}>
        {v === 'today' ? 'Today' : 'Week'}</button>)}
    </div>}
  </div>;
}

/** Today's lesson: the one row that stands out by scale, not fill (Brief v4). */
export function TodaysLesson({ lesson, onStart, phone }) {
  if (!lesson) return null;
  return <div style={{ ...hBase, padding: phone ? '22px 20px' : '30px 32px', borderBottom: `1px solid ${color.rule}` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
      <Kicker>{lesson.isAssessment ? (lesson.kind === 'test' ? 'Today’s test' : 'Today’s inspection') : 'Today’s lesson'}</Kicker>
      <Chip dot={lesson.world?.color} style={{ background: color.fill }}>{lesson.world?.name}</Chip>
      <span style={{ fontSize: 13, color: color.muted, fontWeight: 600 }}>~{lesson.mins || 20} min · no timer</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: phone ? 16 : 28, flexWrap: phone ? 'wrap' : 'nowrap' }}>
      <div style={{ flex: 1, minWidth: 180 }}>
        <h3 style={{ fontSize: phone ? 24 : 34, fontWeight: 600, letterSpacing: '-.025em', lineHeight: 1.15, margin: '0 0 16px' }}>
          {lesson.title}</h3>
        {/* An inspection or the grade test is not a five-move lesson — don't draw its spine. */}
        {lesson.isAssessment
          ? <div style={{ fontSize: 14, fontWeight: 600, color: color.muted }}>
            {lesson.kind === 'test' ? 'The year’s test. Pass it and the district gets built.' : 'The stand stays shut this morning.'}</div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {MOVES.map((m, i) => <div key={m}>
              <span style={{ display: 'block', height: 6, borderRadius: 3,
                background: i <= (lesson.moveIndex ?? 0) ? color.ink : color.locked }} />
              {!phone && <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: color.muted, marginTop: 6 }}>{m}</span>}
            </div>)}
          </div>}
      </div>
      <button onClick={onStart} style={{ ...hBase, flex: 'none', width: phone ? 64 : 96, height: phone ? 64 : 96,
        borderRadius: radius.full, background: color.ink, color: '#fff', border: 'none', cursor: 'pointer',
        fontSize: phone ? 13 : 15, fontWeight: 700 }}>Start</button>
    </div>
  </div>;
}

/** Free practice rows, each with an opt-in Blitz pill (never on by default). */
export function PracticeRow({ item, onPlay, onBlitz, phone }) {
  return <div style={{ ...hBase, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
    padding: phone ? '18px 20px' : '20px 32px', borderBottom: `1px solid ${color.rule}` }}>
    <div style={{ flex: 1, minWidth: 180 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
        <Chip dot={item.world?.color} style={{ background: color.fill }}>{item.world?.name}</Chip>
      </div>
      <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.02em' }}>{item.title}</div>
      <div style={{ fontSize: 13, color: color.muted, fontWeight: 600, marginTop: 4 }}>
        {item.questions} questions · ~{item.kredits} Kredits{item.blitz ? ' · ×1.5 under 8s' : ''}</div>
    </div>
    <button onClick={() => onBlitz && onBlitz(item)} style={{ ...hBase, border: 'none', cursor: 'pointer', flex: 'none',
      borderRadius: radius.full, padding: '9px 14px', fontSize: 12.5, fontWeight: 700,
      background: item.blitz ? color.ink : color.fill, color: item.blitz ? '#fff' : color.ink }}>
      {item.blitz ? '⚡ Blitz on' : 'Blitz'}</button>
    <button onClick={() => onPlay && onPlay(item)} aria-label={`Play ${item.title}`} style={{ ...hBase, flex: 'none',
      width: 52, height: 52, borderRadius: radius.full, background: color.ink, color: '#fff', border: 'none',
      cursor: 'pointer', fontSize: 16 }}>▶</button>
  </div>;
}

/** The lime band at the foot of the sheet. Gated until today's lesson is done. */
export function StandBand({ gated, onOpen, onStartLesson, stage, blobDir = '/blobs/', phone }) {
  return <div style={{ ...hBase, background: color.lime, padding: phone ? '18px 20px' : '20px 32px',
    display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
    {/* The growth loop, felt on every open: her stand as it currently stands. */}
    {stage && <span style={{ width: 48, height: 48, flex: 'none', display: 'grid', placeItems: 'center' }}>
      <Blob name={stage.blob} size={44} dir={blobDir} /></span>}
    <span style={{ flex: 1, minWidth: 180, fontSize: 16, fontWeight: 600, color: color.limeBody }}>
      {gated ? 'Class first, then the register opens.' : 'The stand is open for the day.'}
      {stage && <span style={{ display: 'block', fontSize: 13, fontWeight: 600, opacity: .75, marginTop: 2 }}>
        {stage.label} · {stage.index + 1} of {stage.total}</span>}</span>
    {gated
      ? <button onClick={onStartLesson} style={{ ...hBase, border: 'none', cursor: 'pointer', borderRadius: radius.full,
        padding: '11px 18px', fontSize: 13.5, fontWeight: 700, background: 'rgba(255,255,255,.55)', color: color.limeBody }}>
        Opens after the lesson</button>
      : <button onClick={onOpen} style={{ ...hBase, border: 'none', cursor: 'pointer', borderRadius: radius.full,
        padding: '11px 18px', fontSize: 13.5, fontWeight: 700, background: color.ink, color: '#fff' }}>
        Open the stand →</button>}
  </div>;
}

/**
 * data: {name, grades[], bank, weekKredits, lesson{world,title,moveIndex,mins},
 *        unit{unit, units, lessonsDone, lessonsTotal}, practice[], standGated, runs[]}
 */
export function HomeStack({ data, onEvent = () => {} }) {
  const ref = React.useRef(null);
  const w = useWidth(ref);
  const phone = w < 900;
  const [view, setView] = React.useState('today');
  // Blitz is opt-in per row and never on by default (§0 / the rules that never bend).
  const [blitz, setBlitz] = React.useState({});
  const d = data || {};

  // §0: numbers spelled out, ampersand, values in ink, the rest muted.
  const greeting = <>
    <span style={{ color: color.muted }}>Hi {d.name}, </span>
    <span style={{ color: color.ink }}>one lesson today</span>
    <span style={{ color: color.muted }}>, then the stand opens.</span>
  </>;

  const unitLine = d.unit && `unit ${d.unit.unit} of ${d.unit.units} · ${d.unit.lessonsDone} of ${d.unit.lessonsTotal} lessons · the License opens after unit ${d.unit.units}`;

  return <div ref={ref} style={{ ...hBase, background: color.ground, minHeight: '100%', padding: phone ? '20px 16px 40px' : '48px' }}>
    <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid',
      gridTemplateColumns: phone ? '1fr' : '340px 1fr', columnGap: 48, rowGap: phone ? 24 : 30, alignItems: 'start' }}>

      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: phone ? 0 : 96 }}>
        <h1 style={{ fontSize: phone ? 24 : 28, fontWeight: 600, letterSpacing: '-.025em', lineHeight: 1.32, margin: 0 }}>
          {greeting}</h1>
        {/* The care loop: what happened at her stand overnight. News, not a nudge,
            and never a streak — §4 bans the chain that can break. */}
        {(d.feed || []).length > 0 && <div style={{ marginTop: 10 }}>
          {d.feed.map(line => <div key={line.id} style={{ fontSize: 14, lineHeight: 1.45, color: color.muted }}>{line.text}</div>)}
        </div>}
      </div>

      <div style={{ minHeight: phone ? 0 : 96 }}>
        <StatPair bank={d.bank} week={d.weekKredits} view={view} onView={setView} phone={phone} />
      </div>

      <div>
        <GradeStack grades={d.grades || []} earlier={d.earlierGrades} phone={phone} onPick={(g) => onEvent('grade', g)} />
        {unitLine && <div style={{ fontSize: 12.5, fontWeight: 600, color: color.muted, marginTop: 14, lineHeight: 1.5 }}>{unitLine}</div>}
      </div>

      <div style={{ background: color.surface, borderRadius: radius.sheet, overflow: 'hidden', boxShadow: shadow.sheet }}>
        {view === 'today' ? <>
          <TodaysLesson lesson={d.lesson} phone={phone} onStart={() => onEvent('start_lesson', d.lesson)} />
          <div style={{ padding: phone ? '16px 20px 6px' : '18px 32px 6px' }}><Kicker>Free practice</Kicker></div>
          {(d.practice || []).map((p, i) => <PracticeRow key={i} item={{ ...p, blitz: !!blitz[p.id] }} phone={phone}
            onPlay={(it) => onEvent('practice', it)}
            onBlitz={(it) => setBlitz(b => ({ ...b, [it.id]: !b[it.id] }))} />)}
        </> : <WeekView runs={d.runs || []} phone={phone} onEvent={onEvent} />}
        <StandBand gated={d.standGated} phone={phone} stage={d.standStage} blobDir={d.blobDir}
          onOpen={() => onEvent('stand', {})} onStartLesson={() => onEvent('start_lesson', d.lesson)} />
      </div>
    </div>
  </div>;
}

/** Week view: a 7-column calendar of run cards; today is an ink "+ Next run" tile (§0). */
function WeekView({ runs, phone, onEvent }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return <div style={{ padding: phone ? '20px' : '24px 32px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${phone ? 4 : 7}, 1fr)`, gap: 8 }}>
      {days.map((dow, i) => {
        const run = runs.find(r => r.day === i);
        const today = runs.today === i || (!run && i === new Date().getDay() - 1);
        return <div key={dow}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: color.muted, marginBottom: 6 }}>{dow.toUpperCase()}</div>
          {today
            ? <button onClick={() => onEvent('start_lesson', {})} style={{ ...hBase, width: '100%', border: 'none', cursor: 'pointer',
              background: color.ink, color: '#fff', borderRadius: radius.dayCell, padding: '18px 10px', fontSize: 13, fontWeight: 700 }}>+ Next run</button>
            : <div style={{ background: color.fill, borderRadius: radius.dayCell, padding: '14px 10px', minHeight: 72 }}>
              {run ? <>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: radius.full, background: run.color, marginBottom: 8 }} />
                <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.3 }}>{run.world}</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: color.greenDeep, marginTop: 4 }}>{signed(run.kredits)}</div>
              </> : <span style={{ fontSize: 12.5, color: color.muted }}>—</span>}
            </div>}
        </div>;
      })}
    </div>
  </div>;
}
