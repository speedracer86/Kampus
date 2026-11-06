/* Row-level security, asserted against a real Postgres.

   The work order's law 4: "a policy bug here is the one class of bug that cannot
   ship even once. Write the RLS tests first." So these are written before the
   client ever talks to Supabase, and they run against an actual database with the
   actual policy SQL — not against a mock, and not by reading the migration back.

   How the caller is simulated: supabase/test/auth-shim.sql defines auth.uid() the
   way Supabase defines it, off the `request.jwt.claims` setting that PostgREST
   hands Postgres. `set local request.jwt.claims` plus `set local role
   authenticated` is therefore the same input the live policies see — the request
   arrives as the authenticated role carrying a `sub`, and nothing else.

   Seeding runs as the connecting superuser, which bypasses RLS by design; every
   assertion switches role first. Tables are FORCE row level security precisely so
   that the owner cannot be the hole in that.

   Usage: node tests/test_rls.mjs
     DATABASE_URL=postgres://…   an existing server (CI uses a service container)
     otherwise: the local default socket, and failing that a throwaway cluster
     this script initdbs, starts, and removes. */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

/* ---- find a server ---------------------------------------------------------- */
const DB = `kampus_rls_${process.pid}`;
const PORT = 55432;
let base = null;          // connection args WITHOUT a database
let url = null;           // or a connection URL, if one was handed to us
let cluster = null;
const canConnect = (args) =>
  spawnSync('psql', [...args, '-At', '-c', 'select 1'], { encoding: 'utf8' }).status === 0;

if (process.env.DATABASE_URL) url = process.env.DATABASE_URL;
else if (canConnect(['-d', 'postgres'])) base = [];                 // the local default
else {
  // No server to borrow: build one, use it, delete it. Keeps the test runnable on
  // a machine with only the Postgres binaries installed.
  cluster = mkdtempSync(path.join(tmpdir(), 'kampus-pg-'));
  const data = path.join(cluster, 'data');
  const sock = path.join(cluster, 'sock');
  execFileSync('initdb', ['-D', data, '-U', 'postgres', '--auth=trust'], { stdio: 'pipe' });
  execFileSync('mkdir', ['-p', sock]);
  execFileSync('pg_ctl', ['-D', data, '-o', `-k ${sock} -p ${PORT} -c listen_addresses=`, '-w', 'start'], { stdio: 'pipe' });
  base = ['-h', sock, '-p', String(PORT), '-U', 'postgres'];
}

/* Connection args for a named database. Kept as one function because splicing a
   database into a flag array by position is how the first version of this file
   told psql that "kampus_rls_96329" was a ROLE. */
const at = (db) => (url ? [url.replace(/\/[^/?]*(\?|$)/, `/${db}$1`)] : [...base, '-d', db]);
const adminConn = at('postgres');
const dbConn = () => at(DB);

/** Run SQL, optionally as the authenticated role carrying a JWT subject. */
function sql(text, { uid, role } = {}) {
  const pre = [];
  // Claims first, role second: setting the GUC happens as the connecting user.
  if (uid !== undefined) pre.push(`set local request.jwt.claims = '{"sub":"${uid}"}'`);
  if (role) pre.push(`set local role ${role}`);
  const body = pre.length ? `begin; ${pre.join('; ')}; ${text}; commit;` : text;
  // -q matters: without it psql echoes BEGIN / SET / COMMIT as output lines and
  // every row count below is read off a command tag instead of a row.
  const r = spawnSync('psql', [...dbConn(), '-Atq', '-v', 'ON_ERROR_STOP=1', '-c', body], { encoding: 'utf8' });
  if (r.status !== 0) {
    const e = new Error((r.stderr || '').trim().split('\n').pop() || 'psql failed');
    e.stderr = (r.stderr || '').trim();
    throw e;
  }
  return r.stdout.trim().split('\n').filter(Boolean);
}

/** Expect SQL to be REFUSED, and say what refused it. */
function refused(name, text, opts, expect = /row-level security|permission denied|append-only/) {
  try {
    sql(text, opts);
    check(name, false, 'it was ALLOWED');
  } catch (e) {
    check(name, expect.test(e.stderr || e.message), (e.stderr || e.message).slice(0, 110));
  }
}

const ids = {
  uA: '11111111-1111-1111-1111-111111111111',   // parent of family A
  uB: '22222222-2222-2222-2222-222222222222',   // parent of family B
  uT: '33333333-3333-3333-3333-333333333333',   // a tutor, added to A later
  uX: '44444444-4444-4444-4444-444444444444',   // signed in, belongs to nobody
  fA: 'aaaaaaaa-0000-0000-0000-000000000001',
  fB: 'bbbbbbbb-0000-0000-0000-000000000001',
  sA: 'aaaaaaaa-0000-0000-0000-000000000002',   // Ada, family A
  sB: 'bbbbbbbb-0000-0000-0000-000000000002',   // Ben, family B
  cA: 'aaaaaaaa-0000-0000-0000-000000000003',   // an event's client_id
  cB: 'bbbbbbbb-0000-0000-0000-000000000003',
};

try {
  execFileSync('psql', [...adminConn, '-q', '-c', `create database ${DB}`], { stdio: 'pipe' });
  // Every migration, in order — not just the first. A schema is the sum of its
  // migrations, and a suite that only applies 0001 tests a database nobody runs.
  const migrations = readdirSync(path.join(ROOT, 'supabase/migrations'))
    .filter(f => f.endsWith('.sql')).sort()
    .map(f => `supabase/migrations/${f}`);
  for (const f of ['supabase/test/auth-shim.sql', ...migrations]) {
    // Report psql's own message rather than node's buffer dump: a migration that
    // does not apply should say which line, not print 200 bytes as integers.
    // Warnings only: a fresh database reports every `drop … if exists` as a
    // NOTICE, which buries anything that actually matters.
    const r = spawnSync('psql', [...dbConn(), '-q', '-v', 'ON_ERROR_STOP=1',
      '--set=client_min_messages=warning', '-f', path.join(ROOT, f)], { encoding: 'utf8' });
    if (r.status !== 0) {
      check(`${f} applies cleanly`, false, (r.stderr || '').trim().split('\n')[0]);
      throw new Error(`could not apply ${f}`);
    }
  }
  check('every migration applies cleanly to an empty database', true, migrations.map(m => m.split('/').pop()).join(' + '));

  /* ---- seed two families, as the superuser (RLS bypassed by design) ---- */
  sql(`
    insert into auth.users (id, email) values
      ('${ids.uA}','a@example.com'), ('${ids.uB}','b@example.com'),
      ('${ids.uT}','t@example.com'), ('${ids.uX}','x@example.com');
    insert into public.families (id, name) values ('${ids.fA}','Family A'), ('${ids.fB}','Family B');
    insert into public.members (user_id, family_id, role) values
      ('${ids.uA}','${ids.fA}','parent'), ('${ids.uB}','${ids.fB}','parent');
    insert into public.students (id, family_id, display_name, grade) values
      ('${ids.sA}','${ids.fA}','Ada',4), ('${ids.sB}','${ids.fB}','Ben',6);
    insert into public.events (student_id, client_id, type, payload) values
      ('${ids.sA}','${ids.cA}','lesson_done','{"move":"prove"}'),
      ('${ids.sB}','${ids.cB}','lesson_done','{"move":"prove"}');
    insert into public.progress (student_id, skill, tier) values ('${ids.sA}','eqFrac',2), ('${ids.sB}','unitRate',3);
    insert into public.business (student_id, state) values ('${ids.sA}','{"cash":120}'), ('${ids.sB}','{"cash":90}');
    insert into public.ledger (student_id, cents, reason) values ('${ids.sA}',50,'lesson'), ('${ids.sB}',50,'lesson');
  `);

  /* ---- a family sees itself ---- */
  const asA = { uid: ids.uA, role: 'authenticated' };
  const asB = { uid: ids.uB, role: 'authenticated' };

  check('a parent sees their own family', sql('select name from public.families', asA).join() === 'Family A',
    sql('select name from public.families', asA).join() || 'nothing');
  check('and their own kid', sql('select display_name from public.students', asA).join() === 'Ada',
    sql('select display_name from public.students', asA).join() || 'nothing');
  check('reading the roster does not recurse (the members policy trap)',
    sql('select count(*) from public.members', asA)[0] === '1', sql('select count(*) from public.members', asA)[0]);

  /* ---- and nothing of anyone else's. The law, table by table ---- */
  for (const [table, col] of [['families', 'name'], ['students', 'display_name'], ['events', 'type'],
    ['progress', 'skill'], ['business', 'state'], ['ledger', 'reason'], ['members', 'role']]) {
    const rowsA = sql(`select count(*) from public.${table}`, asA)[0];
    const rowsB = sql(`select count(*) from public.${table}`, asB)[0];
    const total = sql(`select count(*) from public.${table}`)[0];
    check(`${table}: each family sees only its own rows`,
      rowsA === '1' && rowsB === '1' && total === '2', `A ${rowsA}, B ${rowsB}, really ${total}`);
    void col;
  }

  check('a signed-in user who belongs to no family sees nothing at all',
    ['families', 'students', 'events', 'progress', 'business', 'ledger', 'members']
      .every(t => sql(`select count(*) from public.${t}`, { uid: ids.uX, role: 'authenticated' })[0] === '0'),
    'all seven tables');

  /* ---- nor can they write into it ---- */
  refused('a parent cannot add a kid to another family',
    `insert into public.students (family_id, display_name, grade) values ('${ids.fB}','Smuggled',5)`, asA);
  refused('a parent cannot log an event against another family\'s kid',
    `insert into public.events (student_id, client_id, type) values ('${ids.sB}','${ids.uX}','forged')`, asA);
  refused('a parent cannot write another family\'s ledger',
    `insert into public.ledger (student_id, cents, reason) values ('${ids.sB}',9999,'forged')`, asA);
  refused('a parent cannot join a family they are not in',
    `insert into public.members (user_id, family_id) values ('${ids.uA}','${ids.fB}')`, asA);

  // An UPDATE that matches no visible row is not an error — it silently changes
  // nothing. That silence is the point: assert the row is untouched.
  sql(`update public.students set display_name = 'Taken' where id = '${ids.sB}'`, asA);
  check('a parent cannot rename another family\'s kid',
    sql(`select display_name from public.students where id = '${ids.sB}'`)[0] === 'Ben',
    sql(`select display_name from public.students where id = '${ids.sB}'`)[0]);

  sql(`delete from public.students where id = '${ids.sB}'`, asA);
  check('a parent cannot delete another family\'s kid',
    sql(`select count(*) from public.students where id = '${ids.sB}'`)[0] === '1');

  sql(`update public.ledger set status = 'approved' where student_id = '${ids.sB}'`, asA);
  check('a parent cannot approve another family\'s money',
    sql(`select status from public.ledger where student_id = '${ids.sB}'`)[0] === 'pending',
    sql(`select status from public.ledger where student_id = '${ids.sB}'`)[0]);

  /* ---- law 3: events are append-only, for everyone ---- */
  refused('a parent cannot edit her OWN kid\'s events',
    `update public.events set type = 'edited' where student_id = '${ids.sA}'`, asA);
  refused('nor delete them',
    `delete from public.events where student_id = '${ids.sA}'`, asA);
  refused('and the superuser cannot either — the log is a log',
    `update public.events set type = 'edited' where student_id = '${ids.sA}'`, {}, /append-only/);
  check('no update or delete policy exists on events at all',
    sql(`select count(*) from pg_policies where tablename = 'events' and cmd in ('UPDATE','DELETE')`)[0] === '0');
  check('and the privileges are not granted either',
    sql(`select count(*) from information_schema.role_table_grants
         where table_name = 'events' and grantee = 'authenticated'
           and privilege_type in ('UPDATE','DELETE')`)[0] === '0');

  /* ---- law 2: a replayed offline queue must not double-count ---- */
  sql(`insert into public.events (student_id, client_id, type) values ('${ids.sA}','${ids.cA}','lesson_done')
       on conflict (student_id, client_id) do nothing`, asA);
  check('a queued event that flushes twice is stored once',
    sql(`select count(*) from public.events where student_id = '${ids.sA}'`)[0] === '1',
    `${sql(`select count(*) from public.events where student_id = '${ids.sA}'`)[0]} rows after a replay`);
  sql(`insert into public.events (student_id, client_id, type) values ('${ids.sA}','${ids.uX}','answer')`, asA);
  check('but a genuinely new event still appends',
    sql(`select count(*) from public.events where student_id = '${ids.sA}'`)[0] === '2');
  check('and two different kids may carry the same client id',
    (() => {
      sql(`insert into public.events (student_id, client_id, type) values ('${ids.sB}','${ids.cA}','lesson_done')`, asB);
      return sql(`select count(*) from public.events where client_id = '${ids.cA}'`)[0] === '2';
    })());

  /* ---- law 1: there is nowhere to put a child credential ---- */
  check('the students table has no email, password or auth identity',
    sql(`select count(*) from information_schema.columns where table_name = 'students'
         and (column_name like '%email%' or column_name like '%password%' or column_name = 'user_id')`)[0] === '0');
  check('and no foreign key from a student into auth.users',
    sql(`select count(*) from information_schema.table_constraints tc
         join information_schema.constraint_column_usage ccu using (constraint_name)
         where tc.table_name = 'students' and tc.constraint_type = 'FOREIGN KEY'
           and ccu.table_schema = 'auth'`)[0] === '0');

  /* ---- signing up: the family you create is yours, immediately ---- */
  const newFam = sql(`select public.create_family('Family X')`, { uid: ids.uX, role: 'authenticated' })[0];
  check('creating a family makes you its parent in the same statement',
    sql(`select role from public.members where family_id = '${newFam}'`)[0] === 'parent',
    sql(`select user_id || ' ' || role from public.members where family_id = '${newFam}'`)[0] || 'no member');
  check('and the new parent can now see it',
    sql(`select name from public.families`, { uid: ids.uX, role: 'authenticated' }).join() === 'Family X');
  refused('a family cannot be created any other way — no bare insert',
    `insert into public.families (name) values ('Orphan')`, { uid: ids.uX, role: 'authenticated' },
    /permission denied|row-level security/);
  refused('and not anonymously at all',
    `select public.create_family('Anon')`, { role: 'anon' }, /permission denied|not signed in/);
  check('no orphan family was left behind by either attempt',
    sql(`select count(*) from public.families where name in ('Orphan','Anon')`)[0] === '0');

  /* ---- a tutor is another adult on the same family, not a new tenant ---- */
  sql(`insert into public.members (user_id, family_id, role) values ('${ids.uT}','${ids.fA}','tutor')`, asA);
  check('a tutor added to a family sees that family\'s kid',
    sql('select display_name from public.students', { uid: ids.uT, role: 'authenticated' }).join() === 'Ada');
  check('and still sees nothing of the other family',
    sql('select count(*) from public.students', { uid: ids.uT, role: 'authenticated' })[0] === '1');

  /* ---- anon reaches nothing ---- */
  refused('the anon role cannot read students at all',
    'select count(*) from public.students', { role: 'anon' }, /permission denied/);
  refused('nor events', 'select count(*) from public.events', { role: 'anon' }, /permission denied/);

  /* Erasure stays possible (0002). A parent can ask for their child's data to
     be removed; the first version of the trigger refused the cascade and made
     that impossible without dropping the trigger in production. An ordinary
     delete is still refused — only a session that has SAID it is erasing may. */
  refused('an ordinary delete is still refused, even for the owner',
    `delete from public.events where student_id = '${ids.sA}'`, {}, /append-only/);
  sql(`set local app.erasing = 'on'; delete from public.events where student_id = '${ids.sB}'`);
  check('a session that declares it is erasing may remove a subject\'s facts',
    sql(`select count(*) from public.events where student_id = '${ids.sB}'`)[0] === '0');
  refused('but editing a fact is refused even while erasing',
    `set local app.erasing = 'on'; update public.events set type = 'edited' where student_id = '${ids.sA}'`,
    {}, /append-only/);
  check('deleting a family cascades now, instead of failing on its events',
    (() => {
      sql(`set local app.erasing = 'on'; delete from public.families where id = '${ids.fB}'`);
      return sql(`select count(*) from public.families where id = '${ids.fB}'`)[0] === '0';
    })());

  /* ---- the guard against the NEXT table ---- */
  const unguarded = sql(`select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
      and (not c.relrowsecurity or not c.relforcerowsecurity)`);
  check('every table in public has RLS enabled AND forced',
    unguarded.length === 0, unguarded.join(', ') || 'all seven');
  const policyless = sql(`select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
      and not exists (select 1 from pg_policies p where p.tablename = c.relname)`);
  check('and at least one policy, so RLS on never means "deny everything"',
    policyless.length === 0, policyless.join(', ') || 'all seven');
  /* Every SECURITY DEFINER function, in app AND public, must pin its search_path:
     a definer with a mutable path lets the caller prepend a schema and swap out
     the functions it calls. Postgres stores the setting as `search_path=""`, so
     this matches a prefix — the first version compared for exact equality with
     `search_path=`, found nothing, and reported all three as unpinned. */
  const unpinned = sql(`select n.nspname || '.' || p.proname
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('app', 'public') and p.prosecdef
      and not exists (select 1 from unnest(coalesce(p.proconfig, '{}'::text[])) c
                      where c like 'search_path=%')`);
  check('every security-definer function pins its search_path',
    unpinned.length === 0, unpinned.join(', ') || 'app.family_ids, app.student_ids, public.create_family');
  check('and there are no definer functions nobody knows about',
    sql(`select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname in ('app', 'public') and p.prosecdef`)[0] === '3');
} finally {
  try { execFileSync('psql', [...adminConn, '-q', '-c', `drop database if exists ${DB} with (force)`], { stdio: 'pipe' }); } catch { /* best effort */ }
  if (cluster) {
    try { execFileSync('pg_ctl', ['-D', path.join(cluster, 'data'), '-w', '-m', 'immediate', 'stop'], { stdio: 'pipe' }); } catch { /* going away anyway */ }
    rmSync(cluster, { recursive: true, force: true });
  }
}

const failed = results.filter(r => !r.ok);
console.log(`\nRLS: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) { console.error('FAILED:', failed.map(f => f.name).join(', ')); process.exit(1); }
void writeFileSync;
