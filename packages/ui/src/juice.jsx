/* Sound and juice (PLAY_SYSTEM §8.1).

   Three pieces, and three rules that decide where they may appear.

   RULE 1 — juice is for EARNING and BUILDING moments only, never idle and never
   nagging. Money arriving, a day's books closing, a License earned. It does not
   fire on a correct answer (that is just the work), it never fires on a wrong one,
   and nothing here can be triggered by the app wanting attention.

   RULE 2 — reduced motion disables ALL of it, sound included. That is §8.6 and it
   is also what the Grown-ups toggle already promises in as many words. The system
   preference is honoured without being asked for: a kid who has set it on her
   device should never have to find a setting in here.

   RULE 3 — nothing to download. The register is synthesised with WebAudio, so
   there is no audio asset in the repo, no network request, and no silent failure
   when a file 404s. Confetti is six divs.

   Zero-dependency as the package contract requires. */
import { confetti as CONFETTI_COLORS, spring } from './tokens.js';

/** The device's own preference, watched live. */
export function useReducedMotion() {
  const [reduced, setReduced] = React.useState(() => {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
  });
  React.useEffect(() => {
    let mq;
    try { mq = window.matchMedia('(prefers-reduced-motion: reduce)'); } catch { return; }
    const on = (e) => setReduced(e.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
}

/* ---------------------------------------------------------------- sound ----- */
let ctx = null;

/**
 * One soft two-note register. Synthesised, short, and quiet enough to sit under a
 * conversation — a till heard from the next room, not a slot machine.
 *
 * Silent when muted or when motion is reduced. Any failure is swallowed: a missing
 * AudioContext must never take a screen down over a sound effect.
 */
export function playRegister({ muted = false, reduced = false, volume = 0.05 } = {}) {
  if (muted || reduced) return false;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = ctx || new AC();
    if (ctx.state === 'suspended') ctx.resume?.();
    const now = ctx.currentTime;
    // Two notes a fifth apart, the second a beat later: the shape of a till.
    [[880, 0], [1320, 0.085]].forEach(([hz, at]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = hz;
      // A quick attack and a soft tail; no sustain, nothing to grate on repeat.
      gain.gain.setValueAtTime(0.0001, now + at);
      gain.gain.exponentialRampToValueAtTime(volume, now + at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.22);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + at); osc.stop(now + at + 0.24);
    });
    return true;
  } catch {
    return false;                      // never let a sound break a screen
  }
}

/* -------------------------------------------------------------- count-up ---- */
/**
 * A short count-up on a money value. `format` keeps this component ignorant of
 * cents vs Kredits — the caller formats.
 *
 * Under reduced motion it renders the final value immediately: the figure is the
 * information, and the animation is the decoration.
 */
export function CountUp({ value = 0, from = 0, format = (v) => v, ms = 650, reduced, style }) {
  const prefersReduced = useReducedMotion();
  const off = reduced ?? prefersReduced;
  const [shown, setShown] = React.useState(off ? value : from);

  React.useEffect(() => {
    if (off) { setShown(value); return; }
    let raf, start = null;
    const begin = shown;
    const step = (t) => {
      start = start ?? t;
      const p = Math.min(1, (t - start) / ms);
      // Ease out: fast first, settling onto the number rather than ticking up to it.
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(begin + (value - begin) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, off]); // eslint-disable-line react-hooks/exhaustive-deps

  return <span style={style} data-countup={value}>{format(shown)}</span>;
}

/* -------------------------------------------------------------- confetti ---- */
/**
 * Calm confetti: a dozen pieces, one short fall, then gone. §0's palette, no
 * looping, no full-screen takeover, and nothing at all under reduced motion.
 */
export function Confetti({ run = false, pieces = 12, reduced }) {
  const prefersReduced = useReducedMotion();
  const off = reduced ?? prefersReduced;
  const [on, setOn] = React.useState(false);

  React.useEffect(() => {
    if (!run || off) return;
    setOn(true);
    const t = setTimeout(() => setOn(false), 1400);
    return () => clearTimeout(t);
  }, [run, off]);

  if (!on || off) return null;
  return <div aria-hidden="true" data-confetti="on" style={{ position: 'absolute', inset: 0,
    overflow: 'hidden', pointerEvents: 'none' }}>
    {Array.from({ length: pieces }, (_, i) => {
      const left = (i * 97) % 100;                 // deterministic spread, no RNG
      const delay = (i % 5) * 60;
      const size = 6 + (i % 3) * 3;
      return <span key={i} style={{ position: 'absolute', top: -12, left: `${left}%`,
        width: size, height: size * 1.6, borderRadius: 2,
        background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        animation: `kampusFall 1.2s ${spring} ${delay}ms both` }} />;
    })}
    <style>{`@keyframes kampusFall {
      from { transform: translateY(-10px) rotate(0deg); opacity: 0 }
      15% { opacity: 1 }
      to { transform: translateY(260px) rotate(190deg); opacity: 0 }
    }`}</style>
  </div>;
}
