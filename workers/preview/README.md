# Link preview Worker

`GET /preview?url=<store page>` → `{ ok, domain, title, imageUrl, priceCents }`.

The Rewards wishlist wants a picture of the thing she asked for, and a browser cannot
fetch a shop page directly (CORS). This Worker does it server-side and returns only the
three fields a tile needs.

## Deploy (owner's step)

```bash
cd workers/preview
npx wrangler deploy
```

Then set `VITE_PREVIEW_URL` to the deployed origin in the Pages project's environment
variables (see `docs/DEPLOYMENT.md`).

## Shipping without it

Supported, and designed for. With no `VITE_PREVIEW_URL` the app never calls out: every
wishlist item resolves immediately to its fallback tile — the store's initial on a tint
derived from its domain, plus a category glyph. The done-condition for the tiles was
specifically "killing the preview service leaves every tile looking intentional".

## Deliberate limits

- **Only public http(s).** Private and loopback addresses are refused, so a pasted link
  cannot make the Worker probe an internal host.
- **3.5s timeout**, under the client's 4s give-up: a slow answer is worse than none,
  because the tile has already moved on.
- **Reads the `<head>`, not the whole page** (512KB cap, stops at `</head>`).
- **Returns three fields.** No page body, no tracking, nothing about the visitor.
- **Caches for a day.** A product photo is not news.
- A refusal is still a `200` with `ok: false` — the client has a designed fallback and
  an error status would only invite a retry loop.
