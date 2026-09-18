# Intra SWE Sports Week

A tournament hub for SWE Society, SUST, with a protected organizer dashboard and connected knockout brackets.

## Run locally

Use Node.js **22.14 or newer** (the database uses built-in `node:sqlite`).

```bash
npm ci
npm run dev
```

Open http://localhost:3000. The organizer login is at http://localhost:3000/admin.

## Create or reset your admin login

Existing organizer accounts continue to work. For first-time setup or a forgotten password, run:

```powershell
$env:ADMIN_EMAIL="your-email@example.com"
$env:ADMIN_PASSWORD="use-a-long-random-password"
$env:ADMIN_NAME="Sports Secretary"
npm run admin:create
```

The password must contain at least 12 characters. The script hashes it and creates or updates this account. Credentials and database files are never committed to Git.

## Run a tournament

1. Sign in at `/admin` and choose a sport, including **Dart**.
2. Enter 2–64 player or team names, one per line, and click **Publish bracket**. Names are paired from top to bottom; remaining places get automatic byes.
3. Click the winner's name in a ready match. The winner advances immediately; choosing the final winner publishes the champion and runner-up.
4. Use **Details** to set a date, time (Bangladesh time), venue, and optional scores.
5. Use **Undo** to correct a result. A confirmation explains that later results depending on it will also be cleared; unrelated matches are preserved.
6. **Edit player / team names** corrects spelling throughout the bracket without changing results. To replace the entire lineup, use **Reset this section** and type `RESET`.
7. Use **Add another section** for separate singles, doubles, batch, or team draws within a sport.

The homepage, sport brackets, search, schedule, results, and champions all read the saved tournament data. Public pages refresh every 10 seconds while visible, and when the window receives focus. Admin forms do not auto-refresh while you edit.

The format is **single elimination**, with 2–64 entries per section. Group stages, round-robin standings, and multi-player matches are not included. A doubles pair or team is entered as one name.

## Countdown

The homepage counts down to **26 September 2026, 12:00 AM Bangladesh time**. Change `event.startsAt` in `lib/data.ts` if the opening time changes. After the start, the countdown shows that Sports Week has begun.

## Persistence and hosting

Tournament data, accounts, sessions, and change history are stored in `data/sports-week.db`. Back up the database using SQLite's backup tooling. This app needs a **persistent writable disk and a single application instance**; an ephemeral serverless filesystem will not preserve tournament data. PostgreSQL can replace SQLite for multi-instance hosting (see `docs/architecture.md`).

Optional environment variables:

- `SPORTS_WEEK_DATABASE_PATH`: use a different SQLite database file (for example, a mounted persistent disk or an isolated test database).
- `SPORTS_WEEK_BUILD_DIR`: separate Next.js output directory for isolated browser tests. Defaults to `.next`.

Every write verifies the admin session on the server. Result managers can record winners and match details; tournament organizers can also manage lineups. Version checks reject stale edits. Result propagation and change history are saved in one transaction.

## Verification

```bash
npm test
npm run check
npm run build
```

The tests cover every bracket size from 2–64, byes, progression, undo, invalid names, renaming, persistence, transaction rollback, and stale saves. Browser checks use a separate database so test entries do not enter the real tournament.
