# Deployment

The rule this document exists to enforce: **the stack never changes between "one
kid" and "many families" — only the data model has to be right from day one.**
Cloudflare serves static files (one student and ten thousand are the same
architecture), Supabase is Postgres (scale is a tier upgrade, not a rewrite), and
the engine runs entirely on the student's device, so compute scales with the
users who bring it. The only thing that is expensive to fix later is a schema
that assumes a single user. So the schema below is multi-tenant from the first
row, even while the only family is the owner's.

## The stack

| Layer | Service | Plan | Why |
|---|---|---|---|
| Hosting + CDN | Cloudflare Pages | Free | Unlimited static bandwidth, 500 builds/mo, PR preview deploys, commercial use allowed |
| CI gate | GitHub Actions | Free | Already runs `npm test && npm run build` on every push |
| Database + auth | Supabase | Free → Pro ($25/mo) when outside families join | Postgres + magic-link auth + row-level security; free projects pause after ~1 week idle, so Pro before the pilot starts |
| Domain + DNS | mykampus.ai on Cloudflare DNS | ~$ renewal only | One vendor for DNS, hosting, and later edge logic |

No servers. Nothing to patch, scale, or monitor at 3am. There is deliberately no
Node backend: Supabase row-level security does what an API layer would, and
`packages/engine/src/economy.js` + `payout.js` are written to run server-side
later (as a Supabase Edge Function) when earned-dollar validation needs to move
out of the client. That is additive — nothing deployed today changes.

## Domains

- **mykampus.ai** → the app families use. Today that is the legacy `index.html`
  (a Pages project with no build step, output = repo root). When the React app
  reaches parity, repoint this domain to the React project — a dashboard click,
  not a migration.
- **beta.mykampus.ai** → the React build (`apps/web`), always tracking `main`.
  This is the review target while the rebuild is in progress.
- PR previews live on `*.pages.dev` URLs automatically; no setup.

Set the domain's nameservers to Cloudflare (free DNS tier) so both Pages
projects can claim their hostnames from one place.

## Cloudflare Pages settings (two projects, one repo)

**kampus-beta** (the React app):
- Framework preset: None (monorepo — presets assume a root app)
- Build command: `npm install && npm run build`
- Build output directory: `apps/web/dist`
- Root directory: `/` (workspace install must run at the root)
- Env var `NODE_VERSION=20`
- Custom domain: `beta.mykampus.ai`

**kampus-live** (the legacy v1 app):
- Build command: none · Output directory: `/`
- Custom domain: `mykampus.ai`

Vite's `base` stays `/` (the default; do not set a subpath — that was only ever a
GitHub Pages concern).

## The multi-tenant schema (Supabase, Stage 2)

Identity model, fixed now because it is the expensive-to-change part:

- **A family is the tenant.** Every data row traces to a family. There is no
  concept of "the user" singular anywhere in the schema.
- **Adults authenticate; students don't.** A parent signs in by email magic
  link (a Supabase auth user). A student is a *profile row* inside the family —
  display name + PIN, no email, no auth account. This is the COPPA-safe shape:
  the app never holds a child's email or password, and it is also the shape that
  lets a tutor or co-op leader join later as another adult role on the same
  family (or on a future `classroom` tenant) without touching student data.

```sql
families   (id, name, created_at)
members    (user_id → auth.users, family_id → families, role: 'parent'|'tutor')
students   (id, family_id, display_name, pin_hash, settings jsonb, created_at)

-- Append-only facts. The client computes; the server remembers.
events     (id, student_id, type text, payload jsonb, created_at)
-- e.g. answer, round_end, lesson_done, quiz_result, day_closed, earn, ask

-- Materialized current state, one row per student per domain:
progress   (student_id, skill text, tier int, recent jsonb, updated_at)
business   (student_id, state jsonb, updated_at)
ledger     (id, student_id, cents int, reason text, status, created_at)
```

Row-level security on every table, one policy pattern:
`family_id IN (SELECT family_id FROM members WHERE user_id = auth.uid())`
(student-keyed tables join through `students`). Students act through the
parent's session on shared devices or an anon-key scoped flow later; the PIN
gates the kid/parent boundary inside the app, not at the database.

**Why an event log and not just state:** the engine is pure and the client owns
play. Persisting the stream of `onEvent` facts (the prop every UI component
already emits) means sync, parent analytics, term reports, and later server-side
payout validation are all queries over history — none of them schema changes.
The state tables are just caches of the fold.

## store.js contract (do this before Supabase, it makes the swap config-only)

`apps/web/src/store.js` stays the single persistence surface, but its shape is
the server's shape starting now: `load(studentId)` / `save(studentId, state)` /
`append(studentId, event)`, with the active student id chosen outside it. While
the backend is localStorage, keys are `kampus_v1_<studentId>`. Swapping in
Supabase then changes this one file and zero components.

## Environments

- Production = `main` → auto-deploy. Previews = every PR, automatic.
- Supabase: one `kampus-dev` project now (free). Create `kampus-prod` fresh when
  the first outside family is scheduled, flip it to Pro the same day (the free
  tier's idle-pause must never be able to take the pilot down), and point the
  production build's env vars at it. Supabase anon keys are public by design —
  RLS is the security boundary — but keep them in Pages env vars, not the repo.

## Not now, by design

Stripe (if subscriptions ever happen — additive), native/app-store builds (the
PWA manifest is the Stage-3 move; a link outruns an install for homeschool
distribution), analytics SDKs (COPPA: nothing third-party on kid screens; parent
insight comes from the events table), and any server compute beyond the eventual
payout-validation Edge Function.
