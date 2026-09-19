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

The homepage, sport brackets, search, schedule, results, and champions all read the saved tournament data. Public pages check a lightweight revision endpoint every 10 seconds while visible and online, refreshing content only when data changes. Failed checks back off to 60 seconds. Admin forms do not auto-refresh while you edit. Global search loads its data only when opened.

Sections support **single elimination** and **round robin leagues**, with one or two legs and 2–64 entries per section. A doubles pair or team is entered as one name. Admins can also manage sport segments and announcements.

## Countdown

The homepage counts down to **26 September 2026, 12:00 AM Bangladesh time**. Change `event.startsAt` in `lib/data.ts` if the opening time changes. After the start, the countdown shows that Sports Week has begun.

## Persistence and hosting

Tournament data, accounts, sessions, and change history are stored via `@libsql/client` (SQLite).

### Hosting on Vercel (Recommended)
This site can be hosted 100% free on **Vercel** with persistent data using **Turso** (Serverless cloud SQLite):
1. In your Vercel Project Settings -> **Environment Variables**, add:
   - `TURSO_DATABASE_URL`: `libsql://your-database.turso.io`
   - `TURSO_AUTH_TOKEN`: your Turso auth token
2. Deploy. Server actions and pages connect to Turso; database data persists across deployments and server restarts. Response times still depend on hosting, database region, and network conditions.

### Local & Fallback
If `TURSO_DATABASE_URL` is not specified, the app falls back to a local SQLite database file at `data/sports-week.db`. An explicit `SPORTS_WEEK_DATABASE_PATH` overrides remote database credentials for both the app and admin creation script, so tests can safely use a separate local database. The catalog is seeded once; intentionally deleted sections and sports stay deleted.

Every write verifies the admin session on the server. Result managers can record winners and match details; tournament organizers can also manage lineups. Version checks reject stale edits. Result propagation and change history are saved in one transaction.

## Verification

```bash
npm test
npm run check
npm run build
```

The tests cover every bracket size from 2–64, byes, progression, undo, invalid names, renaming, persistence, transaction rollback, and stale saves. Browser checks use a separate database so test entries do not enter the real tournament.

See [UI_PERFORMANCE_PLAN.md](UI_PERFORMANCE_PLAN.md) for the mobile/performance work plan, measured checks, and continuation notes.
