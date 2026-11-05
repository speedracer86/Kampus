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
import { playLines, stop as stopAudio, useSpeaking, progress } from './audio-bus.jsx';
import { useReducedMotion } from './juice.jsx';

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
  const words = String(say ?? '').split(/\s+/).filter(Boolean);
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
  fallbackText, onCue, phone, mode = 'b', worldColor, blobDir = '/blobs/', promptSize }) {
  const [at, setAt] = React.useState(-1);
  const [word, setWord] = React.useState(-1);
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
    if (hasClips) {
      await playLines(clips, {
        rate: playbackRate,
        onLine: (i) => {
          if (token.current !== mine) return;
          setAt(i);
          setWord(-1);
          onCue?.(lines[i]?.cue, i);          // one visual act, as the line starts
        },
        shouldStop: () => stopped.current || token.current !== mine,
      });
      if (token.current === mine) setAt(-1);
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
  const plan = React.useMemo(
    () => (at >= 0 ? sweepPlan(lines[at]?.say, meta?.[at]) : null),
    [at, lines, meta],
  );
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

  /* The prompt's own scale, so the spoken line reads as the main text rather than
     as a caption sitting above it. TeachSteps passes the size it is using for
     its own h2; the fallbacks match it for anywhere that does not. */
  const hero = promptSize || (phone ? 23 : 32);
  const settled = phone ? 15 : 17;
  const sweep = plan || { words: [], starts: [], exact: false };

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
    {/* THE SCRIPT IS THE HERO WHILE SHE SPEAKS (owner, Nov 5).

        It used to be a stack of small grey rows above the math, which read as a
        caption — something to skip. The kid this is built for has auditory
        processing delays and rushes reading, so the line being said has to be
        the biggest thing on the screen while it is being said: current line at
        the prompt's own scale, lines already said settling smaller above it,
        lines still to come held faint so the block does not jump as each one
        arrives.

        Once she stops, the whole script settles to reading size — the step she
        is working on gets the screen back. */}
    {!!lines.length && <div style={{ marginBottom: 16 }}>
      {lines.map((l, i) => {
        const current = i === at;
        const said = at >= 0 && i < at;
        const ahead = at >= 0 && i > at;
        return <div key={i} data-say-line={i} data-current={current ? 'yes' : 'no'}
          data-say-state={current ? 'current' : said ? 'said' : ahead ? 'ahead' : 'rest'}
          style={{
            fontSize: current ? hero : settled,
            fontWeight: current ? 600 : 400,
            letterSpacing: current ? '-.02em' : 'normal',
            lineHeight: current ? 1.22 : 1.5,
            color: current ? color.ink : color.muted,
            opacity: ahead ? 0.45 : 1,
            margin: current ? '10px 0' : '2px 0',
            padding: current ? 0 : '1px 0',
            textWrap: 'pretty',
            // Only the size and the fade move. The sweep below is the one thing
            // animating while she talks.
            transition: 'font-size .25s ease, opacity .25s ease, color .25s ease',
          }}>
          {current
            ? sweep.words.map((w, k) => <span key={k} data-say-word={k}
              data-word-state={reduced ? 'held' : k === word ? 'now' : k < word ? 'said' : 'ahead'}
              style={{
                // The held word, or the whole line when motion is reduced.
                background: (reduced || k === word) ? (color.goldTint || '#FBF3E4') : 'transparent',
                color: (reduced || k <= word) ? color.ink : color.muted,
                borderRadius: radius.sm,
                padding: '0 .06em',
                transition: 'background .12s linear, color .12s linear',
              }}>{w}{k < sweep.words.length - 1 ? ' ' : ''}</span>)
            : l.say}
        </div>;
      })}
    </div>}

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
