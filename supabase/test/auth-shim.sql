/* What Supabase provides and a bare Postgres does not.

   TEST-ONLY. This file is never applied to the real project — Supabase already
   has the auth schema, auth.users, auth.uid() and the anon/authenticated roles,
   and 0001_init.sql is written against those. The shim exists so the RLS tests
   can run against a throwaway cluster on any machine and in CI, because an RLS
   test that needs a cloud project is an RLS test nobody runs, and law 4 says a
   policy bug here is the one class of bug that cannot ship even once.

   auth.uid() is reproduced the way Supabase defines it: the `sub` claim of the
   JWT, handed to Postgres by PostgREST as the `request.jwt.claims` setting. So
   `set local request.jwt.claims` in a test is the same input the real policies
   see in production, not an approximation of it. */
create schema if not exists auth;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
end
$$;

create table if not exists auth.users (
  id     uuid primary key default gen_random_uuid(),
  email  text unique
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid
$$;

grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
