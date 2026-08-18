---
description: Fetch a GitHub issue, plan a fix, get approval, then implement and test
argument-hint: <issue-number>
allowed-tools: Bash(gh issue view:*), Bash(gh issue list:*)
---

Fix GitHub issue #$ARGUMENTS.

Work through these phases in order. **Do not write any code before phase 4.**

## 1. Understand the issue

```
!`gh issue view $ARGUMENTS --comments`
```

Read the comments too, not just the body — the real requirement is often a correction
buried in the thread. If the issue is ambiguous or underspecified, ask me before planning
rather than guessing.

## 2. Find the relevant code

Locate every place that has to change. Read enough surrounding code to understand the
existing patterns — see `CLAUDE.md` for the architecture and the two-track layout.
Note in particular whether the change touches `index.html`, `ui/`, or both: they are
independent and do not share code, so a fix in one does not propagate to the other.

## 3. Make a plan and stop

Present:
- Your understanding of the problem, in one or two sentences
- The specific files and functions you'll change, and what each change does
- How you'll verify it (see `CLAUDE.md` — the Playwright suite covers `index.html`;
  `ui/` gets `npm run build` plus a visual check)
- Anything you're unsure about, or that the issue gets wrong

**Then stop and wait for my approval.** Don't start implementing until I say go.

## 4. Implement

Follow the existing style — match the surrounding code and don't reformat untouched lines.
Keep the diff as small as the fix allows.

## 5. Test

Run the verification step from `CLAUDE.md` and show me the actual output. If it fails, fix
it and run again — don't report success on a red suite, and tell me plainly if something
is still broken.

Finally, summarize what changed and what you verified. Don't commit or push unless I ask.
