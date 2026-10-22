/* Onboarding (§0a): parent setup 13a–13r, student first run 14a–14h, doorways 15a–15f.

   Scope per ROUND3: no real auth. The magic link is a local mock — "check your email"
   then continue — because wiring Supabase is Phase 2 and a fake that pretends
   otherwise would be worse than an honest placeholder. Everything else is real: the
   PINs work, the profile is written through the student-keyed store, and the doorways
   actually route.

   The COPPA line ships verbatim and is not a candidate for rewording: "We keep her
   first name. That's it." */
import { color, radius, font, numeral, world, WORLD_BY_TOPIC } from './tokens.js';
import { Button, Kicker, Blob, Toggle } from './primitives.jsx';
import { useWidth } from './util.jsx';
import { PinPad } from './pin-pad.jsx';

const oBase = { fontFamily: font.family, boxSizing: 'border-box' };
const WORLDS = Object.values(world);

/** The §0a frame: kicker/title/sub on ground at left, one white sheet at right. */
export function SetupFrame({ kicker, title, sub, steps, step, children, note, cta, ctaLabel, ctaDisabled, onCta, phone }) {
  return <div style={{ ...oBase, background: color.ground, minHeight: '100vh', padding: phone ? '24px 16px 40px' : '40px 48px 48px' }}>
    <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid',
      gridTemplateColumns: phone ? '1fr' : '340px 1fr', gap: 48, alignItems: 'start' }}>
      <div>
        {/* Progress: a step list on desktop, segments on phone (§0a). */}
        {steps && (phone
          ? <div style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: 5, marginBottom: 16 }}>
            {steps.map((s, i) => <span key={s} style={{ height: 6, borderRadius: 3, background: i <= step ? color.ink : color.locked }} />)}
          </div>
          : <div style={{ marginBottom: 26 }}>
            {steps.map((s, i) => <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ width: 22, height: 22, borderRadius: radius.full, display: 'grid', placeItems: 'center',
                fontSize: 11, fontWeight: 800, color: '#fff',
                background: i < step ? color.green : 'transparent',
                boxShadow: i < step ? 'none' : `inset 0 0 0 ${i === step ? 2 : 1.5}px ${i === step ? color.ink : 'rgba(35,37,43,.22)'}` }}>
                {i < step ? '✓' : ''}</span>
              <span style={{ fontSize: 14.5, fontWeight: i === step ? 800 : 600, color: i === step ? color.ink : color.muted }}>{s}</span>
            </div>)}
          </div>)}
        {kicker && <Kicker style={{ marginBottom: 10 }}>{kicker}</Kicker>}
        <h1 style={{ fontSize: phone ? 28 : 40, fontWeight: 600, letterSpacing: '-.03em', lineHeight: 1.1, margin: 0 }}>{title}</h1>
        {sub && <p style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.5, color: color.muted, marginTop: 12 }}>{sub}</p>}
      </div>

      <div style={{ background: color.surface, borderRadius: radius.sheet, overflow: 'hidden' }}>
        <div style={{ padding: phone ? 20 : 40 }}>{children}</div>
        {cta !== false && (ctaLabel || note) && <div style={{ borderTop: `1px solid ${color.rule}`, padding: phone ? '16px 20px' : '20px 40px',
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ flex: 1, minWidth: 180, fontSize: 14, color: color.muted }}>{note}</span>
          {ctaLabel && <Button variant="ink" disabled={ctaDisabled} onClick={onCta}
            style={phone ? { width: '100%', minHeight: 56 } : undefined}>{ctaLabel}</Button>}
        </div>}
      </div>
    </div>
  </div>;
}

/** One big pill input — no borders, no label inside (§0a). */
function BigInput({ value, onChange, placeholder, size = 'email', phone }) {
  const [focus, setFocus] = React.useState(false);
  const tall = size === 'name' ? (phone ? 84 : 112) : (phone ? 72 : 96);
  const type = size === 'name' ? (phone ? 34 : 52) : (phone ? 24 : 36);
  return <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
    style={{ ...oBase, width: '100%', height: tall, borderRadius: radius.full, border: 'none', outline: 'none',
      background: color.fill, padding: `0 ${phone ? 24 : 34}px`, fontSize: type,
      fontWeight: size === 'name' ? 600 : 400, color: color.ink,
      boxShadow: focus ? `inset 0 0 0 2px ${color.ink}` : 'none' }} />;
}

const STEPS = ['Welcome', 'Your email', 'Her name', 'Her PIN', 'Where to start', 'Defaults', 'Hand it over'];

/**
 * Parent setup. Writes {settings, student profile} out through onDone — this component
 * never touches storage itself.
 */
export function ParentSetup({ onDone, onPickProfile, blobDir = '/blobs/' }) {
  const ref = React.useRef(null);
  const phone = useWidth(ref) < 860;
  const [step, setStep] = React.useState(0);
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [grade, setGrade] = React.useState(null);        // number | 'placement'
  const [settings, setSettings] = React.useState({ cap: 500, lessonLength: 17, allowBlitz: false, sprints: true, vacation: false });

  const frame = (props) => <div ref={ref}><SetupFrame steps={STEPS} step={step} phone={phone} {...props} /></div>;
  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }));

  if (step === 0) return frame({
    kicker: 'Kampus · the campus of life',
    title: 'Hey. This is Kampus.',
    sub: 'Earn real money for the effort you put in.',
    ctaLabel: 'Bet. Set it up →', onCta: () => setStep(1),
    note: '',
    children: <>
      <Blob name="Party" size={phone ? 110 : 150} dir={blobDir} />
      <h2 style={{ fontSize: phone ? 30 : 42, fontWeight: 600, letterSpacing: '-.03em', lineHeight: 1.1, margin: '20px 0 14px' }}>
        Maths that pays for showing up.</h2>
      <p style={{ fontSize: 18, lineHeight: 1.5, color: color.muted, margin: 0 }}>
        Not for being quick. No timers, no streaks to lose, nothing that dies while
        she is away. She does the work, she gets paid, you approve it.</p>
      <button onClick={onPickProfile} style={{ ...oBase, marginTop: 22, background: 'none', border: 'none',
        cursor: 'pointer', fontSize: 15, fontWeight: 600, color: color.muted, textDecoration: 'underline' }}>
        Already set up? Pick your profile</button>
    </>,
  });

  if (step === 1) return frame({
    kicker: 'Step one', title: 'What’s your email?',
    sub: 'Yours, not hers. It is how you get back in and how we send the weekly note.',
    ctaLabel: 'Send me the link →', ctaDisabled: !email.includes('@'), onCta: () => setStep(1.5),
    note: 'We never email your child.',
    children: <BigInput value={email} onChange={setEmail} placeholder="you@example.com" phone={phone} />,
  });

  if (step === 1.5) return frame({
    kicker: 'Step one', title: 'Check your email.',
    sub: `We sent a link to ${email}.`,
    ctaLabel: 'Continue →', onCta: () => setStep(2),
    // Honest about the mock rather than pretending a mail went out.
    note: 'Not wired up yet — this is a local setup, so just continue.',
    children: <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <Blob name="Emailing" size={120} dir={blobDir} />
      <p style={{ fontSize: 18, color: color.muted, marginTop: 18 }}>Open it on this device and you’ll land right back here.</p>
    </div>,
  });

  if (step === 2) return frame({
    kicker: 'Step two', title: 'What does she go by?',
    sub: 'First name only. She’ll see it when she opens the app.',
    ctaLabel: 'Next →', ctaDisabled: !name.trim(), onCta: () => setStep(3),
    note: 'We keep her first name. That’s it.',
    children: <>
      <BigInput value={name} onChange={setName} placeholder="Maya" size="name" phone={phone} />
      <p style={{ fontSize: 15, color: color.muted, marginTop: 16 }}>We keep her first name. That’s it.</p>
    </>,
  });

  if (step === 3) return frame({
    kicker: 'Step three', title: 'Give her a PIN.',
    sub: 'Four digits she can remember. It keeps her side and your side apart — it is not a password.',
    cta: false, note: '',
    children: <PinPad mode="set" phone={phone} onDone={(p) => { setPin(p); setStep(4); }} />,
  });

  if (step === 4) return frame({
    kicker: 'Step four', title: 'Where should she start?',
    sub: 'Pick a grade, or let Kampus find her level.',
    ctaLabel: 'Next →', ctaDisabled: grade === null, onCta: () => setStep(5),
    note: typeof grade === 'number' ? `Covers everything your state expects for grade ${grade}.` : '',
    children: <div style={{ display: 'grid', gridTemplateColumns: phone ? '1fr' : '1fr 1fr', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[3, 4, 5, 6, 7, 8].map(g => <button key={g} onClick={() => setGrade(g)}
          style={{ ...oBase, border: 'none', cursor: 'pointer', borderRadius: radius.lg, padding: '18px 10px',
            background: grade === g ? color.ink : color.fill, color: grade === g ? '#fff' : color.ink }}>
          <span style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '.16em', opacity: .7 }}>GRADE</span>
          <span style={{ ...numeral(44) }}>{g}</span>
        </button>)}
      </div>
      <button onClick={() => setGrade('placement')}
        style={{ ...oBase, border: 'none', cursor: 'pointer', borderRadius: radius.lg, padding: 22, textAlign: 'left',
          background: grade === 'placement' ? color.ink : color.fill, color: grade === 'placement' ? '#fff' : color.ink }}>
        <Blob name="Target" size={64} dir={blobDir} />
        <span style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '.16em', opacity: .7, marginTop: 10 }}>NOT SURE</span>
        <span style={{ display: 'block', fontSize: 26, fontWeight: 600, marginTop: 4 }}>Let Kampus find her level.</span>
        <span style={{ display: 'block', fontSize: 14.5, opacity: .75, marginTop: 8 }}>
          A 15-minute check, untimed. It doesn’t pay and it doesn’t cost.</span>
      </button>
    </div>,
  });

  if (step === 5) return frame({
    kicker: 'Step five', title: 'Set the defaults.',
    sub: 'All of these live in Grown-ups, so you can change them whenever.',
    ctaLabel: 'Next →', onCta: () => setStep(6),
    note: 'Paid for effort. Never for scores.',
    children: <>
      {[['Weekly limit', 'cap', [[300, '$3'], [500, '$5'], [800, '$8']]],
        ['Lesson length', 'lessonLength', [[12, '12 min'], [17, '17 min'], [22, '22 min']]]].map(([label, key, opts]) =>
        <div key={key} style={{ padding: '18px 0', borderBottom: `1px solid ${color.rule}` }}>
          <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>{label}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {opts.map(([v, l]) => <button key={v} onClick={() => set(key, v)}
              style={{ ...oBase, border: 'none', cursor: 'pointer', borderRadius: radius.full, padding: '10px 18px',
                fontSize: 14, fontWeight: 700, background: settings[key] === v ? color.ink : color.track,
                color: settings[key] === v ? '#fff' : color.ink }}>{l}</button>)}
          </div>
        </div>)}
      {[['Allow Blitz', 'allowBlitz', 'Opt-in speed rounds. Off means untimed everywhere.'],
        ['Fluency sprints', 'sprints', 'Short fact practice. No countdown either way.']].map(([label, key, sub]) =>
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '18px 0', borderBottom: `1px solid ${color.rule}` }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 13.5, color: color.muted, marginTop: 3 }}>{sub}</div>
          </div>
          <Toggle on={!!settings[key]} onChange={v => set(key, v)} />
        </div>)}
    </>,
  });

  const summary = [['Her name', name], ['PIN', '••••'],
    ['Starting at', typeof grade === 'number' ? `Grade ${grade}` : 'Placement check'],
    ['Weekly limit', `$${(settings.cap / 100).toFixed(2)}`],
    ['Lesson length', `${settings.lessonLength} min`]];

  return frame({
    kicker: 'All set', title: 'Hand it over.',
    sub: `${name}’s turn. She picks a world, then starts.`,
    ctaLabel: `Give it to ${name} →`,
    onCta: () => onDone?.({ name: name.trim(), pin, grade, settings }),
    note: 'You can change any of this in Grown-ups.',
    children: <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <span style={{ width: 72, height: 72, borderRadius: radius.full, background: color.locked,
          display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 700 }}>{name.charAt(0).toUpperCase()}</span>
        <span style={{ fontSize: 28, fontWeight: 600 }}>{name}</span>
      </div>
      <div style={{ borderTop: `1px solid ${color.rule}` }}>
        {summary.map(([k, v]) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16,
          padding: '14px 0', borderBottom: `1px solid ${color.rule}` }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{k}</span>
          <span style={{ fontSize: 20, fontWeight: 600 }}>{v}</span>
        </div>)}
      </div>
    </>,
  });
}

/** Student first run (14a–14h): hello, pick a world, then start. */
export function StudentFirstRun({ profile, onDone, blobDir = '/blobs/' }) {
  const ref = React.useRef(null);
  const phone = useWidth(ref) < 860;
  const [step, setStep] = React.useState(0);
  const [pick, setPick] = React.useState(null);
  const name = profile?.name || 'you';
  const placement = profile?.grade === 'placement';

  const frame = (props) => <div ref={ref}><SetupFrame steps={['Hello', 'Your world', 'Start']} step={step} phone={phone} {...props} /></div>;

  if (step === 0) return frame({
    kicker: 'Welcome', title: `Hey ${name}.`,
    sub: 'This is yours. Your stand, your money, your call.',
    ctaLabel: 'Let’s go →', onCta: () => setStep(1), note: '',
    children: <h2 style={{ fontSize: phone ? 56 : 104, fontWeight: 600, letterSpacing: '-.045em', lineHeight: 1, margin: 0 }}>
      Hey {name}.</h2>,
  });

  if (step === 1) return frame({
    kicker: 'Your world', title: 'Pick where you start.',
    sub: 'It only sets your colour. You get all four either way.',
    ctaLabel: 'Next →', ctaDisabled: !pick, onCta: () => setStep(2), note: '',
    children: <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
      {WORLDS.map(w => <button key={w.id} onClick={() => setPick(w.id)}
        style={{ ...oBase, border: 'none', cursor: 'pointer', background: 'none', padding: 0 }}>
        <span style={{ display: 'grid', placeItems: 'center', width: phone ? 104 : 140, height: phone ? 104 : 140,
          borderRadius: radius.full, background: w.color, color: color.ink, fontSize: phone ? 34 : 46, fontWeight: 700,
          boxShadow: pick === w.id ? `0 0 0 5px #fff, 0 0 0 8px ${color.ink}` : 'none' }}>
          {w.name.replace(/^The /, '').charAt(0)}</span>
        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, marginTop: 10 }}>{w.name}</span>
      </button>)}
    </div>,
  });

  return frame({
    kicker: 'Ready', title: placement ? 'Let’s find your level.' : 'You’re starting at',
    sub: placement ? 'About 15 minutes. No timer. It doesn’t pay and it doesn’t cost.' : '',
    cta: false, note: '',
    children: <div style={{ textAlign: 'center' }}>
      {!placement && <>
        <div style={{ fontSize: 18, color: color.muted }}>You’re starting at</div>
        <div style={{ fontSize: 48, fontWeight: 600, marginTop: 6 }}>Grade</div>
        <div style={{ ...numeral(phone ? 120 : 200) }}>{profile?.grade}</div>
      </>}
      {placement && <Blob name="Target" size={140} dir={blobDir} />}
      <button onClick={() => onDone?.({ worldId: pick })}
        style={{ ...oBase, marginTop: 24, width: 128, height: 128, borderRadius: radius.full, border: 'none',
          cursor: 'pointer', background: color.ink, color: '#fff', fontSize: 18, fontWeight: 700 }}>Start</button>
    </div>,
  });
}

/** Doorways (15a–15f): who is this, then the matching PIN. */
export function Doorway({ profiles = [], parentPin, onEnterStudent, onEnterParent, onSetup, blobDir = '/blobs/' }) {
  const ref = React.useRef(null);
  const phone = useWidth(ref) < 860;
  const [who, setWho] = React.useState(null);     // profile | 'parent'

  if (who && who !== 'parent') return <div ref={ref} style={{ ...oBase, background: color.ground, minHeight: '100vh',
    display: 'grid', placeItems: 'center', padding: 24 }}>
    <PinPad expect={who.pin} phone={phone}
      title={`Hi ${who.name}.`} sub="Type your PIN."
      onDone={() => onEnterStudent?.(who)} onCancel={() => setWho(null)} />
  </div>;

  if (who === 'parent') return <div ref={ref} style={{ ...oBase, background: color.ground, minHeight: '100vh',
    display: 'grid', placeItems: 'center', padding: 24 }}>
    <div style={{ textAlign: 'center' }}>
      <Kicker style={{ marginBottom: 12 }}>Grown-ups</Kicker>
      <PinPad mode={parentPin ? 'enter' : 'set'} expect={parentPin} phone={phone}
        title="Grown-ups only."
        sub={parentPin ? 'Type the PIN you set.' : 'Pick a PIN for your side. Not hers.'}
        onDone={(p) => onEnterParent?.(p)} onCancel={() => setWho(null)}
        footer={parentPin ? <span style={{ fontSize: 13.5, color: color.muted }}>Forgotten it? We can email a reset link.</span> : null} />
    </div>
  </div>;

  return <div ref={ref} style={{ ...oBase, background: color.ground, minHeight: '100vh', padding: phone ? '40px 16px' : '80px 48px' }}>
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Kicker style={{ marginBottom: 10 }}>Kampus</Kicker>
      <h1 style={{ fontSize: phone ? 30 : 40, fontWeight: 600, letterSpacing: '-.03em', margin: '0 0 30px' }}>Who’s this?</h1>
      <div style={{ display: 'grid', gridTemplateColumns: phone ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
        {profiles.map(p => <button key={p.id} onClick={() => setWho(p)}
          style={{ ...oBase, border: 'none', cursor: 'pointer', background: color.fill, borderRadius: radius.lg,
            padding: 26, display: 'flex', flexDirection: phone ? 'row' : 'column', alignItems: 'center', gap: 16 }}>
          <span style={{ width: phone ? 72 : 112, height: phone ? 72 : 112, borderRadius: radius.full, flex: 'none',
            background: WORLD_BY_TOPIC[p.worldTopic]?.color || world.fractions.color, color: color.ink,
            display: 'grid', placeItems: 'center', fontSize: phone ? 28 : 40, fontWeight: 700 }}>
            {p.name.charAt(0).toUpperCase()}</span>
          <span style={{ fontSize: 20, fontWeight: 600 }}>{p.name}</span>
        </button>)}
        <button onClick={() => setWho('parent')}
          style={{ ...oBase, border: 'none', cursor: 'pointer', background: color.fill, borderRadius: radius.lg,
            padding: 26, display: 'flex', flexDirection: phone ? 'row' : 'column', alignItems: 'center', gap: 16 }}>
          <span style={{ width: phone ? 72 : 112, height: phone ? 72 : 112, borderRadius: radius.full, flex: 'none',
            background: color.surface, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
            <Blob name="Coach" size={phone ? 56 : 84} dir={blobDir} /></span>
          <span style={{ fontSize: 20, fontWeight: 600 }}>Grown-ups</span>
        </button>
      </div>
      {onSetup && <button onClick={onSetup} style={{ ...oBase, marginTop: 26, background: 'none', border: 'none',
        cursor: 'pointer', fontSize: 15, fontWeight: 600, color: color.muted, textDecoration: 'underline' }}>
        Set up another kid</button>}
    </div>
  </div>;
}
