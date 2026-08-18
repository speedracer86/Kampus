---
description: Summarize my commits from the last 7 days for standup notes
allowed-tools: Bash(git log:*), Bash(git show:*), Bash(git config:*), Bash(git diff:*)
---

Write a "what I shipped" summary I can paste straight into standup notes.

Gather the raw material first:

```
!`git log --author="$(git config user.email)" --since="7 days ago" --all --no-merges --date=short --pretty=format:'%h %ad %s' --stat`
```

Then:

1. If that came back empty, say so plainly and stop — don't pad the summary with older
   work or with commits that aren't mine.
2. Group the commits by what they accomplished, not by day or by file. Several commits
   that add up to one shipped thing are one bullet.
3. Lead each bullet with the user-visible or team-visible outcome, then the detail.
   "Component library now runs as a live gallery" beats "added vite.config.js".
4. Keep it to 3–6 bullets. Skip merges, formatting-only commits, and typo fixes unless
   nothing else happened.
5. Add a short "in progress" line at the end only if the log clearly shows unfinished
   work (a branch that stops mid-feature, a TODO in a commit message).

Plain text, no headings, no preamble. Be concrete and factual — this gets read aloud to
other people, so don't inflate what the commits actually show.
