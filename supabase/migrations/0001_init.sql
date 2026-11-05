/* Kampus — the multi-tenant schema (docs/DEPLOYMENT.md §"The multi-tenant schema",
   docs/SUPABASE_WORK_ORDER.md).

   A FAMILY IS THE TENANT. There is no concept of "the user" singular anywhere
   below. Every row traces to a family, and row-level security keys off the
   caller's membership, so the question "can this request see this row?" has one
   answer in one place rather than one per query.

   The four laws from the work order, and where each one is actually enforced —
   written down here because a law that lives only in a doc is a law the next
   migration breaks:

     1. COPPA SHAPE. The parent is the account; a child is a row. `students` has
        no email, no password, no auth identity, and no foreign key into
        auth.users — there is nowhere for a child credential to go, which is
        stronger than a rule saying not to put one there. Adults authenticate
        (members → auth.users); students are profiles their family owns.
     2. OFFLINE-FIRST, NEVER OFFLINE-LOST. Queued writes flush on reconnect, and a
        flush may run twice — the network died, the retry fired, both arrived. So
        `events` carries a client-generated `client_id` with a uniqueness
        constraint per student, and the client inserts ON CONFLICT DO NOTHING. A
        lesson finished in a dead zone pays out once, not twice. Without that
        constraint the pilot report double-counts and the ledger double-pays, and
        both failures are silent.
     3. EVENTS ARE APPEND-ONLY. No update policy, no delete policy, and the
        privileges are revoked besides — two independent locks, because the pilot
        report is only trustworthy if the log is a log. A trigger refuses the rest.
     4. A FAMILY CAN ONLY SEE ITSELF. RLS is enabled and FORCED on every table,
        including against the table owner, and there is no policy anywhere that
        can be satisfied without membership.

   Applied by the Supabase CLI on the real project; applied by tests/test_rls.mjs
   against a throwaway Postgres (which first installs supabase/test/auth-shim.sql
   to stand in for the auth schema Supabase provides). */

create extension if not exists "pgcrypto";

/* ---------------------------------------------------------------------------
   Tables
--------------------------------------------------------------------------- */
create table if not exists public.families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(btrim(name)) > 0),
  created_at  timestamptz not null default now()
);

create table if not exists public.members (
  user_id     uuid not null references auth.users (id) on delete cascade,
  family_id   uuid not null references public.families (id) on delete cascade,
  role        text not null default 'parent' check (role in ('parent', 'tutor')),
  created_at  timestamptz not null default now(),
  primary key (user_id, family_id)
);
create index if not exists members_family_idx on public.members (family_id);

/* A student is a profile, not an account. First name, grade, PIN hash, state.
   No email column, no auth.users reference — see law 1. The PIN gates the
   kid/grown-up boundary inside the app, never at the database: a PIN is four
   digits a sibling can watch being typed, so it is not a security boundary and
   must not be mistaken for one. */
create table if not exists public.students (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references public.families (id) on delete cascade,
  display_name  text not null check (length(btrim(display_name)) > 0),
  grade         smallint check (grade between 3 and 8),
  pin_hash      text,
  settings      jsonb not null default '{}'::jsonb,
  /* The rest of the student's world, last-writer-wins per the work order's
     conflict rule. `progress`, `business` and `ledger` below carve out the
     domains that have queries of their own; everything else the engine keeps
     (kredits, tickets, owned, week, days, review, passed, avatar, the paper in
     progress) rides here so store.js can round-trip the exact state object and
     no component changes. Later migrations can carve further out of this
     column without the client noticing. */
  state         jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists students_family_idx on public.students (family_id);

/* Append-only facts. The client computes; the server remembers. */
create table if not exists public.events (
  id          bigint generated always as identity primary key,
  student_id  uuid not null references public.students (id) on delete cascade,
  /* Law 2: the client generates this, so a replayed queue is a no-op rather
     than a double count. */
  client_id   uuid not null,
  type        text not null check (length(btrim(type)) > 0),
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  unique (student_id, client_id)
);
create index if not exists events_student_time_idx on public.events (student_id, created_at);

/* Materialised folds of the log, one row per student per domain. */
create table if not exists public.progress (
  student_id  uuid not null references public.students (id) on delete cascade,
  skill       text not null,
  tier        smallint not null default 1 check (tier between 1 and 5),
  recent      jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (student_id, skill)
);

create table if not exists public.business (
  student_id  uuid primary key references public.students (id) on delete cascade,
  state       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

/* Real money owed to a kid. `status` is the grown-up's approval, which is why
   this is rows rather than a number in a blob: every cent has a day, a reason
   and an approver, and the work order replays it from events on conflict rather
   than merging. */
create table if not exists public.ledger (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students (id) on delete cascade,
  cents       integer not null check (cents >= 0),
  reason      text not null,
  status      text not null default 'pending' check (status in ('pending', 'approved', 'held')),
  day         text,
  week        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists ledger_student_idx on public.ledger (student_id, created_at);

/* NOTE ON ORDER: the helpers below come AFTER the tables, not before. `language
   sql` function bodies are parsed when they are created, so with search_path
   pinned to '' a helper that selects from public.members cannot be declared
   before public.members exists. Tables, then helpers, then policies. */

/* ---------------------------------------------------------------------------
   Who the caller is

   `app.family_ids()` is SECURITY DEFINER on purpose. The obvious policy —
   "family_id in (select family_id from members where user_id = auth.uid())" —
   is fine on every table except `members` itself, where reading members to
   decide whether you may read members recurses and Postgres aborts with
   "infinite recursion detected in policy". A definer function reads the table
   with RLS bypassed, so one helper serves every table including that one.

   The search_path is pinned and empty: a SECURITY DEFINER function with a
   mutable search_path is an escalation route, because the caller can prepend a
   schema and swap out the functions it calls.
--------------------------------------------------------------------------- */
create schema if not exists app;

create or replace function app.family_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.family_id from public.members m where m.user_id = auth.uid()
$$;

comment on function app.family_ids() is
  'The families the calling user belongs to. SECURITY DEFINER so the members policy does not recurse.';

/* The students the caller may touch. Same reasoning: one definition, used by
   every student-keyed table, so a new table cannot invent a looser rule. */
create or replace function app.student_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.id from public.students s where s.family_id in (select app.family_ids())
$$;

/* ---------------------------------------------------------------------------
   updated_at, kept honest by the database rather than by every caller
--------------------------------------------------------------------------- */
create or replace function app.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

do $$
declare t text;
begin
  foreach t in array array['students', 'progress', 'business', 'ledger'] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format('create trigger touch_%1$s before update on public.%1$s
                    for each row execute function app.touch_updated_at()', t);
  end loop;
end
$$;

/* ---------------------------------------------------------------------------
   Law 3: events are append-only, locked twice

   RLS grants only insert and select. But RLS is not the only way a row gets
   changed — a future migration running as owner, or a privilege grant someone
   adds in the dashboard, bypasses policies entirely. So the table itself
   refuses: the trigger fires for every caller, owner included.
--------------------------------------------------------------------------- */
create or replace function app.events_are_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'events is append-only (% attempted)', tg_op
    using hint = 'Facts are never edited or erased. Append a correcting fact instead.';
end
$$;

drop trigger if exists events_no_update on public.events;
create trigger events_no_update before update on public.events
  for each row execute function app.events_are_append_only();

drop trigger if exists events_no_delete on public.events;
create trigger events_no_delete before delete on public.events
  for each row execute function app.events_are_append_only();

/* ---------------------------------------------------------------------------
   Law 4: a family can only see itself

   FORCE as well as ENABLE. Plain `enable row level security` does not apply to
   the table's owner, and migrations and dashboard queries run as the owner, so
   a policy bug would hide behind a session that never evaluates policies.
--------------------------------------------------------------------------- */
alter table public.families  enable row level security;
alter table public.members   enable row level security;
alter table public.students  enable row level security;
alter table public.events    enable row level security;
alter table public.progress  enable row level security;
alter table public.business  enable row level security;
alter table public.ledger    enable row level security;

alter table public.families  force row level security;
alter table public.members   force row level security;
alter table public.students  force row level security;
alter table public.events    force row level security;
alter table public.progress  force row level security;
alter table public.business  force row level security;
alter table public.ledger    force row level security;

/* families — read and write your own. There is deliberately NO insert policy:
   a family is created through public.create_family() below, never by a bare
   insert. See the note on that function for why the obvious alternative does
   not work. */
drop policy if exists families_select on public.families;
create policy families_select on public.families for select to authenticated
  using (id in (select app.family_ids()));

drop policy if exists families_update on public.families;
create policy families_update on public.families for update to authenticated
  using (id in (select app.family_ids()))
  with check (id in (select app.family_ids()));

/* Signing up: the chicken and the egg.

   A brand new parent has no membership, so they cannot satisfy any membership-
   based insert policy on `families` — and the family they are trying to create
   is what would grant it. Two tempting answers both fail:

     - an open insert policy (`with check (true)`) plus an AFTER INSERT trigger
       that adds the creator as parent. The RLS tests rejected this: `insert …
       returning id` evaluates the SELECT policy against the new row BEFORE
       end-of-statement AFTER triggers fire, so the insert the client needs is
       refused even though the trigger would have made it legal a moment later.
       Worse, the open policy lets anyone create unclaimed families.
     - a BEFORE INSERT trigger. The family row does not exist yet, so the
       membership's foreign key has nothing to point at.

   So creation is a SECURITY DEFINER function instead: it makes the family and
   the membership in one statement, as one unit, and `families` needs no insert
   policy at all. Nothing can create a family it does not immediately own. */
create or replace function public.create_family(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  fid uuid;
begin
  if auth.uid() is null then
    raise exception 'not signed in' using hint = 'A family is created by its parent, never anonymously.';
  end if;
  insert into public.families (name) values (p_name) returning id into fid;
  insert into public.members (user_id, family_id, role) values (auth.uid(), fid, 'parent');
  return fid;
end
$$;

revoke all on function public.create_family(text) from public;

/* members — your family's roster, including the co-parent or tutor. Reads go
   through the definer helper rather than through members itself; see the note on
   app.family_ids(). Adding a member is restricted to families you are already
   in, so an invite cannot be used to join someone else's family. */
drop policy if exists members_select on public.members;
create policy members_select on public.members for select to authenticated
  using (family_id in (select app.family_ids()));

drop policy if exists members_insert on public.members;
create policy members_insert on public.members for insert to authenticated
  with check (family_id in (select app.family_ids()));

drop policy if exists members_delete on public.members;
create policy members_delete on public.members for delete to authenticated
  using (family_id in (select app.family_ids()));

/* students — the family's kids, all four verbs inside the family. */
drop policy if exists students_select on public.students;
create policy students_select on public.students for select to authenticated
  using (family_id in (select app.family_ids()));

drop policy if exists students_insert on public.students;
create policy students_insert on public.students for insert to authenticated
  with check (family_id in (select app.family_ids()));

drop policy if exists students_update on public.students;
create policy students_update on public.students for update to authenticated
  using (family_id in (select app.family_ids()))
  with check (family_id in (select app.family_ids()));

drop policy if exists students_delete on public.students;
create policy students_delete on public.students for delete to authenticated
  using (family_id in (select app.family_ids()));

/* events — insert and select, and deliberately nothing else (law 3). */
drop policy if exists events_select on public.events;
create policy events_select on public.events for select to authenticated
  using (student_id in (select app.student_ids()));

drop policy if exists events_insert on public.events;
create policy events_insert on public.events for insert to authenticated
  with check (student_id in (select app.student_ids()));

/* progress / business / ledger — the folds, read-write inside the family. */
drop policy if exists progress_all on public.progress;
create policy progress_all on public.progress for all to authenticated
  using (student_id in (select app.student_ids()))
  with check (student_id in (select app.student_ids()));

drop policy if exists business_all on public.business;
create policy business_all on public.business for all to authenticated
  using (student_id in (select app.student_ids()))
  with check (student_id in (select app.student_ids()));

drop policy if exists ledger_all on public.ledger;
create policy ledger_all on public.ledger for all to authenticated
  using (student_id in (select app.student_ids()))
  with check (student_id in (select app.student_ids()));

/* ---------------------------------------------------------------------------
   Privileges

   The anon role gets nothing: there is no unauthenticated read anywhere in this
   product. The authenticated role gets the verbs its policies allow and no
   others — on events, the missing update and delete grants are the second lock.
--------------------------------------------------------------------------- */
revoke all on all tables in schema public from anon, authenticated;
revoke all on schema app from anon, authenticated;

grant usage on schema public to authenticated;
grant usage on schema app to authenticated;
grant execute on function app.family_ids(), app.student_ids() to authenticated;
grant execute on function public.create_family(text) to authenticated;

/* No insert on families: create_family() is the only way in, and it is the
   definer that performs the insert. */
grant select, update on public.families to authenticated;
grant select, insert, update, delete on public.students,
  public.progress, public.business, public.ledger to authenticated;
grant select, insert, delete on public.members to authenticated;
grant select, insert on public.events to authenticated;
