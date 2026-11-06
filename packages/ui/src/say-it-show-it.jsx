/* Say it, show it (docs/VOICE_PASS.md §2).

   The accommodation is not audio instead of text. It is both channels locked
   together: while Karla speaks a line, that line's text is highlighted and exactly
   ONE visual act happens on the math. Nothing else moves, nothing else sounds.

   Two laws are structural here rather than remembered:

     - ducking is the audio bus's job, not this component's. It asks the bus to
       play and the bus refuses anything parallel.
     - AUDIO NEVER GATES. Nothing in this file touches `solved`, Next, or any
       other progress state. A kid can hit Quiet, never play a clip, and move
       through the lesson exactly as she could before clips existed. The spec
       checks that Next's enabled logic is byte-identical with audio present.

   Fallback: a step with no clips keeps today's behaviour — speechSynthesis on the
   step's `speak` text — so an unauthored tranche degrades to what shipped before.
*/
import { color, radius, font } from './tokens.js';
import { Button, Blob } from './primitives.jsx';
import { playLines, play as playOne, stop as stopAudio, useSpeaking, progress } from './audio-bus.jsx';
import { useReducedMotion } from './juice.jsx';
import { speak as ttsSpeak, hushSpeech } from './util.jsx';

const sBase = { fontFamily: font.family, boxSizing: 'border-box' };

/** Clip paths for a step, or null when the manifest does not cover it. */
export function clipsFor(manifest, skill, kind, stepIndex, base = '/voice/') {
  const step = manifest?.[skill]?.[kind]?.[stepIndex];
  if (!Array.isArray(step) || !step.length) return null;
  return step.map(l => `${base}${l.file}`);
}

/** The manifest's own entries for a step — where per-word timings will live. */
export function clipMetaFor(manifest, skill, kind, stepIndex) {
  const step = manifest?.[skill]?.[kind]?.[stepIndex];
  return Array.isArray(step) && step.length ? step : null;
}

/**
 * Where each word of a line starts, as a fraction of the clip.
 *
 * TWO TIMING SOURCES, ONE SHAPE. Today nothing in the manifest carries word
 * times, so the sweep spends the clip's duration in proportion to how long each
 * word takes to SAY — weight = letters + 1, because "a" and "equivalent" do not
 * take the same breath and a bare letter count gives a one-letter word a
 * zero-width slice. At this line length (one idea, under 120 characters) that is
 * close enough to feel locked to the voice.
 *
 * When the renewal generation run asks ElevenLabs for timestamps, the manifest
 * entry gains `words: [{ word, start, end }]` and this returns those instead —
 * exact, with no change anywhere else. A mismatched count is ignored rather than
 * trusted: a bank edit that changed the words but reused the old timings would
 * otherwise sweep the wrong words confidently.
 */
export function sweepPlan(say, meta) {
  // An ARRAY means the caller has already split the line the way it will be
  // RENDERED — the question screen does, because a fraction or an exponent is
  // one word on screen however many characters it is made of, and a sweep that
  // counted them differently would highlight the wrong thing.
  const words = Array.isArray(say) ? say.filter(w => String(w).trim()) : String(say ?? '').split(/\s+/).filter(Boolean);
  if (!words.length) return { words, starts: [], exact: false };
  const given = meta?.words;
  if (Array.isArray(given) && given.length === words.length
      && given.every(w => Number.isFinite(w?.start))) {
    return { words, starts: given.map(w => w.start), exact: true };
  }
  const weights = words.map(w => w.length + 1);
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  const starts = weights.map((w) => { const at = acc / total; acc += w; return at; });
  return { words, starts, exact: false };
}

/** Which word a fraction `f` (0..1) through the line falls on. */
export function wordAtFraction(plan, f) {
  if (!plan?.words.length || !(f >= 0)) return -1;
  let i = -1;
  for (let k = 0; k < plan.starts.length; k += 1) if (f >= plan.starts[k]) i = k;
  return i;
}

/** Which word is being said at time `t` of a clip lasting `d`. */
export function wordAt(plan, t, d) {
  if (!plan?.words.length) return -1;
  // Fractions need a duration to become seconds; exact timings are already in
  // seconds. Without a duration yet, nothing is swept rather than guessing.
  if (!plan.exact && !(d > 0)) return -1;
  const abs = plan.exact ? plan.starts : plan.starts.map(f => f * d);
  let i = -1;
  for (let k = 0; k < abs.length; k++) if (t >= abs[k]) i = k;
  return i;
}

/**
 * The spoken script under the prompt, with the line being said highlighted.
 *
 * @param {object} p
 * @param {Array<{say:string, cue:string}>} p.lines  the step's speakLines
 * @param {string[]|null} p.clips                    manifest paths, or null to fall back
 * @param {(cue:string, index:number) => void} p.onCue fires as each line starts
 */
export function SayItShowIt({ lines = [], clips, meta, speak, muted = false, autoplay = true,
  fallbackText, onCue, phone, mode = 'b', worldColor, blobDir = '/blobs/' }) {
  const [at, setAt] = React.useState(-1);
  const [word, setWord] = React.useState(-1);
  // How much of the script she has already said. Kept apart from `at` because
  // when the sequence ends `at` goes back to -1, and the demo leaves everything
  // she has read in ink rather than resetting it to unread grey.
  const [through, setThrough] = React.useState(0);
  const [quiet, setQuiet] = React.useState(false);
  const [rate, setRate] = React.useState(1);
  const speaking = useSpeaking();
  const reduced = useReducedMotion();
  const stopped = React.useRef(false);
  const token = React.useRef(0);

  const hasClips = Array.isArray(clips) && clips.length > 0;

  const run = React.useCallback(async (playbackRate = rate) => {
    if (quiet || muted) return;
    const mine = ++token.current;
    stopped.current = false;
    setThrough(0);
    if (hasClips) {
      await playLines(clips, {
        rate: playbackRate,
        onLine: (i) => {
          if (token.current !== mine) return;
          setAt(i);
          setThrough(i);
          setWord(-1);
          onCue?.(lines[i]?.cue, i);          // one visual act, as the line starts
        },
        shouldStop: () => stopped.current || token.current !== mine,
      });
      if (token.current === mine) { setAt(-1); setThrough(lines.length); }
      return;
    }
    // No clips for this step: speechSynthesis, exactly as before the voice pass.
    speak?.(fallbackText);
  }, [clips, hasClips, lines, muted, onCue, quiet, rate, speak, fallbackText]);

  // Auto-read on arriving at a step, then stop cleanly when leaving it.
  React.useEffect(() => {
    if (autoplay && !quiet && !muted) run();
    return () => { stopped.current = true; stopAudio(); };
  }, [clips?.[0], autoplay]);  // eslint-disable-line react-hooks/exhaustive-deps

  /* The sweep, driven off the clip's own clock.

     Reading `currentTime` each frame rather than running a timer is what makes
     `Slower` slow the sweep too: playbackRate changes how fast currentTime
     advances, so there is nothing to keep in agreement. It also means a stopped
     or finished clip simply stops the sweep.

     Under reduced motion there is no sweep at all — the whole line is held
     instead. A word-by-word crawl is exactly the kind of movement that setting
     is asking us not to make. */
  // Every line's words, not just the one being said: the whole script is on
  // screen, so every line needs its spans. The sweep only consults the current one.
  const plans = React.useMemo(() => lines.map((l, i) => sweepPlan(l?.say, meta?.[i])), [lines, meta]);
  const plan = at >= 0 ? plans[at] : null;
  React.useEffect(() => {
    if (!speaking || at < 0 || !plan || reduced) return undefined;
    let raf = 0;
    const tick = () => {
      const p = progress();
      if (p) setWord(wordAt(plan, p.t, p.d));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speaking, at, plan, reduced]);

  const control = (label, onClick, variant = 'outline') =>
    <Button key={label} variant={variant} size="sm" onClick={onClick}>{label}</Button>;

  /* Band a keeps her companion (§0a).

     This is not decoration. Grades 3-4 get a CHARACTER who reads to them, not a
     row of text with buttons — and when the clips landed for grades 3-5, this
     component replaced VoiceRow wholesale and quietly took the companion away
     from the youngest band: the exact kids the voice pass was built for. The
     teach spec caught it ("grades 3-4 get the reading companion, not the pill").
     So the companion is part of say-it-show-it for band a, with the real
     speaking state driving her face rather than VoiceRow's 1.2s guess. */
  const companion = mode === 'a' && <div style={{ display: 'flex', alignItems: 'center', gap: 16,
    marginBottom: 14, flexWrap: 'wrap' }}>
    <span style={{ width: 64, height: 64, flex: 'none', borderRadius: radius.full,
      background: worldColor || color.ink, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
      <Blob name="Singing" size={48} dir={blobDir} /></span>
    <div style={{ flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: color.muted }}>
        {quiet || muted ? 'Quiet for now.' : speaking ? 'Reading it to you…' : 'Ready when you are.'}</div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 18, marginTop: 6 }}>
        {[9, 15, 18, 13, 7].map((h, i) => <span key={i} style={{ width: 4, borderRadius: 2,
          height: speaking ? h : 4, background: color.ink, transition: 'height .18s ease' }} />)}
      </div>
    </div>
  </div>;

  return <div style={{ ...sBase, marginBottom: 18 }}>
    {companion}
    {/* THE SCRIPT IS THE HERO WHILE SHE SPEAKS.

        Built against the owner's demo (design-incoming/say-it-show-it-demo.html,
        Nov 4) after a first version diverged from it. The demo is one flowing
        paragraph at ONE size, and the only thing that changes is COLOUR: the
        words she has said are ink, the word she is on is held in gold, the words
        still to come are pale grey. The whole beat is on screen from the start.

        That last part is the accommodation, not a style choice. A kid with
        auditory processing delays who rushes reading can see where the sentence
        is going and where it has been; a stack that revealed lines one at a time,
        or resized them as they became current, would move the text under her
        while she was trying to read it. Colour carries the state and nothing
        reflows — which is also the only way "nothing else moves while she
        speaks" can be true of the script itself. */}
    {!!lines.length && <p data-say-script style={{
      fontSize: phone ? 20 : 26, fontWeight: 600, letterSpacing: '-.02em',
      lineHeight: 1.35, margin: '0 0 26px', color: color.inkAhead, textWrap: 'pretty',
    }}>
      {lines.map((l, i) => {
        const current = i === at;
        const done = at >= 0 ? i < at : i < through;
        const plan = plans[i];
        return <span key={i} data-say-line={i} data-current={current ? 'yes' : 'no'}
          data-say-state={current ? 'current' : done ? 'said' : 'ahead'}>
          {plan.words.map((w, k) => {
            // Within the line she is on, the sweep decides; everywhere else the
            // line's own state does. Reduced motion holds the whole line at once
            // rather than crawling a highlight across it.
            const state = current
              ? (reduced ? 'now' : k === word ? 'now' : k < word ? 'said' : 'ahead')
              : done ? 'said' : 'ahead';
            return <span key={k} data-say-word={k} data-word-state={state} style={{
              background: state === 'now' ? color.goldHold : 'transparent',
              color: state === 'ahead' ? color.inkAhead : color.ink,
              borderRadius: radius.sm, padding: '1px 4px', margin: '0 -1px',
              /* The demo fades over .25s because it highlights a PHRASE, held for
                 the better part of a second. A word is held for 150-250ms, so the
                 same fade never arrives — the spec caught the highlight peaking
                 at 45% opacity and moving on, a permanent ghost of itself. The
                 hold snaps; the ink/pale settle keeps the demo's easing. */
              transition: 'background .1s linear, color .25s ease',
            }}>{w}{k < plan.words.length - 1 ? ' ' : ''}</span>;
          })}
          {i < lines.length - 1 ? ' ' : ''}
        </span>;
      })}
    </p>}

    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {control('Again', () => run())}
      {control('Slower', () => { setRate(0.8); run(0.8); })}
      {control(quiet ? 'Unmute' : 'Quiet', () => {
        // Quiet stops playback. It does NOT stop the lesson: everything below
        // remains tappable, and Next is untouched either way.
        const next = !quiet;
        setQuiet(next);
        if (next) { stopped.current = true; stopAudio(); setAt(-1); }
      }, 'ghost')}
      {speaking && <span style={{ fontSize: 13, color: color.muted }}>Karla’s reading…</span>}
    </div>
  </div>;
}

/**
 * One line, spoken, with the word sweep following whatever timing it can get.
 *
 * THREE TIMING SOURCES, BEST FIRST:
 *   1. a recorded clip with per-word times in the manifest — exact;
 *   2. a recorded clip without them — the clip's own clock, split across the
 *      words in proportion to their length;
 *   3. the browser voice — its `boundary` events, which report the character
 *      the voice has reached. Not a timer: a real position in the sentence,
 *      which is as close as a synthesised voice can get.
 * And when none of them is available, nothing sweeps and nothing is said. That
 * is the bottom of the fallback chain, and it is silent rather than broken.
 *
 * NOTHING HERE TOUCHES PROGRESS. No caller passes it anything it could use to
 * answer, advance or gate; it returns a word index and a speaking flag.
 */
export function useSpokenLine({ src, text, meta, speech, muted = false, rate = 1 } = {}) {
  const [word, setWord] = React.useState(-1);
  const [busy, setBusy] = React.useState(false);
  const token = React.useRef(0);
  const plan = React.useMemo(() => sweepPlan(text, meta), [text, meta]);

  const stop = React.useCallback(() => {
    token.current += 1;
    stopAudio(); hushSpeech();
    setBusy(false); setWord(-1);
  }, []);

  const play = React.useCallback((playRate = rate) => {
    if (muted) return;
    const mine = ++token.current;
    stopAudio(); hushSpeech();
    setWord(-1); setBusy(true);
    const done = () => { if (token.current === mine) { setBusy(false); setWord(-1); } };

    if (src) {
      let raf = 0;
      const tick = () => {
        if (token.current !== mine) return;
        const p = progress();
        if (p) setWord(wordAt(plan, p.t, p.d));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      playOne(src, { rate: playRate }).then((how) => {
        cancelAnimationFrame(raf);
        if (how === 'failed') {
          // The clip did not arrive — offline, or the cache has not been
          // deployed yet. Drop to the browser voice rather than going quiet.
          if (token.current === mine) speakIt(mine, playRate);
          return;
        }
        done();
      });
      return;
    }
    speakIt(mine, playRate);

    function speakIt(mine2, r) {
      const say = speech || text;
      const spoken = String(say);
      const u = ttsSpeak(spoken, {
        rate: 0.95 * r,
        onBoundary: (charIndex) => {
          if (token.current !== mine2) return;
          setWord(wordAtFraction(plan, spoken.length ? charIndex / spoken.length : 0));
        },
        onEnd: () => { if (token.current === mine2) done(); },
      });
      if (!u) done();                      // no speech support: silent, not stuck
    }
  }, [src, text, speech, plan, muted, rate]);

  React.useEffect(() => stop, [stop]);
  return { word, speaking: busy, play, stop, plan };
}

/**
 * A line of words with the sweep's three states on them, in the demo's palette:
 * said in ink, the word being said held in gold, the rest pale.
 */
export function SweptLine({ plan, word, reduced = false, style }) {
  const words = plan?.words || [];
  return <span style={style}>
    {words.map((w, k) => {
      const state = reduced ? 'now' : k === word ? 'now' : k < word ? 'said' : 'ahead';
      return <span key={k} data-say-word={k} data-word-state={state} style={{
        background: state === 'now' ? color.goldHold : 'transparent',
        color: state === 'ahead' ? color.inkAhead : color.ink,
        borderRadius: radius.sm, padding: '1px 4px', margin: '0 -1px',
        transition: 'background .1s linear, color .25s ease',
      }}>{w}{k < words.length - 1 ? ' ' : ''}</span>;
    })}
  </span>;
}
