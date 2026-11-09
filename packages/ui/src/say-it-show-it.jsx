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
import { playLines, play as playOne, stop as stopAudio, useSpeaking, isSpeaking, progress } from './audio-bus.jsx';
import { useReducedMotion } from './juice.jsx';
import { speak as ttsSpeak, hushSpeech, speechActive } from './util.jsx';

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
  fallbackText, onCue, phone, mode = 'b', worldColor, blobDir = '/blobs/', voiceRate, onRate }) {
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
      {control('Slower', () => {
        setRate(SLOWER_RATE);
        onRate?.(SLOWER_RATE);     // remembered for this kid, on every surface
        run(SLOWER_RATE);
      })}
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
  try { globalThis.removeEventListener?.('pointerdown', invitation.run, true); } catch { /* gone */ }
  invitation = null;
}

function inviteFirstTap(owner, fn) {
  withdrawInvitation();
  const run = () => {
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

  const play = React.useCallback((playRate = rate, { auto = false } = {}) => {
    if (muted) return;
    // A read the kid asked for needs no invitation; she has just tapped.
    const invite = (how) => {
      if (!auto) return;
      if (how !== 'blocked' && !activationMissing()) return;
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
      const u = ttsSpeak(spoken, {
        rate: BASE_TTS_RATE * r,
        onBoundary: (charIndex) => {
          if (token.current !== mine2) return;
          setWord(wordAtFraction(plan, spoken.length ? charIndex / spoken.length : 0));
        },
        onEnd: () => { if (token.current === mine2) done(); },
      });
      if (!u) { done(); return; }           // no speech support: silent, not stuck

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
        if (settled >= 2) { clearInterval(watch); done(); }
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
