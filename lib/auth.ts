import "server-only";

import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { cache } from "react";
import { getDatabase } from "@/lib/db";

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

function recordAudit(userId: string | null, action: string, details?: string) {
  getDatabase().prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
    VALUES (?, ?, ?, 'AUTH', ?, ?, ?)
  `).run(randomUUID(), userId, action, userId, details ?? null, Date.now());
}

function registerFailedAttempt(email: string, currentCount: number) {
  const failedCount = currentCount + 1;
  const blockedUntil = failedCount >= maxLoginAttempts ? Date.now() + lockDuration : null;
  getDatabase().prepare(`
    INSERT INTO login_attempts (email, failed_count, last_failed_at, blocked_until)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      failed_count = excluded.failed_count,
      last_failed_at = excluded.last_failed_at,
      blocked_until = excluded.blocked_until
  `).run(email, failedCount, Date.now(), blockedUntil);
}

export async function authenticate(emailInput: string, password: string) {
  const email = emailInput.trim().toLowerCase();
  const database = getDatabase();
  const attempt = database.prepare("SELECT failed_count, blocked_until FROM login_attempts WHERE email = ?").get(email) as { failed_count: number; blocked_until: number | null } | undefined;

  if (attempt?.blocked_until && attempt.blocked_until > Date.now()) {
    return { ok: false as const, reason: "locked" as const };
  }

  const user = database.prepare(`
    SELECT id, name, email, role, active, password_hash, password_salt
    FROM users WHERE email = ?
  `).get(email) as StoredUser | undefined;

  const valid = user?.active === 1 && await verifyPassword(password, user.password_salt, user.password_hash);
  if (!user || !valid) {
    registerFailedAttempt(email, attempt?.failed_count ?? 0);
    recordAudit(user?.id ?? null, "LOGIN_FAILED", email);
    return { ok: false as const, reason: "invalid" as const };
  }

  database.prepare("DELETE FROM login_attempts WHERE email = ?").run(email);
  recordAudit(user.id, "LOGIN_SUCCEEDED");
  return { ok: true as const, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + sessionDuration;
  const database = getDatabase();
  database.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
  database.prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").run(digest(token), userId, expiresAt, Date.now());
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
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return null;
  const database = getDatabase();
  const user = database.prepare(`
    SELECT users.id, users.name, users.email, users.role
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.id = ? AND sessions.expires_at > ? AND users.active = 1
  `).get(digest(token), Date.now()) as AdminUser | undefined;
  return user ?? null;
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
    const session = getDatabase().prepare("SELECT user_id FROM sessions WHERE id = ?").get(digest(token)) as { user_id: string } | undefined;
    getDatabase().prepare("DELETE FROM sessions WHERE id = ?").run(digest(token));
    if (session) recordAudit(session.user_id, "LOGOUT");
  }
  cookieStore.delete(sessionCookie);
}
