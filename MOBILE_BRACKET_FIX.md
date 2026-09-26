# Mobile tournament display fix — 26 September 2026

The reported cricket standings overlap names, qualifier badges and numeric columns. Generic phone table widths conflict with cricket sticky offsets; nowrap team content spills beyond its cell. Footer text also scrolls out of view with the table.

- [x] Give cricket columns consistent widths and sticky offsets; wrap names and contain badges.
- [x] Keep the explanatory footer outside the horizontal scroll area.
- [x] Verify cricket with the reported names and long names at 320, 390, 430, 768 and desktop widths; inspect both ends of horizontal scrolling.
- [x] Check knockout navigation and public/admin display; build and prepare delivery to main.

Use isolated `.tools/` data only. Preserve the site's colors and tournament behavior.

## Result
Explicit cricket colgroup and fixed mobile widths remove the conflicting generic table sizing. Team contents use a constrained grid with wrapping names. Qualifier rank cells override an older `position: relative` rule so their rank stays pinned even at maximum horizontal scroll. Separate table scrolling from the footer. Header badges wrap on the smallest screens.

Also reproduced clipped knockout controls: the old single-row toolbar exceeded phone width and hid next/fullscreen controls. Its phone layout now uses two rows, with 44px controls and a full-width round selector in the available column.

## Verification
- Tested public cricket and authenticated admin cricket using isolated `.tools/configured-e2e.db`; no live data changed.
- Reported names: Binary Blusters, Fakibaaz, The 9th, TLT Sports. Second group includes both a long spaced name and a long unbroken name.
- Chromium viewport widths 320, 390, 430, 768, 1280: no document overflow and all team children contained within the team cell.
- Inspected screenshots at horizontal scroll start/end; rank and team remain opaque/pinned and footer stays within the card.
- Mobile Next round changes selection to Final and moves the bracket scroller. Toolbar controls fit at 320 and 390px.
- Browser error lists empty. TypeScript check and optimized production build pass; `git diff --check` passes.
- Physical iPhone/Safari was not available; these are browser emulation checks.
