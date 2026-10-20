/* Assembles a five-move Daily Lesson from the engine. The UI runner is pure
   orchestration, so everything it needs — questions per move, the teach phase,
   the re-teach view — is built here, where the engine lives.

   Warm-up draws from the review queue (empty on day one, so it falls back to
   the current skill); guided carries fading scaffolds; prove-it has no help. */
import { toQuizQuestion, dueQueue, dayNumber } from '@kampus/engine';
import { WORLDS } from './worlds.js';

const asQuestion = (q) => ({
  text: q.text, answers: q.choices, correct: q.answerIndex,
  teachSteps: q.teach, hint: q.teach && q.teach[0], show: q.teach && q.teach.join(' '),
  skill: q.skill,
});

const make = (grade, topic, tier, n) => Array.from({ length: n }, () => asQuestion(toQuizQuestion(grade, topic, tier)));

/** Scaffolds fade: the first questions carry a first step, the last two carry none (§0). */
function withFadingScaffolds(questions) {
  return questions.map((q, i) => (i < questions.length - 2
    ? { ...q, scaffold: q.hint, scaffoldLevel: i === 0 ? 'lots' : 'some' }
    : q));
}

export function buildLesson(state, topic) {
  const grade = state.grade;
  const tier = state.tiers[`${grade}_${topic}`] || 1;
  const world = WORLDS[topic];
  const due = dueQueue(state.review || [], dayNumber(), { limit: 2 });
  const warmTopic = due.length ? (due[0].topic || topic) : topic;

  return {
    title: `${world.name} · tier ${tier}`,
    unit: `${world.name} · unit ${tier} of 7`,
    world,
    moves: [
      { id: 'warmup', meta: due.length ? 'from your review queue' : 'warm up', questions: make(grade, warmTopic, Math.max(1, tier - 1), 2) },
      {
        id: 'new', meta: '2–3 min',
        teach: {
          steps: [
            { id: 'big', title: 'Big idea', prompt: '10% of a number is that number with the decimal moved one place left.',
              body: 'Percent means "per hundred". 10% is one tenth, so $48 becomes $4.80. Once you can take 10%, you can build any percent from it.',
              takeaway: '10% → move the decimal one place left. $48 → $4.80' },
            { id: 'shade', title: 'Shade it', prompt: 'Shade 10% of the bar.', interactive: 'shade',
              config: { targetPct: 10, total: 48 }, takeaway: 'Each block is 5%. Two blocks make 10%.' },
            { id: 'split', title: 'Split the bill', prompt: 'The bill is $48. Collect a 15% tip.', interactive: 'split',
              config: { total: 48, targetPct: 15 }, takeaway: '15% = 10% + half of 10% = $4.80 + $2.40 = $7.20' },
            { id: 'mistake', title: 'Spot the mistake', prompt: 'Your friend worked out 15% of $48. One line is wrong.',
              interactive: 'mistake', config: { lines: [
                { text: '10% of $48 = $4.80' },
                { text: 'Half of $4.80 = $2.40' },
                { text: '$4.80 + $2.40 = $7.80', wrong: true, why: '$4.80 + $2.40 is $7.20, not $7.80.' },
              ] }, takeaway: 'Check the last add — $4.80 + $2.40 = $7.20' },
            { id: 'try', title: 'Try it', prompt: 'You try one. What is 20% of $60?',
              body: '10% of $60 is $6.00. Double it for 20%: $12.00.', takeaway: '20% = double 10%. $60 → $12.00' },
          ],
        },
      },
      { id: 'guided', meta: 'with help', teachFree: true, questions: withFadingScaffolds(make(grade, topic, tier, 4)) },
      { id: 'mixed', meta: 'interleaved', questions: [
        ...make(grade, topic, tier, 2),
        ...make(grade, warmTopic === topic ? 'ratio' : warmTopic, Math.max(1, tier - 1), 2),
      ] },
      { id: 'prove', meta: 'no help', questions: make(grade, topic, tier, 3), fresh: make(grade, topic, tier, 2) },
    ],
    reteach: {
      kicker: 'Go over it',
      title: 'Build the percent from 10%',
      lede: 'Take 10% first, then add or halve to reach the one you need.',
      rows: [
        { lead: '10%', how: 'move the decimal one place left', value: '$4.80' },
        { lead: '5%', how: 'half of the 10%', value: '$2.40' },
        { lead: '15%', how: 'add them together', value: '$7.20' },
      ],
    },
  };
}
