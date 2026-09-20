import type { Client } from "@libsql/client";
import type { Sport } from "./data.ts";
import { initializeSports, listSports } from "./sports-store.ts";
import { initializeTournaments } from "./tournament-store.ts";

/** Seed a new database and ensure newly added catalog sports exist. */
export async function initializeCatalog(db: Client, catalog: Sport[]) {
  await db.execute("CREATE TABLE IF NOT EXISTS app_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
  const tx = await db.transaction("write");
  try {
    const now = Date.now();
    for (let i = 0; i < catalog.length; i++) {
      const sport = catalog[i];
      await tx.execute({
        sql: "INSERT OR IGNORE INTO sports (slug, name, icon, category, color, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [sport.slug, sport.name, sport.icon, sport.category, sport.color, sport.detail, now + i],
      });
    }
    await initializeTournaments(tx, await listSports(tx));
    await tx.execute("INSERT OR REPLACE INTO app_metadata(key,value) VALUES('catalog_seeded','1')");
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
}
