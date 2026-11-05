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
import { playLines, stop as stopAudio, useSpeaking } from './audio-bus.jsx';

const sBase = { fontFamily: font.family, boxSizing: 'border-box' };

/** Clip paths for a step, or null when the manifest does not cover it. */
export function clipsFor(manifest, skill, kind, stepIndex, base = '/voice/') {
  const step = manifest?.[skill]?.[kind]?.[stepIndex];
  if (!Array.isArray(step) || !step.length) return null;
  return step.map(l => `${base}${l.file}`);
}

/**
 * The spoken script under the prompt, with the line being said highlighted.
 *
 * @param {object} p
 * @param {Array<{say:string, cue:string}>} p.lines  the step's speakLines
 * @param {string[]|null} p.clips                    manifest paths, or null to fall back
 * @param {(cue:string, index:number) => void} p.onCue fires as each line starts
 */
export function SayItShowIt({ lines = [], clips, speak, muted = false, autoplay = true,
  fallbackText, onCue, phone, mode = 'b', worldColor, blobDir = '/blobs/' }) {
  const [at, setAt] = React.useState(-1);
  const [quiet, setQuiet] = React.useState(false);
  const [rate, setRate] = React.useState(1);
  const speaking = useSpeaking();
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
    {/* The script, small, under the prompt. The line being spoken is held in gold. */}
    {!!lines.length && <div style={{ marginBottom: 12 }}>
      {lines.map((l, i) => <div key={i} data-say-line={i} data-current={i === at ? 'yes' : 'no'}
        style={{ fontSize: phone ? 15 : 16, lineHeight: 1.5, padding: '5px 10px', borderRadius: radius.sm,
          background: i === at ? color.goldTint || '#FBF3E4' : 'transparent',
          color: i === at ? color.ink : color.muted,
          fontWeight: i === at ? 600 : 400, transition: 'background .2s' }}>{l.say}</div>)}
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
