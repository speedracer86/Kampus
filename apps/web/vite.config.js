import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/* The repo-root .env, read here because Vite only picks up .env files in the
   app's own directory and the owner keeps one file for the whole project.
   Only the three keys below are exposed, by name, so nothing else in that file
   can reach a bundle by accident — the ElevenLabs key lives there too.

   The Supabase publishable key is PUBLIC by design: it identifies the project
   and carries no authority of its own, because every table is behind RLS. The
   service-role key is not in .env at all and must never be in a browser. */
const ROOT_ENV = fileURLToPath(new URL('../../.env', import.meta.url));
function rootEnv() {
  if (!existsSync(ROOT_ENV)) return {};
  const out = {};
  for (const line of readFileSync(ROOT_ENV, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = rootEnv();
const expose = {
  'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL ?? env.SUPABASE_URL ?? ''),
  'import.meta.env.VITE_SUPABASE_KEY': JSON.stringify(
    process.env.VITE_SUPABASE_KEY ?? env.SUPABASE_PUBLISHABLE_KEY ?? env.SUPABASE_ANON_KEY ?? ''),
  // Sync is OFF unless asked for. Off, the app is byte-identical to the one
  // that shipped before any of this existed.
  'import.meta.env.VITE_SYNC': JSON.stringify(process.env.VITE_SYNC ?? env.VITE_SYNC ?? 'off'),
};

export default defineConfig({
  define: expose,
  plugins: [react()],
  esbuild: {
    // The @kampus/ui library uses React.* globals without importing (its zero-dependency
    // contract); inject the import at build time rather than editing library files.
    jsxInject: `import React from 'react'`,
    // The engine's skill index resolves generators by fn.name; minification renames
    // functions, which silently emptied every lesson in production builds. keepNames
    // preserves runtime .name through the minifier. Do not remove.
    keepNames: true,
  },
});
