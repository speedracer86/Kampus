/* Link preview Worker — GET /preview?url=<store page>
 *
 * Why this exists: the Rewards wishlist wants a picture of the thing she asked for,
 * and a browser cannot fetch a shop page directly — CORS blocks it. So a tiny Worker
 * fetches the page server-side and returns only what a tile needs.
 *
 * What it deliberately does NOT do:
 *   - follow a link to anything but http(s), or to a private address;
 *   - return the page body, or anything beyond three fields;
 *   - take more than a few seconds — the tile gives up at 4s regardless, so a slow
 *     answer is worse than no answer.
 *
 * Deployment is the owner's step: `wrangler deploy` from this directory.
 */

const CACHE_SECONDS = 60 * 60 * 24;      // a product page's picture is not news
const FETCH_TIMEOUT_MS = 3500;           // under the client's 4s give-up
const MAX_BYTES = 512 * 1024;            // read the <head>, not a whole catalogue

const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': `public, max-age=${CACHE_SECONDS}`,
    ...extra,
  },
});

/** Only public http(s). Never let a pasted link make the Worker probe a private host. */
function safeTarget(raw) {
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const host = u.hostname;
  if (host === 'localhost' || host.endsWith('.local') || !host.includes('.')) return null;
  if (/^(10\.|127\.|0\.|169\.254\.|192\.168\.)/.test(host)) return null;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return null;
  if (host.startsWith('[')) return null;                     // IPv6 literals
  return u;
}

const meta = (html, names) => {
  for (const name of names) {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']`, 'i');
    const alt = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`, 'i');
    const m = html.match(re) || html.match(alt);
    if (m) return m[1].trim();
  }
  return null;
};

const titleOf = (html) =>
  meta(html, ['og:title', 'twitter:title']) || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || null;

/** Price as integer cents, from the usual metadata. Currency is ignored on purpose:
    the kid's ledger is dollars, and a wrong symbol is worse than none. */
function priceCentsOf(html) {
  const raw = meta(html, ['product:price:amount', 'og:price:amount', 'twitter:data1']);
  if (!raw) return null;
  const n = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,OPTIONS',
      } });
    }
    const { searchParams, pathname } = new URL(request.url);
    if (!pathname.startsWith('/preview')) return json({ error: 'not found' }, 404);

    const target = safeTarget(searchParams.get('url') || '');
    // A refusal is still an answer: the tile has a designed fallback and uses it.
    if (!target) return json({ ok: false, reason: 'unsupported-url' }, 200);

    const cache = caches.default;
    const cacheKey = new Request(`https://preview.cache/${encodeURIComponent(target.href)}`);
    const hit = await cache.match(cacheKey);
    if (hit) return hit;

    const stop = new AbortController();
    const timer = setTimeout(() => stop.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(target.href, {
        signal: stop.signal,
        headers: { 'user-agent': 'KampusPreview/1.0 (+wishlist tile)', accept: 'text/html' },
        redirect: 'follow',
      });
      if (!res.ok) return json({ ok: false, reason: `upstream-${res.status}` });

      const reader = res.body?.getReader();
      let html = '', bytes = 0;
      const decoder = new TextDecoder();
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        html += decoder.decode(value, { stream: true });
        if (bytes >= MAX_BYTES || /<\/head>/i.test(html)) { await reader.cancel(); break; }
      }

      const body = {
        ok: true,
        url: target.href,
        domain: target.hostname.replace(/^www\./, ''),
        title: titleOf(html),
        imageUrl: meta(html, ['og:image', 'twitter:image']),
        priceCents: priceCentsOf(html),
      };
      const out = json(body);
      await cache.put(cacheKey, out.clone());
      return out;
    } catch (e) {
      return json({ ok: false, reason: e.name === 'AbortError' ? 'timeout' : 'fetch-failed' });
    } finally {
      clearTimeout(timer);
    }
  },
};
