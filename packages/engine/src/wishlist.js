/* Wishlist tiles (POLISH_TASKS Task 4, §0b "Wishlist tiles").

   A kid pastes a shop link and we try to fetch a picture of the thing she wants.
   That fetch will often fail — the page blocks us, the preview service is down, the
   link is a search result. The rule for every one of those cases: **never render an
   empty grey square.** A tile that failed must look like a tile that was designed.

   So failure is a first-class state with its own look: the store's initial on a tint
   derived from its domain, plus a glyph for the kind of thing it is. Two kids with
   Amazon links get the same colour, which makes the wall of tiles feel ordered
   rather than broken.

   Pure, and colour-free: the tint comes back as an INDEX into the palette, because
   only tokens.js is allowed to know a hex. */

/** A preview still pending after this long is a miss. The kid waits for nothing. */
export const PREVIEW_TIMEOUT_MS = 4000;

export const WISH_CATEGORIES = ['toy', 'book', 'art', 'game', 'sport', 'other'];
export const CATEGORY_GLYPH = {
  toy: '🧸', book: '📘', art: '🎨', game: '🎮', sport: '⚽', other: '✨',
};

/** The domain, forgiving about what a kid actually pastes. */
export function domainOf(url = '') {
  const raw = String(url).trim();
  if (!raw) return '';
  try {
    const host = new URL(raw.startsWith('http') ? raw : `https://${raw}`).hostname.replace(/^www\./, '');
    // `new URL('https://rubbish')` parses happily, which would turn a typo into a
    // tile reading "Something from rubbish". A real domain has a dot in it.
    return host.includes('.') ? host : '';
  } catch {
    return '';
  }
}

/** A readable store name from a domain: "amazon.co.uk" -> "Amazon". */
export function storeNameOf(url = '') {
  const d = domainOf(url);
  if (!d) return '';
  const base = d.split('.')[0];
  return base.charAt(0).toUpperCase() + base.slice(1);
}

/** Stable domain -> palette index, so the same shop is always the same colour. */
export function tintIndexFor(domain = '', paletteSize = 6) {
  let hash = 0;
  for (const ch of String(domain)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % paletteSize;
}

export const initialFor = (item = {}) =>
  String(item.title || item.store || domainOf(item.url) || '?').trim().charAt(0).toUpperCase() || '?';

/**
 * Which tile to draw.
 *   shimmer — still fetching, inside the timeout
 *   photo   — we got an image
 *   tinted  — no image, but we know the shop: initial on its tint, plus a glyph
 *   link    — we know nothing but the link: offer "Add details"
 */
export function tileState(item = {}, { now = Date.now() } = {}) {
  const pending = item.fetch === 'pending';
  const timedOut = pending && typeof item.requestedAt === 'number' && now - item.requestedAt >= PREVIEW_TIMEOUT_MS;
  if (pending && !timedOut) return 'shimmer';
  if (item.imageUrl) return 'photo';
  if (item.store || domainOf(item.url)) return 'tinted';
  return 'link';
}

/** Everything a tile needs, already decided. */
export function wishTile(item = {}, opts = {}) {
  const domain = domainOf(item.url);
  const state = tileState(item, opts);
  return {
    state,
    domain,
    store: item.store || storeNameOf(item.url),
    initial: initialFor(item),
    tintIndex: tintIndexFor(domain),
    glyph: CATEGORY_GLYPH[item.category] || CATEGORY_GLYPH.other,
    title: item.title || (domain ? `Something from ${domain}` : 'A link'),
    priceCents: item.priceCents,
    imageUrl: state === 'photo' ? item.imageUrl : null,
    needsDetails: state === 'link',
  };
}

/** Mark a pending item as missed once its timeout has passed. */
export function resolveTimeouts(items = [], { now = Date.now() } = {}) {
  return items.map(i => (tileState(i, { now }) !== 'shimmer' && i.fetch === 'pending' ? { ...i, fetch: 'miss' } : i));
}
