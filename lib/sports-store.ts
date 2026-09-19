import type { Client } from "@libsql/client";
import type { Sport } from "./data";

export async function listSports(db: Client): Promise<Sport[]> {
  const res = await db.execute("SELECT slug, name, icon, category, color, detail FROM sports ORDER BY created_at ASC, rowid ASC");
  return res.rows.map(r => ({
    slug: String(r.slug),
    name: String(r.name),
    icon: String(r.icon),
    category: r.category as "Indoor" | "Outdoor",
    color: String(r.color),
    detail: String(r.detail || ""),
    participants: 0,
    matches: 0,
    stage: "",
  }));
}

export async function initializeSports(db: Client, defaultCatalog: Sport[]): Promise<void> {
  const existing = await db.execute("SELECT count(*) as count FROM sports");
  const count = Number(existing.rows[0]?.count || 0);
  if (count === 0 && defaultCatalog.length > 0) {
    const now = Date.now();
    await db.batch(
      defaultCatalog.map((sport, index) => ({
        sql: "INSERT OR IGNORE INTO sports (slug, name, icon, category, color, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [
          sport.slug,
          sport.name,
          sport.icon,
          sport.category,
          sport.color,
          sport.detail,
          now + index,
        ],
      })),
      "write"
    );
  }
}

export async function addSport(
  db: Client,
  data: {
    name: string;
    slug?: string;
    icon: string;
    category: "Indoor" | "Outdoor";
    color: string;
    detail?: string;
  }
): Promise<Sport> {
  const name = data.name.trim();
  if (!name || name.length > 50) {
    throw new Error("Sport name must be between 1 and 50 characters.");
  }

  let slug = (data.slug || "").trim().toLowerCase();
  if (!slug) {
    slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    throw new Error("Invalid sport slug. Use letters, numbers, and hyphens.");
  }

  const icon = data.icon.trim() || "🏆";
  const category = data.category === "Outdoor" ? "Outdoor" : "Indoor";
  const color = data.color.trim() || "#72d2ff";
  const detail = (data.detail || "").trim() || "Tournament";

  const existing = await db.execute({
    sql: "SELECT slug FROM sports WHERE slug = ?",
    args: [slug],
  });
  if (existing.rows.length > 0) {
    throw new Error(`A sport with identifier '${slug}' already exists.`);
  }

  await db.execute({
    sql: "INSERT INTO sports (slug, name, icon, category, color, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [slug, name, icon, category, color, detail, Date.now()],
  });

  return {
    slug,
    name,
    icon,
    category,
    color,
    detail,
    participants: 0,
    matches: 0,
    stage: "",
  };
}

export async function deleteSport(db: Client, slug: string): Promise<void> {
  if (!slug) throw new Error("Sport identifier is required.");

  const tx = await db.transaction("write");
  try {
    // Delete any tournaments and changes associated with this sport
    const tournaments = await tx.execute({
      sql: "SELECT id FROM tournaments WHERE sport_slug = ?",
      args: [slug],
    });
    for (const row of tournaments.rows) {
      const tournamentId = String(row.id);
      await tx.execute({
        sql: "DELETE FROM tournament_changes WHERE tournament_id = ?",
        args: [tournamentId],
      });
    }
    await tx.execute({
      sql: "DELETE FROM tournaments WHERE sport_slug = ?",
      args: [slug],
    });
    await tx.execute({
      sql: "DELETE FROM sports WHERE slug = ?",
      args: [slug],
    });
    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}
