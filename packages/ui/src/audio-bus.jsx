/* The audio bus — one owner of sound in the whole product.

   THE DUCKING LAW (docs/VOICE_PASS.md §2, and the reason this file exists rather
   than a play() helper): while Karla speaks, nothing else may sound and nothing
   but the active cue may move. The student has auditory processing delays; a
   register chime under a spoken sentence does not add delight, it costs her the
   sentence.

   So sound is not something a component does. It is something it asks the bus for,
   and the bus refuses:

     - `play()` stops whatever is playing first. Two clips never overlap.
     - `speaking()` is true while a clip runs, and the juice module checks it before
       any register or confetti. One flag, read by everything that could intrude.

   Keeping it here rather than in juice.jsx is deliberate: juice is the thing most
   likely to break the law, so it must depend on the bus rather than own it. */

let current = null;            // the HTMLAudioElement now playing, if any
let settle = null;             // resolver for the clip in flight — see stop()
let speakingUntil = 0;         // belt and braces for a clip that never fires 'ended'
const listeners = new Set();

const notify = () => listeners.forEach(fn => { try { fn(isSpeaking()); } catch { /* a listener must not break playback */ } });

/** Is Karla talking right now? Everything that could intrude must ask. */
export function isSpeaking() {
  if (current && !current.paused && !current.ended) return true;
  return Date.now() < speakingUntil;
}

/**
 * How far into the current clip we are, and how long it runs.
 *
 * This exists so the word sweep can be driven by the AUDIO rather than by a
 * timer. A timer has to be told about `Slower`, and would drift from the voice
 * over a long line; `currentTime` already advances at the playback rate, so
 * slowing the voice slows the sweep by construction instead of by agreement.
 *
 * `d` is NaN until the browser has the metadata, so callers must handle not
 * knowing the duration yet.
 */
export function progress() {
  if (!current) return null;
  return { t: current.currentTime, d: current.duration, rate: current.playbackRate };
}

/** Subscribe to speaking changes; returns an unsubscribe. */
export function onSpeakingChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Stop anything playing. Safe to call at any time, including when nothing is. */
export function stop() {
  if (current) {
    try { current.pause(); current.currentTime = 0; } catch { /* already gone */ }
    current = null;
  }
  // Resolve the clip in flight. Pausing fires neither 'ended' nor 'error', so
  // without this the previous playLines() loop awaits a promise that never settles
  // — it never reaches its own shouldStop() check, and two sequences interleave
  // their onLine callbacks. The suite caught this as two clips playing at once.
  if (settle) { const f = settle; settle = null; f('stopped'); }
  speakingUntil = 0;
  notify();
}

/**
 * Play one clip, exclusively.
 * @returns {Promise<'ended'|'failed'|'blocked'|'stopped'>} never rejects — a
 *   missing clip is a fallback case, not an error a screen should handle, and
 *   'blocked' means the browser wants a tap first.
 */
export function play(src, { rate = 1, muted = false } = {}) {
  stop();
  if (muted) return Promise.resolve('stopped');
  return new Promise((resolve) => {
    let audio;
    try { audio = new Audio(src); } catch { return resolve('failed'); }
    audio.playbackRate = rate;         // modern browsers preserve pitch by default
    current = audio;
    // A short floor so a cue fired on 'play' is never instantly cancelled by a
    // speaking() check racing the element's own state.
    speakingUntil = Date.now() + 150;
    const done = (how) => {
      if (settle === done) settle = null;
      if (current === audio) { current = null; speakingUntil = 0; notify(); }
      resolve(how);
    };
    settle = done;
    audio.addEventListener('ended', () => done('ended'), { once: true });
    audio.addEventListener('error', () => done('failed'), { once: true });
    /* A rejected play() on a page with no user gesture is the same autoplay
       policy that blocks the browser voice, and it is reported the same way so
       the caller can invite the kid to start it. */
    audio.play().then(notify).catch(err => done(err?.name === 'NotAllowedError' ? 'blocked' : 'failed'));
  });
}

/**
 * Play a sequence of clips in order, firing `onLine(index)` as each starts.
 * Stops cleanly if `shouldStop()` goes true — Quiet, or leaving the step.
 */
export async function playLines(sources, { rate = 1, muted = false, onLine, shouldStop } = {}) {
  for (let i = 0; i < sources.length; i++) {
    if (shouldStop?.()) return 'stopped';
    onLine?.(i);
    const how = await play(sources[i], { rate, muted });
    if (how === 'stopped') return 'stopped';
    // A failed clip does not abort the rest: a missing file should cost that line,
    // not the lesson.
  }
  return 'ended';
}

/** React binding for "is Karla talking", for anything that must hold still. */
export function useSpeaking() {
  const [speaking, setSpeaking] = React.useState(isSpeaking());
  React.useEffect(() => onSpeakingChange(setSpeaking), []);
  return speaking;
}
