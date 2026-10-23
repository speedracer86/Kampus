/* Snag answer shaping (AUDIT B7).

   A Snag is authored as a scene with the exact answer a kid would say — not as a
   quiz. Giving her one free attempt therefore means inventing plausible near
   misses, and that is only honest when the answer is a plain number.

   When it is not, the old shaping produced choice sets like
   ["12", "7", "9", "The 8-pack (43¢ vs 45¢)"], where the answer is identifiable
   by shape alone. That is a fake multiple choice: she picks the odd one out and
   learns nothing, and the lesson records an attempt she never made. So this module
   says so explicitly — no choices — and the Snag renders as a scene with a reveal
   instead. An honest "think about it, then look" beats a rigged quiz. */

/** A plain number, optionally $-prefixed and optionally negative (ASCII or U+2212). */
const PLAIN = /^-?\$?\d+(?:\.\d+)?$/;
const MINUS = /−/g;

/**
 * Near-miss choices for a Snag answer, or [] when the answer is not a plain
 * number. [] means "render the reveal" — it is a signal, not a failure.
 *
 * Authored wrongs win: when the bank supplies a snag's own `wrongs` (sentence
 * answers get hand-written near misses), those ARE the choice set — no shaping,
 * no shape-based tell, same deterministic ordering.
 */
export function snagChoices(ans, wrongs) {
  const raw = String(ans).trim();
  if (Array.isArray(wrongs) && wrongs.length >= 2) {
    return [raw, ...wrongs.map(w => String(w).trim())]
      .sort((a, b) => (a.length + a.charCodeAt(0)) - (b.length + b.charCodeAt(0)));
  }
  const norm = raw.replace(MINUS, '-');
  if (!PLAIN.test(norm)) return [];

  const dollars = norm.startsWith('$') || norm.startsWith('-$');
  const n = parseFloat(norm.replace('$', ''));
  const decimals = (norm.split('.')[1] || '').length;
  // Keep the answer's own shape: $5.40's neighbours are dollars too, not bare ints.
  const show = (v) => {
    const body = decimals ? Math.abs(v).toFixed(decimals) : String(Math.abs(v));
    return `${v < 0 ? '−' : ''}${dollars ? '$' : ''}${body}`;
  };

  const step = decimals ? 1 / 10 ** decimals : 1;
  const candidates = [n + step, n - step, n + 2 * step, n * 2, Math.round(n / 2)];
  const near = [];
  for (const c of candidates) {
    const v = decimals ? Math.round(c * 10 ** decimals) / 10 ** decimals : Math.round(c);
    if (v === n || near.includes(v)) continue;
    // A negative answer keeps negative company; a positive one stays positive, so
    // the sign is never the tell.
    if ((n < 0) !== (v < 0) || v === 0) continue;
    near.push(v);
    if (near.length === 3) break;
  }
  if (near.length < 3) return [];      // nothing plausible to offer — reveal instead

  // Deterministic order so the answer is not always in the same slot.
  return [raw, ...near.map(show)]
    .sort((a, b) => (a.length + a.charCodeAt(0)) - (b.length + b.charCodeAt(0)));
}

/** Does this Snag get buttons, or a scene and a reveal? */
export const snagIsPickable = (ans, wrongs) => snagChoices(ans, wrongs).length > 1;
