import "server-only";
import { createHash } from "node:crypto";
import { tournamentDatabase } from "./tournaments";

/** Read identifiers and versions, never bracket JSON or admin/session data. */
export async function getPublicRevision() {
  const db = await tournamentDatabase();
  const result = await db.execute(`
    SELECT 't:' || id AS id, CAST(version AS TEXT) AS version FROM tournaments
    UNION ALL SELECT 's:' || slug, CAST(created_at AS TEXT) FROM sports
    UNION ALL SELECT 'a:' || id, CAST(created_at AS TEXT) FROM announcements
    UNION ALL SELECT 'r:' || sport_slug, CAST(updated_at AS TEXT) FROM sport_rules
    ORDER BY id
  `);
  return createHash("sha256").update(JSON.stringify(result.rows)).digest("hex").slice(0, 24);
}
