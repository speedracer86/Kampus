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

### Steps 2-6 — done, Nov 6

Against the real project (`zjnjwkysjanscmxmiyos`). `npm run test:sync` is the
multi-device proof; it is opt-in (no `.env`, no run) because it needs the live
project, and it is skipped loudly rather than passing quietly. Everything else
runs in CI as before, with the flag off AND on: **236/236 both ways.**

- **Auth** is a real magic link (`supabase.js`). Two component touches, both
  additive and both inert with the flag off: `ParentSetup` hands out the email
  it already collects (there was nowhere for it to go — the handler cannot send
  a link to an address it never sees), and `GrownUps` shows the account with a
  sign-out, which the order asked to live there. Neither screen's design moved;
  with no `onSendLink` / `onSignOut` prop they render exactly as before.
- **store.js** keeps its SYNCHRONOUS API on purpose. App.jsx calls `load()`
  inside a `useState` initialiser, so making it async would push an `await` into
  every screen — the opposite of what the order asks. Reads come from the cache,
  writes go local-first and queue, and a pull lands in the cache and bumps the
  app to re-read.
- **The ledger is unioned by row id, not replayed from events.** The order says
  replay, and the instinct is right — but `earn` events carry cents and a
  reason, not the row id an `approve` later refers to, so a replay would mint
  new ids and orphan every approval. A union by id loses no row and no approval,
  which is what replaying was for.
- **The flag really is a flag.** With `VITE_SYNC` off the Supabase URL is not
  even in the bundle — the constant folds and the client is dead code.

Three bugs the work turned up, all in code written for it:

1. **Three copies of one student, 46ms apart.** `flush()` checked its "already
   running" guard *before* an `await` and set it *after*, so three cycles
   (startup, the auth event, a reconnect) all passed the check and all pushed.
   The guard is claimed before the first await now, and `cycle()` has one of its
   own.
2. **One bad fact could block every later one.** The event push is a batch, so a
   row the server will never accept failed every flush and took the whole queue
   with it — forever, silently. A batch that keeps failing is now dropped after
   five tries with a console warning. Losing one fact is bad; losing every fact
   after it is how a kid's week disappears.
3. **Erasure was impossible.** 0001's append-only trigger refused the cascade
   from deleting a family, so a parent asking for their child's data to be
   removed could not be served without dropping the trigger in production.
   `supabase/migrations/0002_lawful_erasure.sql` fixes it — an ordinary delete
   is still refused, a session that has declared `app.erasing` may cascade, and
   editing a fact is still refused outright. **It is written and tested locally
   but NOT applied to the project** (see below).

### Still needed from the owner

- **Apply `0002_lawful_erasure.sql`.** I was blocked from applying it: it
  loosens a guard, so it needs your hand. Until then no family, and no student
  who has ever done anything, can be deleted from the project — including the
  test rows this work left behind.
- **Custom SMTP, before the pilot.** The project is on Supabase's default
  mailer, which rate-limited a handful of sign-ups in a row during this work
  (`429 email rate limit exceeded`). Magic links ARE the way in, so with the
  default mailer a family that mistypes an address twice is locked out for an
  hour. This is a go-live blocker, not a nicety.
- **Two test accounts exist** — `e2e-a@mykampus.ai` and `e2e-b@mykampus.ai`,
  created by hand because the mailer could not be used. Remove with
  `delete from auth.users where email like 'e2e-%@mykampus.ai';` when you want
  them gone; `npm run test:sync` needs them (or set `E2E_EMAIL`/`E2E_PASSWORD`).
