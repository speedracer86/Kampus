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
import { color, radius, font, type } from './tokens.js';
import { Blob } from './primitives.jsx';
import { playLines, play as playOne, stop as stopAudio, useSpeaking, isSpeaking, progress } from './audio-bus.jsx';
import { useReducedMotion } from './juice.jsx';
import { speak as ttsSpeak, hushSpeech, speechActive, vtrace } from './util.jsx';

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
export function useScript({ lines = [], clips, meta, speak, muted = false, autoplay = true,
  fallbackText, onCue, phone, mode = 'b', worldColor, blobDir = '/blobs/', voiceRate, onRate,
  onMuted } = {}) {
  const [at, setAt] = React.useState(-1);
  const [word, setWord] = React.useState(-1);
  // How much of the script she has already said. Kept apart from `at` because
  // when the sequence ends `at` goes back to -1, and the demo leaves everything
  // she has read in ink rather than resetting it to unread grey.
  const [through, setThrough] = React.useState(0);
  const [quiet, setQuiet] = React.useState(false);
  const [rate, setRate] = React.useState(() => rateFor(mode, voiceRate));
  // A pace chosen elsewhere (or on a previous day) applies here too.
  React.useEffect(() => { setRate(rateFor(mode, voiceRate)); }, [mode, voiceRate]);
  const speaking = useSpeaking();
  const reduced = useReducedMotion();
  const stopped = React.useRef(false);
  const token = React.useRef(0);

  const hasClips = Array.isArray(clips) && clips.length > 0;

  const run = React.useCallback(async (playbackRate = rate, { force = false } = {}) => {
    // `force`: see useSpokenLine's play. The tap that un-quiets also reads.
    if ((quiet || muted) && !force) return;
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

  /* THE VOICE BAR IS THE SHEET'S FIRST ROW (§0c), not a row inside the body.

     It is built here because this hook owns the voice state — quiet, the pace,
     whether she is speaking — and handed back for the SHEET to place, because a
     sheet puts the bar at its own top edge (padding 0, `overflow: hidden` so the
     radius still clips it) and the script down in its padded body.

     What this replaced: band a's companion row above the h2, band c's "Read it"
     help pill, and the Again / Slower / Quiet outline buttons under the script —
     three chromes at three different left edges inside one sheet. Again is gone
     as a button; the disc plays the line again, and carries an aria-label so a
     kid and a spec reach for the same handle. */
  const voiceBar = <VoiceBar mode={mode} phone={phone} worldColor={worldColor}
    blobDir={blobDir} speaking={speaking} muted={quiet || muted}
    slower={rate <= SLOWER_RATE}
    onPlay={() => {
      const wasQuiet = quiet || muted;
      if (wasQuiet) { setQuiet(false); onMuted?.(false); stopped.current = false; }
      run(undefined, { force: wasQuiet });
    }}
    onSlower={() => {
      setRate(SLOWER_RATE);
      onRate?.(SLOWER_RATE);     // remembered for this kid, on every surface
      run(SLOWER_RATE);
    }}
    onQuiet={(next) => {
      // Quiet stops playback. It does NOT stop the lesson: everything below
      // remains tappable, and Next is untouched either way.
      //
      // It is also not a per-sheet toggle. A kid who cannot bear the voice hits
      // Quiet once and means it everywhere, so it writes through to the sound
      // setting when the app gives it somewhere to write; the local flag is the
      // fallback for a surface rendered without one (the layouts gallery).
      setQuiet(next);
      onMuted?.(next);
      if (next) { stopped.current = true; stopAudio(); setAt(-1); }
    }}
    style={{ borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet }} />;

  /* THE SCRIPT IS THE HERO WHILE SHE SPEAKS.

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
        speaks" can be true of the script itself. */
  const script = !!lines.length && <p data-say-script style={{
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
    </p>;

  return { bar: voiceBar, script, speaking, quiet: quiet || muted, play: run };
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
/* The browser voice's own baseline. Hope's recorded clips and this are both
   scaled by the caller's rate, so a band's pace means the same thing whichever
   voice is speaking. */
const BASE_TTS_RATE = 0.95;

/**
 * How fast Hope reads, for a band.
 *
 * Owner's play-test, Nov 2026: she is too fast for the kid this is built for.
 * Fixed at PLAYBACK, not by regenerating a word of audio — it costs nothing and
 * can be retuned in an afternoon. Bands a and b, the kids being read to because
 * reading is the hard part, start slower than the ones who asked for it.
 *
 * A saved choice (settings.voiceRate) always wins: once a kid has pressed
 * Slower, that is her pace everywhere, on every surface, until she changes it.
 */
export const rateFor = (mode, saved) => (saved > 0 ? saved : (mode === 'c' ? 1 : 0.9));

/** What Slower drops to. One number, so every surface agrees what "slower" is. */
export const SLOWER_RATE = 0.75;

/* THE VOICE BAR (§0c, 2026-11-10).

   One row, the FIRST row inside the white sheet, on every surface that reads:
   the question, the Snag, the re-teach, the quiz paper, the placement runner.
   It replaces three different chromes that had grown up separately — band a's
   companion row above the h2, band c's "Read it" help pill, and the Again /
   Slower / Quiet outline buttons under the teach script. Those sat at three
   different left edges inside the same sheet, and when the voice arrived on the
   quiz the layout moved while she was reading it (owner's play-test, defect 2).

   The band is a TWEAK, not a layout: it changes the disc, the idle line and the
   prompt size. Nothing else about the bar moves between grades 3 and 8.

   `Again` is gone as a button. The disc is the play control, which is also why
   it carries an aria-label: it is the one handle a kid — or a spec — reaches for
   to hear the line once more.

   AUDIO NEVER GATES, in either direction. This component takes no progress
   state and returns none; it cannot reach `solved`, Check, Next or Continue, and
   none of them may wait on it.
*/
export function VoiceBar({
  mode = 'c', speaking = false, muted = false, slower = false, phone = false,
  worldColor, blobDir = '/blobs/', onPlay, onSlower, onQuiet, style,
}) {
  const disc = phone ? 44 : 48;
  const label = muted ? 'Quiet. Tap to hear it.'
    : speaking ? 'Hope is reading'
    : mode === 'a' ? 'Reads on its own. Tap to hear it again.'
      : mode === 'b' ? 'Tap to hear it.'
        : 'Read it to me';
  const pill = (text, on, onClick) => <button key={text} type="button" onClick={onClick}
    data-voice-pill={text.toLowerCase()} aria-pressed={on ? 'true' : 'false'} style={{ ...sBase, border: 'none', cursor: 'pointer',
      height: phone ? 44 : 36, padding: phone ? '0 16px' : '0 14px', borderRadius: radius.full,
      background: on ? color.ink : color.fill, color: on ? '#fff' : color.ink,
      fontSize: 13, fontWeight: 700, transition: 'background .18s ease, color .18s ease' }}>{text}</button>;

  /* `data-voice-band` and `data-voice-disc` are what a spec should read, not the
     state label: the label says "Hope is reading" whenever she is mid-sentence,
     so a check written against the idle copy passes or fails on timing. The band
     and the kind of disc are what §0c actually fixes per grade. */
  return <div data-voice-bar data-voice-band={mode}
    data-voice-disc={mode === 'c' ? 'glyph' : 'face'}
    data-voice-state={muted ? 'quiet' : speaking ? 'reading' : 'idle'}
    style={{ ...sBase, display: 'flex', alignItems: 'center',
    gap: phone ? 10 : 12, padding: phone ? '14px 16px' : '20px 40px',
    borderBottom: `1px solid ${color.rule}`, ...style }}>
    <button type="button" data-voice-play onClick={() => onPlay?.()} aria-label="Hear it again"
      style={{ ...sBase, border: 'none', padding: 0, cursor: 'pointer', flex: 'none',
        width: disc, height: disc, borderRadius: radius.full, overflow: 'hidden',
        display: 'grid', placeItems: 'center',
        background: mode === 'c' ? color.ink : (worldColor || color.ink),
        color: '#fff', fontSize: 13, fontWeight: 800 }}>
      {mode === 'c'
        ? (speaking ? '❚❚' : '▶')
        : <Blob name="Singing" size={phone ? 34 : 38} dir={blobDir} />}
    </button>
    <span style={{ ...type.label, padding: '0 6px 0 4px' }}>{label}</span>
    <span style={{ flex: 1 }} />
    {pill('Slower', slower, () => onSlower?.())}
    {pill('Quiet', muted, () => onQuiet?.(!muted))}
  </div>;
}

/**
 * Run `fn` once nobody is speaking — READERS TAKE TURNS.
 *
 * Two readers arrive on the same screen together: the move host introduces the
 * move while the question reads itself. Both used to call play() on mount, and
 * whoever went second cut the first off mid-word. Nothing stranded (the engine's
 * own flag is polled now), but a kid with auditory processing delays who loses
 * half a sentence has lost the sentence.
 *
 * IT IS A WAIT, NEVER A GATE. The cap exists so that a flag stuck high costs a
 * pause and not the read, and nothing in here touches `solved`, Next, an answer
 * button or any other progress state — the screen is fully usable throughout,
 * which the spec checks.
 *
 * @returns {() => void} cancel — callers MUST call it on cleanup, or a wait
 *   queued by a screen the kid has left will fire against the next one.
 */
/* Waiters are served ONE AT A TIME, in the order they arrived.

   Polling alone is not enough. Two readers mounting in the same commit both
   schedule their first poll for the same tick, and both see a quiet product —
   because neither has started yet. Whichever ran second then cut the first off
   mid-word, which is the defect this exists to stop.

   A queue fixes it properly: only the head is ever allowed to go, and the next
   is not considered until the one before it has had a moment to register as
   speaking. The order is the order the effects ran, so on a warm load the move
   host introduces the move and the question follows — the right pedagogy — and
   on a cold load, where the host is still waiting for the manifest, the
   question goes first. Wrong order, zero cut-offs, and that is the better
   trade for a kid who loses a whole sentence to half of one. */
const waiting = [];
let pumping = false;

function pump() {
  if (pumping) return;
  pumping = true;
  const step = () => {
    while (waiting.length && waiting[0].cancelled) waiting.shift();
    if (!waiting.length) { pumping = false; return; }
    const head = waiting[0];
    const quiet = !isSpeaking() && !speechActive();
    vtrace('queue head:', quiet ? 'clear' : 'waiting',
      'clip-speaking:', isSpeaking(), 'tts-active:', speechActive(),
      'waited:', Date.now() - head.started, 'behind:', waiting.length - 1);
    if (quiet || Date.now() - head.started >= head.cap) {
      waiting.shift();
      try { head.fn(); } catch { /* a reader must not break the queue */ }
      // A beat before the next is considered, so the voice just started has
      // registered and the one behind it does not talk over it.
      setTimeout(step, 60);
      return;
    }
    setTimeout(step, head.every);
  };
  step();
}

/**
 * Run `fn` once nobody is speaking — READERS TAKE TURNS.
 *
 * IT IS A WAIT, NEVER A GATE. The cap means a flag stuck high costs a pause and
 * not the read, and nothing in here touches `solved`, Next, an answer button or
 * any other progress state: the screen stays fully usable throughout, which the
 * spec checks.
 *
 * @returns {() => void} cancel — callers MUST call it on cleanup, or a wait
 *   queued by a screen the kid has left will fire against the next one.
 */
export function whenVoiceQuiet(fn, { cap = 10000, every = 150 } = {}) {
  const entry = { fn, cancelled: false, started: Date.now(), cap, every };
  vtrace('queued a read, depth', waiting.length + 1);
  waiting.push(entry);
  pump();
  return () => {
    entry.cancelled = true;
    const i = waiting.indexOf(entry);
    if (i >= 0) waiting.splice(i, 1);
  };
}


/* Who currently owns the voice.

   `stop()` used to hush globally: `speechSynthesis.cancel()` plus the shared
   utterance count forced to zero. So when ANY reader's effect tore down — the
   move host's does, the moment the clip manifest settles — it silenced whatever
   another component was in the middle of saying, and zeroed the count the queue
   uses to decide whether anyone is speaking. The host then fired into an
   apparently quiet product and cut the question off at 109ms. A reader may only
   stop the voice it started. */
let voiceOwner = null;

/* A BLOCKED READ IS AN INVITATION, NEVER A LIE.

   On a freshly loaded page Chrome refuses both `speechSynthesis.speak()` and
   `audio.play()` until the kid has touched something — `not-allowed`, with
   `navigator.userActivation.hasBeenActive === false`. The read cannot happen,
   and the honest thing is to say so: the label goes back to "Tap me to hear it"
   and nothing claims to be reading.

   But eating the failure leaves a kid who was promised a reader with silence
   and a disc she has to find. So the block is CONVERTED: one page-level
   listener re-fires the read on her first tap anywhere — the tap that grants
   the activation is the tap that starts the voice. One listener, the most
   recent pending read only, removed when it fires or when its screen goes. */
let invitation = null;

function withdrawInvitation(owner) {
  if (!invitation) return;
  if (owner && invitation.owner !== owner) return;
  vtrace('invitation withdrawn');
  try { globalThis.removeEventListener?.('pointerdown', invitation.run, true); } catch { /* gone */ }
  invitation = null;
}

function inviteFirstTap(owner, fn) {
  withdrawInvitation();
  const run = () => {
    vtrace('invitation FIRED by a tap');
    withdrawInvitation();
    // Back through the queue, so it still takes its turn.
    whenVoiceQuiet(fn);
  };
  invitation = { owner, run };
  try { globalThis.addEventListener?.('pointerdown', run, { once: true, capture: true }); } catch { /* no DOM */ }
}

/** Has the page had the gesture the browser wants before it will make sound? */
const activationMissing = () => {
  try { return globalThis.navigator?.userActivation?.hasBeenActive === false; } catch { return false; }
};

export function useSpokenLine({ src, text, meta, speech, muted = false, rate = 1 } = {}) {
  const mine = React.useRef({});
  const [word, setWord] = React.useState(-1);
  const [busy, setBusy] = React.useState(false);
  const token = React.useRef(0);
  const plan = React.useMemo(() => sweepPlan(text, meta), [text, meta]);

  const stop = React.useCallback(() => {
    token.current += 1;
    // A screen that is going away takes its pending invitation with it.
    withdrawInvitation(mine.current);
    // Only what this reader started. Another component's line is not ours to end.
    if (voiceOwner === mine.current) {
      stopAudio(); hushSpeech();
      voiceOwner = null;
    }
    setBusy(false); setWord(-1);
  }, []);

  /* `force` is for the one tap that turns Quiet off AND asks for the line in the
     same gesture. Without it that tap does nothing: `setQuiet(false)` does not
     change `muted` until the next render, so this guard — reading the value from
     the render the tap happened in — still refuses, and a bar that says "Quiet.
     Tap to hear it." brings nothing back. A read she asked for is never refused
     because of a setting she just turned off. */
  const play = React.useCallback((playRate = rate, { auto = false, force = false } = {}) => {
    if (muted && !force) return;
    // A read the kid asked for needs no invitation; she has just tapped.
    vtrace('play', auto ? '(auto)' : '(tap)', JSON.stringify(String(speech || text).slice(0, 24)),
      'clip:', !!src);
    const invite = (how) => {
      if (!auto) { vtrace('no invitation: she asked for this one'); return; }
      if (how !== 'blocked' && !activationMissing()) { vtrace('no invitation:', how, 'and the page is active'); return; }
      vtrace('invitation armed by', how);
      inviteFirstTap(mine.current, () => play(playRate, { auto: true }));
    };
    const turn = ++token.current;
    // An explicit play DOES take the voice — tapping Again while she is talking
    // should restart her — and taking it makes this reader the owner.
    stopAudio(); hushSpeech();
    voiceOwner = mine.current;
    setWord(-1); setBusy(true);
    const done = () => { if (token.current === turn) { setBusy(false); setWord(-1); } };

    if (src) {
      let raf = 0;
      const tick = () => {
        if (token.current !== turn) return;
        const p = progress();
        if (p) setWord(wordAt(plan, p.t, p.d));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      playOne(src, { rate: playRate }).then((how) => {
        cancelAnimationFrame(raf);
        if (how === 'blocked') {
          // The clip is refused for want of a tap; the browser voice would be
          // refused for the same reason. Settle honestly and invite.
          invite(how);
          done();
          return;
        }
        if (how === 'failed') {
          // The clip did not arrive — offline, or the cache has not been
          // deployed yet. Drop to the browser voice rather than going quiet.
          if (token.current === turn) speakIt(turn, playRate);
          return;
        }
        done();
      });
      return;
    }
    speakIt(turn, playRate);

    function speakIt(mine2, r) {
      const say = speech || text;
      const spoken = String(say);
      /* THE THIRD TIMING SOURCE: elapsed time.

         Chrome's network voices fire no `boundary` events whatsoever. On the
         owner's browser that meant a question read aloud with every word left
         in the not-yet-reached grey — the sweep simply did not exist, and every
         spec passed because the stub always fired boundaries.

         So when a voice has started but said nothing about where it is after
         half a second, the sweep is driven from the clock through the SAME
         proportional plan the clip path uses when it has no per-word times. It
         is the weakest of the three sources and the last to be used; a boundary
         arriving at any point takes over and the clock is dropped. */
      let gotBoundary = false;
      let clock = 0;
      const stopClock = () => { if (clock) { clearInterval(clock); clock = 0; } };
      const startClock = () => {
        if (clock || gotBoundary || token.current !== mine2) return;
        // ~13 characters a second is ordinary speech; the rate scales it.
        const estMs = Math.max(600, (spoken.length / 13) * 1000 / Math.max(0.3, BASE_TTS_RATE * r));
        const t0 = Date.now();
        vtrace('sweep: no boundaries, driving from the clock', `${Math.round(estMs)}ms`);
        clock = setInterval(() => {
          if (gotBoundary || token.current !== mine2) { stopClock(); return; }
          setWord(wordAtFraction(plan, Math.min(1, (Date.now() - t0) / estMs)));
        }, 60);
      };
      const boundaryWatch = setTimeout(startClock, 500);

      const u = ttsSpeak(spoken, {
        rate: BASE_TTS_RATE * r,
        /* THE FIRST WORD IS HELD THE MOMENT SHE STARTS.

           The clock does not take over for half a second — long enough for a
           boundary voice to report itself first — and for that half second a
           voice that reports nothing left the whole line in the not-yet-reached
           grey. A dead beat at the start of every read on exactly the voices
           the clock exists for. The word she is about to hear is word 0, and
           saying so costs nothing: a boundary arriving replaces it immediately,
           and the clock's first tick does too. */
        onStart: () => { if (token.current === mine2 && !gotBoundary) setWord(0); },
        onBoundary: (charIndex) => {
          if (token.current !== mine2) return;
          if (!gotBoundary) vtrace('sweep: boundaries are live');
          gotBoundary = true;
          stopClock();
          setWord(wordAtFraction(plan, spoken.length ? charIndex / spoken.length : 0));
        },
        onEnd: (how) => {
          clearTimeout(boundaryWatch);
          stopClock();
          if (token.current !== mine2) return;
          /* THE BROWSER VOICE ARMS THE INVITATION TOO. This said nothing at
             all, so only the clip path ever offered the kid a tap — and the
             surfaces that read through the browser voice (the Snag's folded
             line, any question without a cached clip) went silent on a blocked
             page with no way back. The reason is passed on, not a literal, so
             a browser that reports a plain failure before any gesture still
             gets the invitation. */
          if (how !== 'ended') { vtrace('tts failed:', how); invite(how); }
          done();
        },
      });
      if (!u) { clearTimeout(boundaryWatch); stopClock(); done(); return; }   // no speech support: silent, not stuck

      /* THE ENGINE'S OWN FLAG IS THE TRUTH, not our belief about it.
         `onend` does not always arrive — an utterance cancelled by another
         speaker, a voice that never starts, a tab that loses audio. When it
         does not, the hook stays "speaking" with the sweep parked on word one,
         and every word after it renders in the not-yet-reached grey. That is
         what a kid saw on beta: a question greyed out, apparently mid-read,
         forever. So the state is polled from speechSynthesis itself and
         released the moment it says it has stopped. */
      let settled = 0;
      const watch = setInterval(() => {
        if (token.current !== mine2) { clearInterval(watch); return; }
        let live = false;
        try { live = speechSynthesis.speaking || speechSynthesis.pending; } catch { live = false; }
        // Two consecutive reads, because the flag is briefly false between
        // queueing an utterance and the voice actually starting.
        settled = live ? 0 : settled + 1;
        if (settled >= 2) { clearInterval(watch); clearTimeout(boundaryWatch); stopClock(); done(); }
      }, 120);
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
