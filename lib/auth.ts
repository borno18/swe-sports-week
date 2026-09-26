import "server-only";

import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { cache } from "react";
import { ensureDatabaseInitialized } from "@/lib/db";

const scrypt = promisify(scryptCallback);
const sessionCookie = "sw_session";
const sessionDuration = 12 * 60 * 60 * 1000;
const maxLoginAttempts = 5;
const lockDuration = 15 * 60 * 1000;

export type AdminRole = "SUPER_ADMIN" | "TOURNAMENT_ADMIN" | "RESULT_MANAGER";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
};

type StoredUser = AdminUser & {
  password_hash: string;
  password_salt: string;
  active: number;
};

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function verifyPassword(password: string, salt: string, expectedHash: string) {
  const candidate = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHash, "hex");
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

async function recordAudit(userId: string | null, action: string, details?: string) {
  const db = await ensureDatabaseInitialized();
  await db.execute({
    sql: `
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, 'AUTH', ?, ?, ?)
    `,
    args: [randomUUID(), userId, action, userId, details ?? null, Date.now()],
  });
}

async function registerFailedAttempt(email: string, currentCount: number) {
  const failedCount = currentCount + 1;
  const blockedUntil = failedCount >= maxLoginAttempts ? Date.now() + lockDuration : null;
  const db = await ensureDatabaseInitialized();
  await db.execute({
    sql: `
      INSERT INTO login_attempts (email, failed_count, last_failed_at, blocked_until)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        failed_count = excluded.failed_count,
        last_failed_at = excluded.last_failed_at,
        blocked_until = excluded.blocked_until
    `,
    args: [email, failedCount, Date.now(), blockedUntil],
  });
}

export async function authenticate(emailInput: string, password: string) {
  const email = emailInput.trim().toLowerCase();
  const db = await ensureDatabaseInitialized();
  const [attemptRes, userRes] = await db.batch([
    { sql: "SELECT failed_count, blocked_until FROM login_attempts WHERE email = ?", args: [email] },
    { sql: "SELECT id, name, email, role, active, password_hash, password_salt FROM users WHERE email = ?", args: [email] },
  ], "read");
  const attempt = attemptRes.rows[0] as unknown as { failed_count: number; blocked_until: number | null } | undefined;

  if (attempt?.blocked_until && Number(attempt.blocked_until) > Date.now()) {
    return { ok: false as const, reason: "locked" as const };
  }

  const user = userRes.rows[0] as unknown as StoredUser | undefined;

  const valid = user && Number(user.active) === 1 && (await verifyPassword(password, String(user.password_salt), String(user.password_hash)));
  if (!user || !valid) {
    await registerFailedAttempt(email, attempt?.failed_count ? Number(attempt.failed_count) : 0);
    await recordAudit(user?.id ? String(user.id) : null, "LOGIN_FAILED", email);
    return { ok: false as const, reason: "invalid" as const };
  }

  await db.batch([
    { sql: "DELETE FROM login_attempts WHERE email = ?", args: [email] },
    { sql: "INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at) VALUES (?, ?, 'LOGIN_SUCCEEDED', 'AUTH', ?, NULL, ?)", args: [randomUUID(), String(user.id), String(user.id), Date.now()] },
  ], "write");
  return { ok: true as const, user: { id: String(user.id), name: String(user.name), email: String(user.email), role: user.role } };
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + sessionDuration;
  const db = await ensureDatabaseInitialized();
  await db.batch([
    { sql: "DELETE FROM sessions WHERE expires_at <= ?", args: [Date.now()] },
    { sql: "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)", args: [digest(token), userId, expiresAt, Date.now()] },
  ], "write");

  const cookieStore = await cookies();
  cookieStore.set(sessionCookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export const getCurrentAdmin = cache(async (): Promise<AdminUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  if (!token) return null;
  const db = await ensureDatabaseInitialized();
  const res = await db.execute({
    sql: `
      SELECT users.id, users.name, users.email, users.role
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.id = ? AND sessions.expires_at > ? AND users.active = 1
    `,
    args: [digest(token), Date.now()],
  });
  const user = res.rows[0] as unknown as AdminUser | undefined;
  if (!user) return null;
  return {
    id: String(user.id),
    name: String(user.name),
    email: String(user.email),
    role: user.role,
  };
});

export async function requireAdmin(roles?: AdminRole[]) {
  const user = await getCurrentAdmin();
  if (!user || (roles && !roles.includes(user.role))) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  if (token) {
    const db = await ensureDatabaseInitialized();
    const res = await db.execute({
      sql: "SELECT user_id FROM sessions WHERE id = ?",
      args: [digest(token)],
    });
    const session = res.rows[0] as unknown as { user_id: string } | undefined;
    await db.execute({
      sql: "DELETE FROM sessions WHERE id = ?",
      args: [digest(token)],
    });
    if (session) await recordAudit(String(session.user_id), "LOGOUT");
  }
  cookieStore.delete(sessionCookie);
}
