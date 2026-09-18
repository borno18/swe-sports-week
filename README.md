# Intra SWE Sports Week

A mobile-first live tournament hub for the annual Intra SWE Sports Week organized by SWE Society, SUST.

## Current scope

- Branded live-event homepage
- Today and full schedule views
- Sports directory and sport detail pages
- Results, announcements, and Hall of Champions
- Responsive mobile navigation
- Admin authentication entry screen
- SQLite-backed admin users and opaque sessions
- Scrypt password hashing and login throttling
- Typed demonstration data isolated in `lib/data.ts`

## Run locally

Install Node.js 20 or newer, then run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Create or reset the Super Admin

Set the credentials in environment variables, then run the setup command:

```powershell
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_PASSWORD="use-a-long-random-password"
$env:ADMIN_NAME="Sports Secretary"
npm run admin:create
```

The local database is stored in `data/sports-week.db` and is excluded from Git.

## Next implementation phase

The current milestone is the public product experience. The next phase connects PostgreSQL, authentication, role-based admin APIs, transactional result publishing, bracket progression, and realtime subscriptions as outlined in `docs/architecture.md`.
