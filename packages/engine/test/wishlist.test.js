import { describe, it, expect } from 'vitest';
import {
  PREVIEW_TIMEOUT_MS, WISH_CATEGORIES, CATEGORY_GLYPH, domainOf, storeNameOf,
  tintIndexFor, initialFor, tileState, wishTile, resolveTimeouts,
} from '../src/wishlist.js';

describe('a wishlist tile never looks broken (Task 4)', () => {
  it('reads the domain out of whatever a kid pastes', () => {
    expect(domainOf('https://www.amazon.com/dp/B01')).toBe('amazon.com');
    expect(domainOf('target.com/p/thing')).toBe('target.com');
    expect(domainOf('  https://shop.lego.com/x  ')).toBe('shop.lego.com');
    expect(domainOf('not a url')).toBe('');
    expect(domainOf('')).toBe('');
  });

  it('names the store readably', () => {
    expect(storeNameOf('https://www.amazon.co.uk/dp/x')).toBe('Amazon');
    expect(storeNameOf('')).toBe('');
  });

  it('gives one shop one colour, always', () => {
    expect(tintIndexFor('amazon.com')).toBe(tintIndexFor('amazon.com'));
    expect(tintIndexFor('amazon.com')).toBeLessThan(6);
    expect(tintIndexFor('')).toBeGreaterThanOrEqual(0);
  });

  it('shimmers while fetching, inside the timeout', () => {
    const item = { url: 'https://target.com/x', fetch: 'pending', requestedAt: 1000 };
    expect(tileState(item, { now: 1000 + PREVIEW_TIMEOUT_MS - 1 })).toBe('shimmer');
  });

  it('gives up after four seconds rather than spinning forever', () => {
    const item = { url: 'https://target.com/x', fetch: 'pending', requestedAt: 1000 };
    expect(PREVIEW_TIMEOUT_MS).toBe(4000);
    expect(tileState(item, { now: 1000 + PREVIEW_TIMEOUT_MS })).toBe('tinted');
  });

  it('shows the photo when there is one', () => {
    expect(tileState({ url: 'https://target.com/x', fetch: 'ok', imageUrl: 'https://img' })).toBe('photo');
  });

  it('falls back to the store initial on its tint, never a grey square', () => {
    const t = wishTile({ url: 'https://target.com/p/sticker-book', fetch: 'miss', category: 'art' });
    expect(t.state).toBe('tinted');
    expect(t.initial).toBe('T');
    expect(t.glyph).toBe(CATEGORY_GLYPH.art);
    expect(t.imageUrl).toBe(null);
    expect(t.title).toBe('Something from target.com');
  });

  it('offers to fill in a link it knows nothing about', () => {
    const t = wishTile({ url: 'rubbish', fetch: 'miss' });
    expect(t.state).toBe('link');
    expect(t.needsDetails).toBe(true);
  });

  it('KILLING THE PREVIEW SERVICE leaves every tile intentional (the done-condition)', () => {
    // Every item fails: no titles, no images, nothing but what the kid pasted.
    const items = [
      { url: 'https://amazon.com/dp/1', fetch: 'miss' },
      { url: 'https://target.com/p/2', fetch: 'miss', category: 'game' },
      { url: 'https://shop.lego.com/3', fetch: 'miss', category: 'toy' },
      { url: 'typed it wrong', fetch: 'miss' },
    ];
    const tiles = items.map(i => wishTile(i));
    expect(tiles.every(t => t.state !== 'photo')).toBe(true);
    // Every tile still has something to draw: an initial and a glyph, or a prompt.
    for (const t of tiles) {
      expect(t.state === 'link' ? t.needsDetails : !!(t.initial && t.glyph), t.domain).toBe(true);
    }
    expect(tiles.filter(t => t.state === 'tinted')).toHaveLength(3);
  });

  it('resolves stale pending items to a miss', () => {
    const items = [{ url: 'https://a.com', fetch: 'pending', requestedAt: 0 }];
    expect(resolveTimeouts(items, { now: PREVIEW_TIMEOUT_MS })[0].fetch).toBe('miss');
    expect(resolveTimeouts(items, { now: 10 })[0].fetch).toBe('pending');
  });

  it('has a glyph for every category it offers', () => {
    for (const c of WISH_CATEGORIES) expect(CATEGORY_GLYPH[c], c).toBeTruthy();
  });
});
