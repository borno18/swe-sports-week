# UI and performance work — 19 September 2026

## Goal
Fix the mobile overflow shown in the supplied screenshot, make navigation and tournament interactions responsive, and reduce unnecessary server/database work while keeping public results current. Preserve existing admin, league, two-leg, and knockout functionality.

## Work plan
- [x] Reproduce mobile overflow with populated league and knockout fixtures; record a baseline.
- [x] Constrain grid children and table/round scrollers to the viewport. Improve mobile spacing, standings readability, tap targets, and long-name handling.
- [x] Remove repeated catalog initialization from reads; ensure deleted sections stay deleted.
- [x] Replace unconditional full-page polling with lightweight change detection, visibility/offline handling, and failure backoff.
- [x] Remove database work from the shared navigation shell; load global search only when opened. Add immediate route loading feedback.
- [x] Reduce unnecessary animation and repeated standings calculations without hiding content.
- [x] Run automated tournament tests, TypeScript, production build, and mobile/desktop browser checks. Record measured results and limitations.
- [ ] Commit and push the verified changes to the existing GitHub repository, as previously requested.

## Findings
- The working tree was clean at start; baseline commit: `58b3298`.
- Public league containers use implicit grid minimum widths and a 320px minimum fixture card. Standings and round selectors can force the whole page wider than mobile screens.
- The root layout waits for all tournaments, matches, sports, and announcements before rendering navigation, and serializes them into the header on every page.
- Public pages call `router.refresh()` unconditionally every 10 seconds, even if nothing changed.
- Every tournament read checks/seeds sports and sections through sequential database calls. Default sections can be recreated after deletion.

## Continuation notes
Use the installed Next.js documentation in `node_modules/next/dist/docs/` before framework changes. Browser tests must use an isolated local database; do not write test entries into production. Do not commit `.env` files, database files, credentials, or generated builds. Keep this file current as each item is completed, with exact commands and any remaining work.

## Verification and results
- Baseline: at a 390px browser viewport the league page had a document width of 862px. After the fix, it is 375px, matching the available width after the desktop browser's 15px scrollbar. At a 320px viewport, homepage, league, and knockout pages all measure 305px available / 305px document width.
- An unchanged production page made five consecutive `/api/updates` requests (39-byte JSON each) with no full-page refresh. A synthetic saved result then triggered a refresh and updated the league leader to 3 points while preserving the selected round.
- Global search successfully found synthetic team fixtures after opening the dialog. Round switching works with visible controls.
- Production homepage local sample: 17ms time to first byte, 67ms load event. This is a local SQLite measurement, not a claim about Vercel/Turso or real mobile networks.
- `npm test`: 11 tests pass, including 2 new catalog migration/deletion regression tests. `npm run check`, `npm run build`, and `git diff --check` pass.
- Additional mobile bug found in announcements: generic text-input styling overrode hidden radio-input sizing, creating horizontal page overflow. Fixed by excluding radio/checkbox inputs and adding visible keyboard focus on their labels. Verified hidden radios are 1px wide, and document width matches available width at 390px and 320px viewports.
- Browser widths verified: homepage/league/knockout/schedule/results at 320px; homepage/league and authenticated tournament/segment/announcement admin screens at 390px; league at 768px and 1440px. No document overflow in those checks. League table and round navigation remain independently scrollable.
- Verified mobile navigation opens, Escape dismisses it, search opens without overflow and requests its data once, and fixture round selection updates visible matches. No JavaScript errors reported in public or admin browser sessions.
- Evidence: `artifacts/ui-review/mobile-league-before.png`, `mobile-league-after.png`, `mobile-fixtures-after.png`, `home-mobile-performance.png`, `league-desktop-after.png`, `admin-segments-mobile-after.png`, and `admin-announcements-mobile-after.png` (local ignored artifacts).

## Implementation notes
- Shared header renders immediately; `/api/search` returns only public search fields on demand.
- Homepage hero/countdown stream immediately; statistics and tournament cards resolve in Suspense boundaries using request-deduplicated data.
- `/api/updates` hashes IDs/versions via one small SQL query, without loading bracket JSON. Active visible pages check every 10 seconds; failures back off, hidden/offline pages skip checks, and abandoned requests are aborted.
- Catalog initialization is coalesced per process, transactional, and recorded persistently in `app_metadata`. Existing populated catalogs are not reseeded during migration. New sports explicitly get a default section.
- Explicit `SPORTS_WEEK_DATABASE_PATH` now overrides Turso environment settings in both the server and admin CLI. Test database: `.tools/performance.db` (ignored). Production data was not seeded with synthetic fixtures.
- Browser artifacts are under ignored `artifacts/ui-review/`. Tests used port 3002 with the production build and synthetic local fixtures.

## Reproduce / continue
1. Run `npm test`, `npm run check`, and `npm run build` from the repository.
2. For isolated browser verification in PowerShell, set `$env:SPORTS_WEEK_DATABASE_PATH = Join-Path (Get-Location) '.tools/performance.db'`, then run `node node_modules/next/dist/bin/next start --port 3002`. The database must be initialized before creating synthetic fixtures. Admin test account setup uses `ADMIN_EMAIL`/`ADMIN_PASSWORD` environment variables and `node scripts/create-admin.mjs`; never commit their values.
3. Check `/`, `/sports/football` with a populated league, `/sports/dart` with a knockout draw, `/schedule`, `/results`, and `/admin?tab=announcements` at 320px and 390px. Compare `document.documentElement.scrollWidth` with `clientWidth`; they should match.
4. Watch network traffic for at least 30 seconds: unchanged public pages should only request `/api/updates` every 10 seconds. Save a test result in the isolated admin; expect a page refresh on the next check and preserved round selection. Admin pages should not poll.
5. To assess deployed performance, check the new deployment on a real phone and a throttled mobile connection. Compare the Vercel runtime region with the Turso database region and measure TTFB/LCP/INP before making hosting changes. No hosting-region settings were changed in this work.

## Limits / follow-up
- Local Chromium emulation does not replace testing on physical iPhone Safari. The supplied screenshot's overflow was reproduced and fixed structurally; a real-device check after deployment is still recommended.
- Local timings use SQLite on this computer and cannot establish a production speed percentage. Database queries and changed-page renders still incur network/hosting latency on Vercel/Turso.
- No new dependencies, cross-request data cache, or hosting configuration changes were introduced. Public data stays fresh without needing cache invalidation in every admin action.
