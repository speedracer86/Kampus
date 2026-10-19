/* @kampus/engine — the game's math brain, UI-free.
   Generators produce problems with teach steps; the adaptive layer picks tiers;
   the economy layer prices effort. Everything is pure: callers own all state. */
import './expansion.js';   // registers the Phase 1 generators into CURRICULUM
export { makeProblem, recordAnswer } from './adaptive.js';
export * from './economy.js';
export { GRADE_WORLDS, CURRICULUM, R } from './curriculum.js';
export { GEN } from './generators.js';
export { valOf, frH, sfrH, numLineSVG, fracBar, fmt } from './util.js';
export { toQuizQuestion } from './quiz-adapter.js';
