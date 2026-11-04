// Copies Karla's generated clips from @kampus/ui into public/ so Vite serves them,
// exactly as sync-blobs does for the illustrations. Runs before dev/build; public/
// is generated, not committed. Absent voice/ is fine — the lesson falls back to
// speechSynthesis for any step without clips (docs/VOICE_PASS.md §2).
import { cpSync, mkdirSync, existsSync } from 'node:fs';

const src = new URL('../../../packages/ui/voice', import.meta.url).pathname;
const dest = new URL('../public/voice', import.meta.url).pathname;
if (!existsSync(src)) {
  console.log('no packages/ui/voice yet — skipping (speechSynthesis fallback applies)');
} else {
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log('synced voice → apps/web/public/voice');
}
