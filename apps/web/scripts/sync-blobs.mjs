// Copies the illustration pack from @kampus/ui into public/ so Vite serves it.
// Runs automatically before dev/build; public/ is generated, not committed.
import { cpSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const src = new URL('../../../packages/ui/blobs', import.meta.url).pathname;
const dest = new URL('../public/blobs', import.meta.url).pathname;
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log('synced blobs → apps/web/public/blobs');
