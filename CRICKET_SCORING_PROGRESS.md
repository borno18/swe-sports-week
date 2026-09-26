# Cricket scoring and NRR work

Goal: let admins record a complete innings such as `91/3` or `91-3` with overs bowled, then show that result throughout the site and calculate group net run rate from actual innings data.

Rules to verify: NRR is total runs scored divided by total overs faced, minus total runs conceded divided by total overs bowled. An innings ending all out uses its full eight-over allocation. Cricket overs use balls notation (`7.2` means seven overs and two balls). Existing runs-only results have no recorded overs, so count as eight overs until edited.

Implementation checklist:
- [x] Persist runs, wickets, overs and all-out status through the admin details action.
- [x] Display full scores in fixtures and brackets.
- [x] Replace the current NRR shortcut with aggregate innings rates and test short chases and all-out innings.
- [x] Run type checks, all 27 tests and production build; verify admin save, public score and +0.625 NRR in a copied local test database.
- [x] Commit and push to the GitHub repository.

Historical runs-only results still assume 8.0 overs until an admin updates them. The app does not collect DLS par scores or a separate no-result status, so those special cases would need more fields before ICC tournament treatment could be exact.

The live remote database could not be reached from the sandbox during verification, so the browser flow used `.tools/cricket-verify.db`, a copy of the existing local test database. No production results were changed.

Official reference: https://www.icc-cricket.com/news/mens-odi-match-clause-16-the-result
