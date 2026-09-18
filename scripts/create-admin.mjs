import { createHash, randomUUID, scryptSync } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || "SWE Super Admin";

if (!email || !password || password.length < 12) {
  console.error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters.");
  process.exit(1);
}

const dataDirectory = join(process.cwd(), "data");
const databasePath = process.env.SPORTS_WEEK_DATABASE_PATH || join(dataDirectory, "sports-week.db");
mkdirSync(dirname(databasePath), { recursive: true });
const database = new DatabaseSync(databasePath);
database.exec(`
  PRAGMA foreign_keys = ON;
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
`);

const salt = createHash("sha256").update(randomUUID()).digest("hex");
const passwordHash = scryptSync(password, salt, 64).toString("hex");
const existing = database.prepare("SELECT id FROM users WHERE email = ?").get(email);
const timestamp = Date.now();

if (existing) {
  database.prepare(`
    UPDATE users SET name = ?, password_hash = ?, password_salt = ?, role = 'SUPER_ADMIN', active = 1, updated_at = ?
    WHERE email = ?
  `).run(name, passwordHash, salt, timestamp, email);
  console.log(`Updated Super Admin: ${email}`);
} else {
  database.prepare(`
    INSERT INTO users (id, name, email, password_hash, password_salt, role, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'SUPER_ADMIN', 1, ?, ?)
  `).run(randomUUID(), name, email, passwordHash, salt, timestamp, timestamp);
  console.log(`Created Super Admin: ${email}`);
}

database.close();
