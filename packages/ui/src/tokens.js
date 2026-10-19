// Kampus design tokens — single source of truth, mirrors docs/STYLE_GUIDE.md
// v2 "Modern" pass (owner-directed, Oct 2026): Apple-style depth and shape —
// larger continuous radii, layered soft shadows, frosted surfaces, springy
// motion — while keeping the warm palette, Inter Tight, and the blob world.
export const color = {
  ground: '#F7F5F1', surface: '#FFFFFF', ink: '#23252B', inkHover: '#3A3D45',
  textSecondary: '#5D5A52', textMuted: '#8A8578', textFaint: '#B5B0A4',
  border: '#E5E2DA', borderFaint: '#F1EEE6', track: '#ECE9E1', trackOff: '#D8D4C9', fillHover: '#EEEBE3',
  onInkMuted: 'rgba(255,255,255,.72)', onInkTrack: 'rgba(255,255,255,.22)',
  green: '#58B372', greenHover: '#4AA263', greenDeep: '#2E7C46', greenTint: '#EAF6EE',
  gold: '#E8C94F', goldDeep: '#A8862A', goldMid: '#D9B96A', goldAlt: '#D9A93F', goldTint: '#FBF3E4', goldBorder: '#E8D9B8',
  red: '#E4766C', redTint: '#FBEDEC',
  lime: '#D9DE62', limeDeep: '#5B5E1F', limeBody: '#4A4D1E',
  orange: '#EE8A55', orangeDeep: '#7C4A1D', peach: '#F4BE93',
  // frosted chrome (nav, floating bars)
  glass: 'rgba(252,251,248,.78)', hairline: 'rgba(35,37,43,.08)',
};
export const glassBlur = 'saturate(1.8) blur(20px)';
export const world = {
  fractions: { color: '#F0AFCE', name: 'Fraction Factory', blob: 'Ice_cream' },
  trade: { color: '#F4BE93', name: 'Trade Tycoon', blob: 'Cash' },
  weather: { color: '#5E9FE0', name: 'Weather Station', blob: 'Rain' },
  equations: { color: '#8F97DE', name: 'Equation Lab', blob: 'Learning' },
};
export const worldTint = (c) => `color-mix(in oklab, ${c} 24%, white)`;
export const font = { family: "'Inter Tight', sans-serif" };
export const type = {
  display: { fontSize: 52, fontWeight: 800, letterSpacing: '-.035em', lineHeight: 1.02 },
  h1: { fontSize: 44, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.05 },
  cardTitle: { fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' },
  body: { fontSize: 16, fontWeight: 400, lineHeight: 1.5 },
  label: { fontSize: 14.5, fontWeight: 700 },
  kicker: { fontSize: 11.5, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase' },
  meta: { fontSize: 12.5, fontWeight: 600 },
};
export const radius = { sm: 10, md: 14, lg: 20, full: 999 };
export const shadow = {
  card: '0 1px 2px rgba(35,37,43,.04), 0 8px 24px rgba(35,37,43,.06)',
  float: '0 2px 6px rgba(35,37,43,.06), 0 16px 40px rgba(35,37,43,.12)',
  btn: '0 1px 2px rgba(35,37,43,.08), 0 4px 12px rgba(35,37,43,.10)',
};
export const spring = 'cubic-bezier(.32,.72,.33,1)';
export const motion = {
  bar: `width .5s ${spring}`, fade: 'opacity .3s', knob: `left .25s ${spring}`,
  lift: `transform .25s ${spring}, box-shadow .25s ${spring}, background .2s`,
};
// Grade-band sizing for Play surfaces: band(grade) -> sizes
export const band = (g) => g <= 4 ? { mascot: 132, question: 62, answer: 26, pad: 24 }
  : g <= 6 ? { mascot: 100, question: 54, answer: 22, pad: 20 }
  : { mascot: 76, question: 46, answer: 20, pad: 16 };
export const streakColors = { STARTER: '#8A8578', INTERN: '#8F97DE', PRO: '#D9A93F', MANAGER: '#58B372', BOSS: '#EE8A55', CEO: '#5E9FE0', LEGEND: '#8F97DE' };
export const confetti = ['#8F97DE', '#F4BE93', '#7CBF8B', '#F0AFCE', '#5E9FE0', '#D9DE62'];
