# Supabase — the go-live work order (owner said go, Nov 5)

This is the last technical wall before the pilot. Today every student's world
lives in one browser's localStorage: a family that sets up on the laptop and
opens the iPad finds an empty app, and the owner can see nothing about
anyone's usage. This order makes Kampus hold other people's kids.

The architecture was built for this day: **`apps/web/src/store.js` is the one
file that changes.** `load(studentId)` / `save(studentId, state)` /
`append(studentId, event)` were shaped as the server's shape from day one
(docs/DEPLOYMENT.md carries the schema). No component may change. If a
component needs changing, the seam has failed — stop and say so.

## What the owner does (his side, already queued)

- Creates the Supabase project (free tier) and hands over two values the same
  way as ElevenLabs: `SUPABASE_URL` and `SUPABASE_ANON_KEY` into `.env` —
  plus the same pair in Cloudflare Pages env for the deployed builds. The
  service-role key is NEVER used client-side and never leaves the dashboard.
- Approves the privacy-policy draft that ships alongside (separate deliverable
  from the owner's session).

## Laws (same force as the ADHD laws)

1. **COPPA shape is non-negotiable.** The parent is the account. A child is a
   row owned by a family: first name, grade, PIN hash, progress. No child
   email, no child auth identity, no third-party calls from a kid session
   beyond Supabase itself.
2. **Offline-first, never offline-lost.** The kid's session works with the
   network down: writes queue locally and flush on reconnect. A lesson
   finished in a dead zone pays out when the network returns. localStorage
   stays as the write-through cache — Supabase is the source of truth, not
   the only copy.
3. **Events are append-only.** No update, no delete on the events table —
   RLS enforces insert+select only. The pilot report depends on the log
   being a log.
4. **A family can only see itself.** Row-level security on every table,
   keyed by the family id in the JWT. Write the RLS tests first — a policy
   bug here is the one class of bug that cannot ship even once.

## Build order

1. **Migration SQL** from the DEPLOYMENT.md schema (families, members,
   students, events, progress, business, ledger), with RLS policies per
   table. Commit as `supabase/migrations/…` so the schema is in the repo.
2. **Auth**: parent magic-link (Supabase email OTP), replacing the local
   mock behind the existing onboarding screens — the screens don't change,
   the handler does. Session persists; sign-out lives in Grown-ups.
   Kid entry stays PIN-against-local-profile, exactly as today.
3. **store.js swap**: reads hydrate from Supabase into the local cache;
   writes go local-first, then sync. Conflict rule: last-writer-wins per
   student EXCEPT events, which only append, and the ledger, which replays
   from events on conflict rather than merging blobs.
4. **Migration of existing saves**: on first sign-in from a device with a
   `kampus_v1_*` save, offer to adopt it into the family (the owner's
   daughter's progress must survive this transition — test with a copied
   real save).
5. **Multi-device proof**: the webapp suite gets a spec that signs in,
   writes on one page context, reads on a fresh one (fresh storage = the
   "iPad"), and finds the same student at the same lesson pointer.
6. **Rollout**: behind `VITE_SYNC=on` env flag — beta builds sync,
   production (`mykampus.ai`) stays local until the owner's family has run
   a week on beta. The flag off = byte-identical to today.

## Tests

RLS: a second family's JWT reads zero rows of the first (asserted against a
real local Supabase via the CLI in CI, or a dedicated test project).
Offline: kill the network mid-lesson in the webapp spec, finish the lesson,
restore, assert the events arrive. Auth: the magic-link flow in the built
bundle with a stubbed mailbox. And the standing suites stay green with the
flag off AND on.

## Out of scope (so it ships this week)

Payments, parent dashboards beyond what exists, realtime subscriptions,
email beyond the magic link, admin tooling. The pilot needs sync and auth,
nothing else.

---

## Build log (Claude Code)

### Step 1 — migration SQL + RLS tests · done, Nov 5

`supabase/migrations/0001_init.sql` (seven tables, RLS on and FORCED on every
one), `supabase/test/auth-shim.sql` (test-only: the auth schema and `auth.uid()`
Supabase provides), `tests/test_rls.mjs` — **42 checks, two families, every
table**, run in CI against a `postgres:16` service container and locally against
the default server or a throwaway cluster the test initdbs itself. `npm run
test:rls`.

Three decisions the tests forced, each one a thing the schema needed that the
order did not name:

- **`events.client_id`, unique per student.** Law 2 says a queued write flushes
  on reconnect, and a flush can run twice. Without a client-generated id the
  retry double-counts: the pilot report over-reports and the ledger over-pays,
  both silently. The client inserts `on conflict do nothing`.
- **`public.create_family()` instead of an insert policy.** A new parent has no
  membership, so they cannot satisfy a membership-based insert on `families` —
  and the family is what would grant it. An open `with check (true)` plus an
  AFTER INSERT trigger looks like the answer and is not: `insert … returning id`
  evaluates the SELECT policy before end-of-statement triggers fire, so the
  tests refused it, and the open policy would have let anyone create unclaimed
  families. A SECURITY DEFINER function makes the family and the membership as
  one unit, so `families` needs no insert policy at all.
- **`students.state jsonb`.** `progress`, `business` and `ledger` carve out the
  domains with queries of their own; everything else the engine keeps (kredits,
  tickets, owned, week, days, review, passed, avatar, the paper in progress)
  rides in one last-writer-wins blob, which is what lets `save(studentId, state)`
  round-trip the exact state object so no component changes. Later migrations can
  carve further out of it without the client noticing. **Flagging this one: it is
  a departure from the column list in DEPLOYMENT.md, which has no home for those
  scalars.**

Also worth knowing before step 3: `app.family_ids()` is SECURITY DEFINER because
the obvious membership policy recurses on `members` itself, and all three definer
functions pin an empty `search_path` — a definer with a mutable path is an
escalation route. A test asserts both, and that no fourth definer function
appears unnoticed.

Not started: auth (step 2), the store.js swap (step 3), save adoption (4),
multi-device proof (5), the `VITE_SYNC` flag (6). Waiting on `SUPABASE_URL` and
`SUPABASE_ANON_KEY` in `.env` for anything that talks to a live project.
