/* The Supabase seam: the only module that knows a server exists.
 *
 * store.js calls into here; nothing else does. That boundary is the point —
 * when the flag is off, or the project is not configured, every function below
 * answers "no" and the app is the local-only one that shipped before.
 *
 * WHAT IS PUBLIC AND WHAT IS NOT. The publishable key ships in the bundle, and
 * that is correct: it identifies the project and carries no authority, because
 * every table is behind row-level security keyed on the caller's family. The
 * service-role key bypasses RLS and is not in .env at all — it belongs to
 * server-side jobs, never to a browser.
 *
 * COPPA SHAPE (docs/SUPABASE_WORK_ORDER.md law 1). Only the PARENT ever
 * authenticates. A child has no email, no password and no auth identity; she is
 * a row her family owns, reached through the parent's session. Nothing here
 * takes a child's credential because there is nowhere to put one.
 */
import { createClient } from '@supabase/supabase-js';

const URL_ = import.meta.env?.VITE_SUPABASE_URL || '';
const KEY_ = import.meta.env?.VITE_SUPABASE_KEY || '';

/** Sync is opt-in. Off, this module does nothing at all. */
export const SYNC_ON = (import.meta.env?.VITE_SYNC || 'off') === 'on' && !!URL_ && !!KEY_;

let _client = null;
/** The client, or null when sync is off or unconfigured. Callers must handle null. */
export function client() {
  if (!SYNC_ON) return null;
  if (!_client) {
    _client = createClient(URL_, KEY_, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return _client;
}

/* ---- auth: the parent, by magic link ------------------------------------- */

/**
 * Send a sign-in link. The screen that collects the email already says "Check
 * your email", so the only thing that changes is that an email now arrives.
 * @returns {Promise<{ok: boolean, why?: string}>} never throws
 */
export async function sendMagicLink(email) {
  const sb = client();
  if (!sb) return { ok: false, why: 'sync-off' };
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: globalThis.location?.origin || undefined },
  });
  return error ? { ok: false, why: error.message } : { ok: true };
}

/** The signed-in parent, or null. Never throws. */
export async function currentUser() {
  const sb = client();
  if (!sb) return null;
  try { const { data } = await sb.auth.getUser(); return data?.user || null; } catch { return null; }
}

/** Subscribe to sign-in/sign-out. Returns an unsubscribe. */
export function onAuth(fn) {
  const sb = client();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((_e, session) => fn(session?.user || null));
  return () => data?.subscription?.unsubscribe?.();
}

/** Sign out. Lives in Grown-ups; the kid's PIN is a different boundary entirely. */
export async function signOut() {
  const sb = client();
  if (!sb) return;
  try { await sb.auth.signOut(); } catch { /* already gone */ }
}

/* ---- the family, and the students in it ---------------------------------- */

/**
 * The caller's family id, creating one on first sign-in.
 *
 * Creation goes through the create_family() function rather than an insert:
 * `families` has no insert policy, because a brand new parent has no membership
 * and the family is what would grant it (see supabase/migrations/0001_init.sql).
 */
export async function ensureFamily(name = 'My family') {
  const sb = client();
  if (!sb) return null;
  const { data: mine, error } = await sb.from('families').select('id').limit(1);
  if (error) return null;
  if (mine?.length) return mine[0].id;
  const { data, error: e2 } = await sb.rpc('create_family', { p_name: name });
  return e2 ? null : data;
}

/** Every student the family owns, newest state included. */
export async function pullStudents() {
  const sb = client();
  if (!sb) return null;
  const { data, error } = await sb.from('students')
    .select('id, display_name, grade, pin_hash, settings, state, updated_at')
    .order('created_at', { ascending: true });
  return error ? null : data;
}

/**
 * Write one student's row. `remoteId` null creates it.
 * Last-writer-wins per student, which is the work order's conflict rule for
 * everything except events and the ledger.
 */
export async function pushStudent(familyId, remoteId, row) {
  const sb = client();
  if (!sb || !familyId) return null;
  if (remoteId) {
    const { error } = await sb.from('students').update(row).eq('id', remoteId);
    return error ? null : remoteId;
  }
  const { data, error } = await sb.from('students')
    .insert({ family_id: familyId, ...row }).select('id').single();
  return error ? null : data.id;
}

/* ---- the log ------------------------------------------------------------- */

/**
 * Append facts. `client_id` is generated on the device, and the insert ignores
 * conflicts, so a queue that flushes twice — the network died, the retry fired,
 * both arrived — stores each fact once. Without it the pilot report
 * double-counts and the ledger double-pays, silently (law 2).
 */
export async function pushEvents(remoteStudentId, rows) {
  const sb = client();
  if (!sb || !remoteStudentId || !rows?.length) return 0;
  const { error } = await sb.from('events')
    .upsert(rows.map(r => ({
      student_id: remoteStudentId,
      client_id: r.client_id,
      type: r.type,
      payload: r.payload || {},
      created_at: r.created_at,
    })), { onConflict: 'student_id,client_id', ignoreDuplicates: true });
  return error ? 0 : rows.length;
}

/** The whole log for one student, oldest first. The report reads this, never a blob. */
export async function pullEvents(remoteStudentId) {
  const sb = client();
  if (!sb || !remoteStudentId) return null;
  const { data, error } = await sb.from('events')
    .select('client_id, type, payload, created_at')
    .eq('student_id', remoteStudentId)
    .order('created_at', { ascending: true });
  return error ? null : data;
}
