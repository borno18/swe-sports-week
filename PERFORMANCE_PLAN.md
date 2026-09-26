# UI and performance pass — 26 September 2026

## Scope
Preserve the site's theme and real tournament data. Improve admin loading, navigation feedback, public mobile layouts, and expensive rendering. Verify with production builds and isolated local tournament data; push completed changes.

## Work
- [x] Compare baseline payload and inspect admin/database/render paths.
- [x] Remove avoidable admin queries, data projection, and read-triggered writes.
- [x] Stream slow editor data and provide pending navigation feedback.
- [x] Reduce client rendering/bundle work and fix verified mobile/accessibility issues.
- [x] Run tests, type checking, production build and browser checks.
- [x] Record results and prepare delivery to `origin/main`; task final response confirms push.

## Findings
Admin login currently waits for full tournament projections and announcement bodies. Every admin tab fetches tournament rules, even when no editor is shown. Default rule reads launch background database writes, which can race an organizer's edit. The admin has no section-specific loading feedback for query-string navigation.

## Verification
### Completed changes
- Authenticated admin uses compact tournament summaries plus only the selected full bracket. Other tabs fetch no full draws. Announcement bodies are only fetched on their own tab. Login no longer awaits these datasets.
- Slow rules loading streams separately from the dashboard. Admin loading states and link-level pending hints acknowledge navigation immediately. Added a recoverable page error state.
- Successful sign-in batches reads and cleanup/audit writes, reducing four sequential database requests to two while retaining password verification, active-account checks, rate limiting and auditing.
- Warm catalog startup skips its unnecessary write transaction. Default rule reads do not write to the database. Rule edits now participate in public live-update revision checks.
- Memoized bracket/group calculations and split optional group/flexible editor bundles. Segments receive sport identifiers rather than all bracket data.
- Search reuses its fetched index for 30 seconds and keeps existing results visible during refresh. Fixed clipboard success feedback to require a successful copy, guarded unsupported fullscreen APIs, added visible keyboard focus and 16px mobile form text to avoid iOS focus zoom.

### Evidence
- All **25 tests** pass, including new summary accuracy/selection/empty-database checks and read-only default rule checks.
- `npm run check`, `npm run build`, and `git diff --check` pass.
- Reproducible synthetic payload comparison: `node --experimental-strip-types scripts/measure-admin-payload.mjs`. Fourteen 64-player draws: old full tournament JSON **221,717 bytes**, selected draw plus summaries **17,864 bytes** (**92% smaller**), summaries alone **2,017 bytes**. This measures serialized data, not compressed HTTP transfer or live latency.
- Local production browser measurements with isolated SQLite: homepage DOMContentLoaded about **60ms**, warmed admin segments about **24ms**, initial authenticated dashboard about **306ms**. Single observations, not statistical benchmarks or live-site promises; remote database latency and cold starts remain relevant.
- At 390×844, all public routes (home, schedule, sports, football, results, champions, announcements, volunteers) and all admin tabs render without document horizontal overflow. Standings/tabs keep their own horizontal scroll areas. Desktop admin also checked.
- Final production build browser flow: fresh login, client-side tab switch, winner undo, subsequent winner click, public champion refresh, search query, close/reopen with exactly one search request. No browser errors reported in these sessions.
- Browser writes used `.tools/configured-e2e.db` only. No live tournament data or credentials changed.

### Follow-up boundaries
Live deployment speed was not measured in this pass. If live admin remains slow after deployment, measure Vercel region-to-database latency and cold-start timings before changing caching or infrastructure. Admin reads intentionally remain fresh; authentication and tournament correctness are not traded for long-lived stale caches. Real-device Safari fullscreen/clipboard fallback and mobile input zoom need device verification beyond Chromium emulation.
