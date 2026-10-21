# Product audit — why it doesn't feel like a product yet (Oct 21)

*Owner played the deployed build and was right: it is systems, not yet a product.
This audit drove every screen of the production build headless, found the causes,
and splits the work: §A is fixed in this patch, §B is the code work order for
Claude Code, §C is the design brief for Claude Design. Priorities are ranked within
each section.*

---

## The headline finding (fixed in this patch)

**Production builds were deleting every lesson's questions.** The engine's skill
index resolved generators by `fn.name`; the production minifier renames functions,
so on the deployed site every skill lookup missed. Warm-up, guided practice, the
mixed set and prove-it all drew zero questions and were silently filtered away. A
"lesson" was: snag → four one-line teach steps → "Lesson done. +$0." Inspection
Day quizzes would have arrived equally empty. Dev builds and all 312 tests never
exercised the minified bundle, which is exactly how it shipped. Fixed two ways
(esbuild `keepNames` + an explicit name registry), verified against the built
bundle. **This one bug was most of "the lessons are just questions / it doesn't
teach."** The owner's instinct was better than the test suite.

## A. Fixed in this patch

1. **The minified-name bug above** — lessons now run all five moves in production.

## B. Code work order (Claude Code — in this order)

1. **One shell, every screen.** Rewards and Grown-ups render without the NavBar
   (same one-way-door class as the business bug). Shop is a nav item with no
   screen: clicking it silently does nothing. Fix: a single `Shell` wrapper owns
   NavBar + active state; every non-immersive screen renders inside it (home,
   business, rewards, grown-ups, and shop-when-it-exists). Immersive screens
   (lesson, quiz, test, play) keep their focus layout but must always have a
   working Exit. Remove Shop from the nav until the shop exists (a nav item that
   does nothing teaches the kid the menu lies); likewise "Open the shop →" on
   LessonDone becomes "Back to Today" until there is a shop.
2. **Week view shows the plan.** It currently renders seven empty dashes and a
   "+ Next run" tile. Wire it to `lessonsFor(grade)`: the past days of this week
   from the events/days map (lesson done, quiz passed, money earned), today
   highlighted, and the NEXT five days from the sequence — lesson titles, the
   unit quiz day marked as Inspection Day, the grade test if in range. A kid and
   a parent should both be able to answer "what's coming this week?" at a glance.
3. **Teach panel renders its content once, properly.** The adapter maps the big
   idea into both `prompt` and `body`, so the first teach step shows the same
   sentence twice. Render the worked example in the §0 ReteachView language
   (ruled rows, 40px numerals) instead of one plain text line per step — the
   component exists; route teach steps with `rows` through it. Keep takeaways on
   the cheat-sheet column as they are.
4. **Lesson completion guard.** A lesson may not reach "done" (or pay its
   $0.50) unless at least the guided and prove moves actually ran questions.
   If the moves assemble empty for any future reason, show a friendly "this
   lesson is being restocked" state and emit a `lesson_empty` event — never a
   silent success. This is the alarm that would have caught the headline bug.
5. **Grade stack semantics** (code half; design owns the look, §C3): grades
   below the placed grade must never read "Locked". Until the design round
   lands, relabel them "Review" (tappable later) and keep grades above locked.
6. **Wishlist link previews** (code half; §C4 owns the look): client-side
   fetching of store pages is CORS-blocked, so previews need a tiny Cloudflare
   Worker (`GET /preview?url=` → fetch page → return og:image + title + price
   when present, cached). Deploy under the existing CF account; the Rewards
   screen already has the image slot waiting. Until the Worker ships, show a
   typed-initial tile instead of an empty gray square.
7. **Snag choices stop telegraphing.** Numeric snag answers get generated near
   misses, but sentence answers ("The 8-pack (43¢ vs 45¢)") sit beside bare
   numbers and give themselves away by shape. Interim code fix: when the bank
   answer is non-numeric, render the snag as scene + "Have a look" reveal
   (no choices) rather than a fake multiple choice. The bank will add authored
   `wrongs` for sentence snags in its next patch (bank owner's list).
8. **The e2e suite runs against the BUILT bundle in CI** (tests/test_webapp
   seed already delivered). This audit's headline bug is invisible to unit
   tests by construction; only a built-bundle test catches the next one.

## C. Design brief (Claude Design — one round, these four asks)

1. **The Teach Moment — make the "New idea" feel like being taught** (the big
   ask). Today's teach step is a sentence in a box. The §0 exemplar (percent
   lesson: shade-the-bar, split-the-bill, spot-the-mistake, 40px worked rows)
   IS the right language — design the *generic* teach-step layouts so every
   skill gets it: (a) a worked-example layout for numeric walks (the ReteachView
   rows, with the final value green), (b) a compare/choice layout ("which is
   bigger / which deal wins") with two big tappable cards, (c) a number-line /
   bar layout for fraction & integer skills, and (d) the voice treatment —
   "Read it to me" should feel like the default companion for band a, not a
   pill an 8-year-old must find. Deliver as artboards per layout with the §0
   step frame (cheat-sheet column, gated Next) unchanged.
2. **Week view** — design the planned week (§B2 wires the data): run cards for
   done days, today's card, upcoming lesson cards with unit + world chip,
   Inspection Day and the License as distinct moments worth looking forward to.
3. **The grade stack for a placed student.** Grades below placement are not
   "Locked" — she *placed past them*. Design their state (suggested: quiet
   "Review" cards that open a review run; or collapse them under a single
   "Earlier grades" card) and the state for a kid who IS in grade 3 (nothing
   below). Also the empty-ahead state: grade 7/8 locked cards should hint at
   what's coming ("after the Grade 6 License"), not just say Locked.
4. **Wishlist rows while images load/fail** — the preview Worker (§B6) will
   miss sometimes; design the tile fallback (store-colored initial? product
   emoji by category?) so a missing image never reads as broken.
5. **World names** — owner finds "Trade Tycoon" unfriendly. Propose 3 naming
   families for the four worlds (money/ratios · fractions · negatives/weather ·
   algebra), each set coherent and readable by an 8-year-old AND not babyish at
   13 (the age-dial test). Candidates to beat: The Market · The Kitchen · The
   Forecast · The Lab. Decision stays with the owner; nothing renames until he
   picks (world identity touches three code sites — see CLAUDE.md gotcha).

## Deferred, tracked, not forgotten

Shop screen (design exists in old handoff only — needs a §0 round before build),
moments in the open-day queue (engine makes them; screen doesn't render them yet),
business-type picker (blocked on onboarding round, seam ready), placement
diagnostic, campus/graduation celebration, sound & juice pass, stand build-out
art, pilot report rendering. Plus the bank owner's list: authored wrongs for
sentence snags, richer teach panels for the remaining ~60 skills as interactives
ship.
