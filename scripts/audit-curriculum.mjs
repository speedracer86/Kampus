/* Renders the curriculum bank as human-readable audit sheets, one per grade:
   docs/audit/GRADE_<n>.md — every unit, its snag, its teach panels, and the
   lesson-day sequence. The review surface for lesson quality.
   Run: node scripts/audit-curriculum.mjs */
import { writeFileSync, mkdirSync } from 'node:fs';
import { YEAR, GRADES } from '../packages/curriculum/src/units.js';
import { lessonsFor } from '../packages/curriculum/src/lessons.js';
import { snagFor } from '../packages/curriculum/src/snags.js';
import { TEACH } from '../packages/curriculum/src/teach.js';
import { SKILLS } from '../packages/curriculum/src/skills.js';

mkdirSync('docs/audit', { recursive: true });

for (const g of GRADES) {
  const seq = lessonsFor(g);
  let md = `# Grade ${g} — lesson audit sheet\n\n`;
  md += `${seq.length} lesson days · ${YEAR[g].length} units. Generated from packages/curriculum — edit the source, not this file.\n`;
  for (const u of YEAR[g]) {
    const days = seq.filter(d => d.unit === u.id);
    const s = snagFor(u.id);
    md += `\n## ${u.id} · ${u.name} (weeks ${u.weeks[0]}–${u.weeks[1]}, ${u.world})\n\n`;
    md += `*${u.focus}*\n\n`;
    md += `**Snag (opens day ${days[0].n}):** ${s.scene}\n> ${s.q} — **${s.ans}** → teaches *${SKILLS[s.resolves].label}*\n\n`;
    if (u.gaps.length) md += `**Needs new generators (backlog):** ${u.gaps.join(', ')}\n\n`;
    md += `**Teach panels:**\n`;
    for (const key of u.skills) {
      const p = TEACH[key];
      md += `- **${SKILLS[key].label}** — ${p.bigIdea}\n`;
      for (const st of p.steps) md += `    - ${st.do}: ${st.ex}\n`;
      md += `    - Your turn: ${p.yourTurn.q} → **${p.yourTurn.a}**\n`;
    }
    const kinds = days.reduce((m, d) => (m[d.type] = (m[d.type] || 0) + 1, m), {});
    md += `\n**Days (${days.length}):** ` +
      Object.entries(kinds).map(([k, n]) => `${n} ${k}`).join(' · ') +
      ` — ends day ${days[days.length - 1].n} (${days[days.length - 1].type})\n`;
  }
  writeFileSync(`docs/audit/GRADE_${g}.md`, md);
  console.log(`GRADE_${g}.md written (${md.length} chars)`);
}
