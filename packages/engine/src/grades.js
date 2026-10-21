/* Grade stack semantics (AUDIT B5, POLISH_TASKS Task 3, §0b).

   The distinction that matters: a grade BELOW her placement that she never sat a
   test for is `placed`, not `passed` and emphatically not `locked`. A kid placed in
   grade 7 was reading "Grade 3 — Locked", which says she is barred from work she is
   years past. Placed grades are hers to revisit; locked grades are ahead of her.

   Pure: the caller owns placement and results. */

export const GRADE_STATES = ['placed', 'passed', 'current', 'locked', 'graduation'];
export const GRADES = [3, 4, 5, 6, 7, 8];
export const TOP_GRADE = 8;

/**
 * @param {{grade: number, passed?: Record<number, boolean>, tests?: Record<number,string>, earned?: Record<number,number>}} s
 * @returns {Array<{grade, state, sub, test?, earned?}>} one row per grade, 3..8
 */
export function gradeStates({ grade, passed = {}, tests = {}, earned = {} }) {
  return GRADES.map(g => {
    const hasPassed = !!passed[g];
    // Grade 8 is always the Graduation card; passing it is what colours it in.
    if (g === TOP_GRADE) {
      return { grade: g, state: 'graduation', graduated: hasPassed,
        sub: hasPassed ? 'Finished' : `After the Grade ${TOP_GRADE - 1} License`,
        test: tests[g], earned: earned[g] };
    }
    // No sub line: the card's own status already reads "License earned", and the
    // score and payout appear as chips when the card is opened.
    if (hasPassed) return { grade: g, state: 'passed', sub: '', test: tests[g], earned: earned[g] };
    if (g === grade) return { grade: g, state: 'current', sub: '' };
    if (g < grade) return { grade: g, state: 'placed', sub: 'Review anytime' };
    return { grade: g, state: 'locked', sub: `After the Grade ${g - 1} License` };
  });
}

/**
 * Fold the contiguous run of `placed` grades directly below her placement into one
 * card — six rows where five say "you are past this" is noise, not information.
 * @returns {{earlier: {grades: number[], range: string}|null, rows: Array}}
 */
export function foldGradeStack(states = []) {
  const placed = states.filter(s => s.state === 'placed').map(s => s.grade).sort((a, b) => a - b);
  // Only fold a contiguous run, and only when there is more than one to fold.
  const contiguous = placed.length > 1 && placed.every((g, i) => i === 0 || g === placed[i - 1] + 1);
  if (!contiguous) return { earlier: null, rows: states };
  const range = `${placed[0]}–${placed.at(-1)}`;
  return {
    earlier: { grades: placed, range },
    rows: states.filter(s => s.state !== 'placed'),
  };
}

/** Nothing below grade 3, so a grade-3 student never sees an "earlier grades" card. */
export const hasEarlierGrades = (grade) => grade > GRADES[0];
