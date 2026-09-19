import "server-only";

import { createClient, type Client } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

declare global {
  var sportsWeekDatabase: Client | undefined;
  var sportsWeekDatabaseInitPromise: Promise<void> | undefined;
}

export function getDatabase(): Client {
  if (!global.sportsWeekDatabase) {
    const url = process.env.TURSO_DATABASE_URL || process.env.SPORTS_WEEK_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN || process.env.SPORTS_WEEK_AUTH_TOKEN;

    if (url) {
      global.sportsWeekDatabase = createClient({
        url,
        authToken,
      });
    } else {
      const dataDirectory = join(process.cwd(), "data");
      const databasePath = process.env.SPORTS_WEEK_DATABASE_PATH || join(dataDirectory, "sports-week.db");
      mkdirSync(dirname(databasePath), { recursive: true });
      global.sportsWeekDatabase = createClient({
        url: `file:${databasePath}`,
      });
    }
  }
  return global.sportsWeekDatabase;
}

export async function ensureDatabaseInitialized(): Promise<Client> {
  const db = getDatabase();
  if (!global.sportsWeekDatabaseInitPromise) {
    global.sportsWeekDatabaseInitPromise = (async () => {
      await db.batch([
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE COLLATE NOCASE,
          password_hash TEXT NOT NULL,
          password_salt TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'TOURNAMENT_ADMIN', 'RESULT_MANAGER')),
          active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at INTEGER NOT NULL,
          created_at INTEGER NOT NULL
        )`,
        `CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id)`,
        `CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at)`,
        `CREATE TABLE IF NOT EXISTS login_attempts (
          email TEXT PRIMARY KEY COLLATE NOCASE,
          failed_count INTEGER NOT NULL,
          last_failed_at INTEGER NOT NULL,
          blocked_until INTEGER
        )`,
        `CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
          action TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT,
          details TEXT,
          created_at INTEGER NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS tournaments (
          id TEXT PRIMARY KEY,
          sport_slug TEXT NOT NULL,
          title TEXT NOT NULL COLLATE NOCASE,
          entry_kind TEXT NOT NULL CHECK(entry_kind IN ('player','team')),
          version INTEGER NOT NULL DEFAULT 0,
          bracket TEXT NOT NULL,
          UNIQUE(sport_slug, title)
        )`,
        `CREATE TABLE IF NOT EXISTS tournament_changes (
          id TEXT PRIMARY KEY,
          tournament_id TEXT NOT NULL,
          actor_id TEXT NOT NULL,
          action TEXT NOT NULL,
          previous_bracket TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS announcements (
          id TEXT PRIMARY KEY,
          level TEXT NOT NULL CHECK (level IN ('general', 'important', 'urgent', 'update')),
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          time TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          created_by TEXT REFERENCES users(id) ON DELETE SET NULL
        )`,
        `CREATE INDEX IF NOT EXISTS announcements_created_at_idx ON announcements(created_at DESC)`,
        `CREATE TABLE IF NOT EXISTS sports (
          slug TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          category TEXT NOT NULL CHECK(category IN ('Indoor', 'Outdoor')),
          color TEXT NOT NULL,
          detail TEXT NOT NULL DEFAULT '',
          created_at INTEGER NOT NULL
        )`
      ], "write");
    })();
  }
  await global.sportsWeekDatabaseInitPromise;
  return db;
}
