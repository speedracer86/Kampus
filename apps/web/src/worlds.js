/* The app's per-topic view of the worlds. Names, colors and mascots all come from
   the one string table in @kampus/ui/tokens (POLISH_TASKS Task 0) — this file maps
   them onto the engine's internal topic codes and nothing more. */
import { world, WORLD_BY_TOPIC } from '@kampus/ui/tokens';

export const TOPIC_ORDER = ['frac', 'ratio', 'int', 'alg'];

export const WORLDS = Object.fromEntries(
  TOPIC_ORDER.map(topic => {
    const w = WORLD_BY_TOPIC[topic];
    return [topic, { id: w.id, name: w.name, color: w.color, blob: w.blob }];
  }),
);

export { world as WORLD_TABLE };
