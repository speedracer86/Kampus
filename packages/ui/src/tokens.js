// Kampus design tokens — single source of truth.
//
// §0 pass (STYLE_GUIDE "0. Locked direction", 3b, 2026-10-19). §0 supersedes the
// earlier v2 "Modern" pass and the list in docs/DESIGN_TO_CODE_HANDOFF.md:
// blue-grey ground, one shadowless white sheet per screen, pills, and display
// numerals set in Inter Tight 300 tabular (Instrument Serif is retired).
// Legacy keys below are kept so the v1/legacy surfaces keep rendering; new work
// uses the §0 group.
export const color = {
  // --- §0 core ---
  ground: '#F5F7F9',          // page ground (blue-grey)
  surface: '#FFFFFF',         // the one white sheet per screen
  ink: '#23252B',
  inkHover: '#3A3D45',
  muted: 'rgba(35,37,43,.55)',      // text on ground
  mutedDeep: 'rgba(35,37,43,.60)',
  disabledText: 'rgba(35,37,43,.45)',
  navRule: 'rgba(35,37,43,.12)',    // 1.5px under the nav
  vRule: 'rgba(35,37,43,.14)',      // 1.5px vertical stat divider
  rule: '#EEECE7',                  // 1px in-sheet section rule
  fill: '#F5F7F9',                  // tiles/wells inside the sheet
  track: '#EEF1F4',                 // progress track
  locked: '#E6EAEE',                // locked / disabled solid fill
  todo: '#D9DEE4',                  // not-yet segments, toggle off

  // --- semantic accents ---
  green: '#58B372', greenHover: '#4AA263', greenDeep: '#2E7C46',
  greenTint: '#EAF6EE', savingTint: '#E3F3E6',
  gold: '#E8C94F', goldDeep: '#8A6D1C', held: '#FBF6E4',
  red: '#E4766C',             // wrong-answer ring/tint
  redTint: '#FBEDEC',
  loss: '#C2463B',            // money lost — distinct from the wrong-ring red
  lime: '#D9DE62', limeDeep: '#5B5E1F', limeBody: '#4A4D1E',

  // --- legacy (v1 app + older components; not for new §0 surfaces) ---
  textSecondary: '#5D5A52', textMuted: '#8A8578', textFaint: '#B5B0A4',
  border: '#E5E2DA', borderFaint: '#F1EEE6', trackOff: '#D8D4C9', fillHover: '#EEEBE3',
  onInkMuted: 'rgba(255,255,255,.72)', onInkTrack: 'rgba(255,255,255,.22)',
  goldMid: '#D9B96A', goldAlt: '#D9A93F', goldTint: '#FBF3E4', goldBorder: '#E8D9B8',
  orange: '#EE8A55', orangeDeep: '#7C4A1D', peach: '#F4BE93',
  glass: 'rgba(245,247,249,.8)', hairline: 'rgba(35,37,43,.08)',
  sidebar: '#EEF1F4',
};
export const glassBlur = 'saturate(1.8) blur(20px)';

// Passed grades deepen along one purple ramp (grade 3 -> 6); finishing grade 8
// earns `graduation`. Never world colors — §0.
export const gradePurple = ['#C7B8F0', '#B3A0EA', '#9E87E2', '#8A6FD9'];
export const graduation = '#6E4FCC';
export const purpleFor = (i) => gradePurple[Math.min(Math.max(i, 0), gradePurple.length - 1)];

/* The world string table — ONE source for every world name in the product
   (POLISH_TASKS Task 0). Keyed by worldId; colors are unchanged from §0, and the
   mascots are the ASSETS.md role assignments. Nothing anywhere should hard-code a
   world name: import `world` or call worldName(). */
export const world = {
  fractions: { id: 'fractions', topic: 'frac', color: '#F0AFCE', name: 'The Kitchen', blob: 'Ice_cream' },
  ratios: { id: 'ratios', topic: 'ratio', color: '#F4BE93', name: 'The Market', blob: 'Cash' },
  integers: { id: 'integers', topic: 'int', color: '#5E9FE0', name: 'Outside', blob: 'Rain' },
  equations: { id: 'equations', topic: 'alg', color: '#8F97DE', name: 'The Workshop', blob: 'Learning' },
};
/** Internal topic code -> worldId. Topic codes are not display names and never were. */
export const WORLD_BY_TOPIC = Object.fromEntries(Object.values(world).map(w => [w.topic, w]));
export const worldName = (idOrTopic) =>
  (world[idOrTopic] || WORLD_BY_TOPIC[idOrTopic] || {}).name || '';
export const worldTint = (c, pct = 24) => `color-mix(in oklab, ${c} ${pct}%, white)`;

// Inter Tight is the app font. IBM Plex Mono is the ONLY exception, and only on
// the Rewards receipt (§0).
export const font = {
  family: "'Inter Tight', sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
};
export const type = {
  // §0 display numerals: light, tight, tabular so columns of money line up.
  numeral: { fontWeight: 300, letterSpacing: '-.045em', fontVariantNumeric: 'tabular-nums' },
  display: { fontSize: 52, fontWeight: 600, letterSpacing: '-.03em', lineHeight: 1.02 },
  h1: { fontSize: 44, fontWeight: 700, letterSpacing: '-.03em', lineHeight: 1.05 },
  greeting: { fontSize: 32, fontWeight: 600, letterSpacing: '-.025em', lineHeight: 1.32 },
  cardTitle: { fontSize: 20, fontWeight: 600, letterSpacing: '-.02em' },
  body: { fontSize: 16, fontWeight: 400, lineHeight: 1.5 },
  label: { fontSize: 14.5, fontWeight: 700 },
  kicker: { fontSize: 11, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase' },
  meta: { fontSize: 12.5, fontWeight: 600 },
};
// numeral(size, weight?) — the §0 display-numeral style at a given size.
export const numeral = (fontSize, fontWeight = 300) => ({ ...type.numeral, fontSize, fontWeight, lineHeight: 1 });

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, full: 999, sheet: 28, gradeCard: 20, dayCell: 16 };
export const shadow = {
  sheet: 'none',              // §0: the white sheet has no shadow and no border
  card: '0 1px 2px rgba(35,37,43,.04), 0 8px 24px rgba(35,37,43,.06)',
  float: '0 2px 6px rgba(35,37,43,.06), 0 16px 40px rgba(35,37,43,.12)',
  btn: '0 1px 2px rgba(35,37,43,.08), 0 4px 12px rgba(35,37,43,.10)',
  // Grade-stack edges: cards overlap, so each needs a top highlight + hairline.
  stackTop: 'inset 0 .75px 0 rgba(255,255,255,.55)',
  stackTopGold: 'inset 0 .5px 0 rgba(255,255,255,.4)',
  stackEdge: '0 -.5px 0 rgba(35,37,43,.10), 0 -6px 16px rgba(35,37,43,.06)',
};
export const spring = 'cubic-bezier(.32,.72,.33,1)';
export const motion = {
  bar: `width .5s ${spring}`, fade: 'opacity .3s', knob: `left .25s ${spring}`,
  lift: `transform .25s ${spring}, box-shadow .25s ${spring}, background .2s`,
  grade: `padding .25s ${spring}`,
};
// §0 desktop frame: two columns, generous gutter.
export const layout = { col: 340, gap: 48, pad: 48, sheetPad: 32 };

// Grade-band sizing: band(grade) -> sizes for Play AND Home surfaces.
// The age dial: younger grades get big friendly illustration and saturated
// tints; grades 7-8 get the same world rendered smaller and cooler so a
// pre-teen never feels the app is for little kids.
export const band = (g) => g <= 4
  ? { mascot: 124, question: 58, answer: 26, pad: 24, title: 46, wellH: 150, wellBlob: 96, tint: 24, jumpBlob: 84, standBlob: 96, standFlood: true }
  : g <= 6
    ? { mascot: 92, question: 50, answer: 22, pad: 20, title: 42, wellH: 118, wellBlob: 68, tint: 15, jumpBlob: 64, standBlob: 64, standFlood: true }
    : { mascot: 60, question: 44, answer: 20, pad: 16, title: 36, wellH: 92, wellBlob: 48, tint: 9, jumpBlob: 48, standBlob: 44, standFlood: false };
export const streakColors = { STARTER: '#8A8578', INTERN: '#8F97DE', PRO: '#D9A93F', MANAGER: '#58B372', BOSS: '#EE8A55', CEO: '#5E9FE0', LEGEND: '#8F97DE' };
export const confetti = ['#8F97DE', '#F4BE93', '#7CBF8B', '#F0AFCE', '#5E9FE0', '#D9DE62'];

// §0: Kredits and real money both render with a leading $.
export const money = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
export const signed = (n) => `${n < 0 ? '−' : '+'}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
// Real rewards are integer cents and always show two decimals (§0 Rewards).
export const dollars = (cents) => `$${(cents / 100).toFixed(2)}`;
