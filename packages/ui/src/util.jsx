/* Non-component helpers shared across the library.
   NOTE the .jsx extension: it carries no JSX, but vite.config.js only injects
   React into .jsx files, and useWidth below needs React in scope. A .js file
   here compiles clean and then throws "React is not defined" at runtime.
   They live outside the component modules on purpose: React Fast Refresh only
   works on modules whose exports are all components, so a stray function
   exported beside them costs the whole dev loop a full page reload. */

/** Width of a ref'd element, for container-driven responsive layout. */
export function useWidth(ref) {
  const [w, setW] = React.useState(1060);
  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(es => setW(es[0].borderBoxSize?.[0]?.inlineSize ?? es[0].target.getBoundingClientRect().width));
    ro.observe(ref.current); return () => ro.disconnect();
  }, []);
  return w;
}

/* Field tracing, armed by `?voicetrace=1`.

   The voice path has now produced three defects that only exist on a real page
   — a voice owner stopping another component's line, an autoplay that never
   arms, a sweep with no boundary events — and each cost several rounds of
   guessing. A trace from the live tab named the first one in a single run. This
   is that, made permanent and shippable: off by default, costing nothing, and
   one query parameter away when a kid's browser does something ours does not. */
let traceOn = null;
export function vtraceEnabled() {
  if (traceOn === null) {
    try { traceOn = /[?&]voicetrace=1/.test(globalThis.location?.search || ''); } catch { traceOn = false; }
  }
  return traceOn;
}
export function vtrace(...args) {
  if (!vtraceEnabled()) return;
  try { console.log('[voice]', Math.round(performance.now()), ...args); } catch { /* never break playback */ }
}

/* How many utterances this module believes are still being spoken.

   `speechSynthesis.speaking` is the engine's own flag and is the truth about
   whether sound is coming out, but it is false in the gap between queueing an
   utterance and the voice starting — which is exactly the window two readers
   arriving together land in. This count closes that window: it rises the moment
   an utterance is handed over and falls when it ends, errors, or is hushed. */
let active = 0;

/** Is anything we started still speaking, or about to be? */
export const speechActive = () => active > 0;

/**
 * Read text aloud (browser SpeechSynthesis). Silent where unsupported.
 *
 * `opts` may be a rate (the old second argument, still used by VoiceRow) or
 * `{ rate, onBoundary, onEnd }`. `onBoundary` receives the character index the
 * voice has reached, which is what lets the word sweep follow the browser voice
 * as closely as it follows a recorded clip — real boundaries, not a timer.
 * Returns the utterance, or null where speech is unsupported.
 */
export function speak(text, opts) {
  const { rate = 0.95, onBoundary, onEnd } = (typeof opts === 'number' ? { rate: opts } : (opts || {}));
  try {
    const u = new SpeechSynthesisUtterance(String(text).replace(/−/g, ' negative '));
    /* LOCAL VOICES FIRST, and it is not about quality.

       Chrome's network voices — which include the Natural and Google US picks
       this list used to prefer — fire NO `boundary` events at all. Only
       localService voices report where they are in the sentence, and the word
       sweep is built on exactly that. Preferring the prettier remote voice
       meant the owner's browser showed a kid a question that was read aloud
       and never highlighted. Local voices also start faster, with no network
       round trip before the first word.

       On a cold page getVoices() is still empty — the list loads lazily — so
       this finds nothing and leaves `voice` null, which is the browser default
       and perfectly fine. Nothing here may ASSUME the list is populated. */
    const vs = speechSynthesis.getVoices() || [];
    const local = vs.filter(v => v.localService);
    const pick = (list) => list.find(v => /Samantha|Natural/.test(v.name))
      || list.find(v => /en[-_]US/i.test(v.lang || ''))
      || list[0];
    u.voice = pick(local) || pick(vs.filter(v => /^en/i.test(v.lang || ''))) || null;
    u.rate = rate;
    if (onBoundary) u.onboundary = (e) => { try { onBoundary(e.charIndex ?? 0, e); } catch { /* never break playback */ } };
    /* `onend`/`onerror` are wired whether or not the caller wanted them: a
       caller that does not care about the end still has to stop being counted,
       or the next reader waits for a voice that finished minutes ago. */
    active += 1;
    let settled = false;
    const settle = (how) => {
      if (settled) return;
      settled = true;
      active = Math.max(0, active - 1);
      vtrace('tts settle', how, 'active now', active);
      onEnd?.(how);
    };
    u.onstart = () => vtrace('tts start', JSON.stringify(String(text).slice(0, 24)),
      'voice:', u.voice?.name || 'default', 'local:', u.voice?.localService);
    u.onend = () => settle('ended');
    /* `not-allowed` is Chrome's autoplay policy, not a broken voice: the page
       has had no user gesture yet. It is reported separately so the caller can
       INVITE the kid to start it rather than silently give up. */
    u.onerror = (e) => settle(e?.error === 'not-allowed' ? 'blocked' : 'failed');
    speechSynthesis.cancel(); speechSynthesis.speak(u);
    return u;
  } catch (e) { onEnd?.('failed'); return null; }
}

/** Stop the browser voice, wherever it was started from. */
export function hushSpeech() {
  try { speechSynthesis.cancel(); } catch { /* nothing to stop */ }
  /* Forced to zero rather than decremented. A browser (or a stub) that drops a
     cancelled utterance's `end` event would otherwise leave the count high
     forever, and every later reader would wait out its cap before speaking. */
  active = 0;
}
