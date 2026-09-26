import type { Client } from "@libsql/client";
import type { Sport } from "./data.ts";
import { initializeSports, listSports } from "./sports-store.ts";
import { initializeTournaments } from "./tournament-store.ts";

/** Seed a new database once without restoring sections an organizer deleted. */
export async function initializeCatalog(db: Client, catalog: Sport[]) {
  await db.execute("CREATE TABLE IF NOT EXISTS app_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
  // Warm databases need no write transaction. Recheck inside the transaction for concurrent first boots.
  const marker = await db.execute("SELECT value FROM app_metadata WHERE key = 'catalog_seeded'");
  if (marker.rows.length) return;
  const tx = await db.transaction("write");
  try {
    const seeded = await tx.execute("SELECT value FROM app_metadata WHERE key = 'catalog_seeded'");
    if (!seeded.rows.length) {
      const existing = await tx.execute("SELECT (SELECT COUNT(*) FROM sports) + (SELECT COUNT(*) FROM tournaments) AS count");
      if (Number(existing.rows[0].count) === 0) {
        await initializeSports(tx, catalog);
        await initializeTournaments(tx, await listSports(tx));
      }
      await tx.execute("INSERT INTO app_metadata(key,value) VALUES('catalog_seeded','1')");
    }
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
}
