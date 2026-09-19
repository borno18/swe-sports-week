import { createClient } from "@libsql/client";
import { createHash, randomUUID, scryptSync } from "node:crypto";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

// Load .env.local if present
const envLocalPath = join(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  const content = readFileSync(envLocalPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      if (!process.env[k]) {
        process.env[k] = v;
      }
    }
  }
}

const args = process.argv.slice(2);
const name = (args[0] || process.env.ADMIN_NAME || "SWE Super Admin").trim();
const email = (args[1] || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = args[2] || process.env.ADMIN_PASSWORD;
const role = (args[3] || process.env.ADMIN_ROLE || "SUPER_ADMIN").trim();

if (!email || !password || password.length < 8) {
  console.log("Usage: node scripts/create-admin.mjs <name> <email> <password> [role]");
  console.log("   or set ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD in environment.");
  console.error("Error: Please provide a valid email and password of at least 8 characters.");
  process.exit(1);
}

const url = process.env.TURSO_DATABASE_URL || process.env.SPORTS_WEEK_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN || process.env.SPORTS_WEEK_AUTH_TOKEN;

let client;
if (url && !process.env.SPORTS_WEEK_DATABASE_PATH) {
  client = createClient({ url, authToken });
} else {
  const dataDirectory = join(process.cwd(), "data");
  const databasePath = process.env.SPORTS_WEEK_DATABASE_PATH || join(dataDirectory, "sports-week.db");
  mkdirSync(dirname(databasePath), { recursive: true });
  client = createClient({ url: `file:${databasePath}` });
}

async function main() {
  await client.execute(`
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
    )
  `);

  const salt = createHash("sha256").update(randomUUID()).digest("hex");
  const passwordHash = scryptSync(password, salt, 64).toString("hex");
  const timestamp = Date.now();

  const existingRes = await client.execute({
    sql: "SELECT id FROM users WHERE email = ?",
    args: [email],
  });

  if (existingRes.rows.length > 0) {
    await client.execute({
      sql: `UPDATE users SET name = ?, password_hash = ?, password_salt = ?, role = ?, active = 1, updated_at = ? WHERE email = ?`,
      args: [name, passwordHash, salt, role, timestamp, email],
    });
    console.log(`Updated admin account: ${email} (${role})`);
  } else {
    await client.execute({
      sql: `INSERT INTO users (id, name, email, password_hash, password_salt, role, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      args: [randomUUID(), name, email, passwordHash, salt, role, timestamp, timestamp],
    });
    console.log(`Created admin account: ${email} (${role})`);
  }
}

main().catch((err) => {
  console.error("Failed to configure admin:", err);
  process.exit(1);
});
