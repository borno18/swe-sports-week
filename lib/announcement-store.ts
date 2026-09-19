import type { Client } from "@libsql/client";
import { randomUUID } from "node:crypto";

export type AnnouncementLevel = "general" | "important" | "urgent" | "update";

export type Announcement = {
  id: string;
  level: AnnouncementLevel;
  title: string;
  body: string;
  time: string;
  createdAt: number;
  createdBy?: string | null;
  authorName?: string | null;
};

export async function listAnnouncements(db: Client): Promise<Announcement[]> {
  const res = await db.execute(`
    SELECT a.id, a.level, a.title, a.body, a.time, a.created_at, a.created_by, u.name as author_name
    FROM announcements a
    LEFT JOIN users u ON u.id = a.created_by
    ORDER BY a.created_at DESC
  `);
  return res.rows.map(row => ({
    id: String(row.id),
    level: String(row.level) as AnnouncementLevel,
    title: String(row.title),
    body: String(row.body),
    time: String(row.time),
    createdAt: Number(row.created_at),
    createdBy: row.created_by ? String(row.created_by) : null,
    authorName: row.author_name ? String(row.author_name) : null,
  }));
}

export async function addAnnouncement(
  db: Client,
  data: {
    level: AnnouncementLevel;
    title: string;
    body: string;
    time?: string;
    createdBy: string;
  }
): Promise<string> {
  const title = data.title.trim();
  const body = data.body.trim();
  let time = (data.time || "").trim();

  if (!title || title.length > 150) {
    throw new Error("Title must be between 1 and 150 characters.");
  }
  if (!body || body.length > 2000) {
    throw new Error("Announcement body must be between 1 and 2,000 characters.");
  }
  const validLevels: AnnouncementLevel[] = ["general", "important", "urgent", "update"];
  if (!validLevels.includes(data.level)) {
    throw new Error("Invalid announcement level.");
  }

  if (!time) {
    time = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date());
  }

  const id = randomUUID();
  await db.execute({
    sql: `
      INSERT INTO announcements (id, level, title, body, time, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    args: [id, data.level, title, body, time, Date.now(), data.createdBy],
  });
  return id;
}

export async function deleteAnnouncement(db: Client, id: string): Promise<void> {
  if (!id) throw new Error("Invalid announcement ID.");
  await db.execute({
    sql: "DELETE FROM announcements WHERE id = ?",
    args: [id],
  });
}
