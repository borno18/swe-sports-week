# Configurable tournament setup — 22 September 2026

## Requested outcome
Keep the existing tournament UI/theme. Replace setup with optional group stages, configurable round count/names, match counts, and player/team counts. Winner selection must save, promote participants correctly, and update public fixtures/results.

## Baseline and preservation
Started at `00cb440` with existing uncommitted work in the tournament editor, bracket engine/views, store/actions, stylesheet, public data projection, and `tests/configured-bracket.test.mjs`. Preserve and complete this work rather than reverting it. Do not seed production data, delete real results, or change the visual design.

## Plan
- [x] Trace and reproduce winner selection and group-stage failures.
- [x] Validate tournament structure before publishing; reject impossible round capacities and omitted entrants.
- [x] Implement group fixtures/standings, qualification, and downstream invalidation on result corrections.
- [x] Make configured rounds use consistent participant slots, readiness, and advancement, including multiplayer matches.
- [x] Connect the same group/round display to admin and public pages; expose fixtures in schedule/results.
- [x] Complete accessible setup controls and useful validation/feedback while retaining existing styles.
- [x] Test groups through championship, winner clicks, score edits, undo, stale writes, invalid configurations, and mobile rendering using an isolated database.
- [x] Run tests, TypeScript, production build; record evidence.
- [x] Prepare completed changes for delivery to `borno18/swe-sports-week` on `main`; verify the pushed commit in the task's final response.

## Initial findings
- A partially implemented builder exists but group matches are never rendered on either admin or public pages.
- Group setup currently puts the original entrants straight into knockouts and has no qualification step.
- Configured progression can overlap source matches and permits picking winners before all sources resolve.
- Configuration lacks server validation and can silently drop entrants exceeding first-round capacity.

## Verification / continuation
Completed on 22 September 2026:
- 21 automated tests pass (`node --experimental-strip-types --test tests/*.test.mjs`). Configured-draw tests include entrant counts 2–40 with 2/3/4/8-player matches, no dropped/duplicate entrants, fixed slots for out-of-order results, incomplete-match protection, byes, ties, score corrections, reset, persistence, and stale-version rejection.
- `npm run check` and `npm run build` pass.
- Browser test on isolated `.tools/configured-e2e.db`: sign in, publish two groups of two, click each group's winner, click final winner, reload admin, verify public champion, undo group result and verify final/champion cleared, save a tied score, confirm a tied qualifier, verify the final updates.
- Repeated final winner save/public display verification against `next start` production build on port 3002.
- Public group view inspected at 390 × 844: no document horizontal overflow; standings scroll inside their container. Existing theme retained.
- Catalog regression tests also pass: deleted sports/sections are not recreated on startup.

## Organizer workflow and constraints
1. Open an unpublished section. Set group stage on/off, number of rounds, round names, matches, players per match, and total players in each round. Enter names in draw order, grouped consecutively when groups are enabled.
2. Publish. Group matches award 3/1/0 points for win/draw/loss; ranking then uses score difference and scores for. Finish every group fixture before qualification. If qualification/seeding remains tied, confirm the tied finishing order using the event's tie-break rule.
3. Click a participant's name to publish a winner. One winner per knockout match advances; byes advance automatically. Future matches remain disabled until every source is resolved. Details saves group scores into standings automatically; knockout winners are chosen explicitly.
4. Undo a result before replacing it, or edit group scores. Changed qualifiers/opponents clear dependent winners and scores. Name corrections preserve results.
5. To change a published structure, use **Reset this section**, then configure it again. Reset explicitly removes names/results; it preserves the last configuration as a starting point. Existing legacy flexible draws retain their multiple-advancer **Save Advancers** flow.

Limits: 1–10 knockout rounds, 1–100 matches per round, 2–48 participants per match, up to 200 names (6,000 characters). Groups: 1–16, 2–20 participants each, fewer qualifiers than participants. Group capacity must match names exactly. Each later round receives one winner per preceding match, and the final contains one championship match. Two-leg knockout ties require two-player matches. Impossible configurations fail with an actionable message instead of silently omitting entrants.

No production tournament data was edited during verification. Test database, admin account, browser artifacts, and temporary build output are ignored under `.tools/`. Deployed-site verification is not included; this work verifies local development and production builds.
