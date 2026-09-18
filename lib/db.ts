import "server-only";

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const dataDirectory = join(process.cwd(), "data");
const databasePath = process.env.SPORTS_WEEK_DATABASE_PATH || join(dataDirectory, "sports-week.db");

declare global {
  var sportsWeekDatabase: DatabaseSync | undefined;
}

function createDatabase() {
  mkdirSync(dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA journal_mode = WAL");
  database.exec("PRAGMA foreign_keys = ON");
  database.exec("PRAGMA busy_timeout = 5000");
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'TOURNAMENT_ADMIN', 'RESULT_MANAGER')),
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS login_attempts (
      email TEXT PRIMARY KEY COLLATE NOCASE,
      failed_count INTEGER NOT NULL,
      last_failed_at INTEGER NOT NULL,
      blocked_until INTEGER
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at INTEGER NOT NULL
    );
  `);
  return database;
}

export function getDatabase() {
  if (!global.sportsWeekDatabase) {
    global.sportsWeekDatabase = createDatabase();
  }
  return global.sportsWeekDatabase;
}
