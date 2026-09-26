import type { Client } from "@libsql/client";
import { gameRules, type GameRule } from "./data.ts";

async function ensureRulesTable(db: Pick<Client, "execute">) {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sport_rules (
        sport_slug TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        format TEXT NOT NULL DEFAULT 'knockout',
        advancement TEXT NOT NULL,
        rules_text TEXT NOT NULL,
        rounds TEXT,
        tiebreaker TEXT,
        updated_at INTEGER NOT NULL
      )
    `);
  } catch {
    // Ignore if already created
  }
}

export async function getSportRule(db: Pick<Client, "execute">, sportSlug: string): Promise<GameRule> {
  try {
    const res = await db.execute({
      sql: "SELECT sport_slug, title, format, advancement, rules_text, rounds, tiebreaker FROM sport_rules WHERE sport_slug = ?",
      args: [sportSlug],
    });

    if (res.rows.length > 0) {
      const row = res.rows[0];
      const rulesArray = String(row.rules_text || "")
        .split("\n")
        .map(r => r.trim())
        .filter(Boolean);

      return {
        sportSlug: String(row.sport_slug),
        title: String(row.title),
        format: (String(row.format) as "knockout" | "flexible" | "round_robin") || "knockout",
        advancement: String(row.advancement),
        rules: rulesArray.length ? rulesArray : ["অফিসিয়াল টুর্নামেন্ট নিয়মাবলি অনুসরণ করা হবে।"],
        rounds: row.rounds ? String(row.rounds) : undefined,
        tiebreaker: row.tiebreaker ? String(row.tiebreaker) : undefined,
      };
    }
  } catch {
    await ensureRulesTable(db);
  }

  // Fallback to default in-memory rules
  const defaultRule = gameRules[sportSlug];
  if (defaultRule) return defaultRule;

  // Fallback generic rule for unknown / newly created custom sports
  return {
    sportSlug,
    title: `${sportSlug.toUpperCase()} Tournament Rules`,
    format: "knockout",
    advancement: "সিঙ্গেল এলিমিনেশন নকআউট · বিজয়ী পরবর্তী রাউন্ডে উত্তীর্ণ হবে",
    rules: [
      "অফিসিয়াল নিয়মাবলি অনুযায়ী খেলা পরিচালিত হবে।",
      "ম্যাচ রেফারির সিদ্ধান্তই চূড়ান্ত বলে গণ্য হবে।",
      "নির্দিষ্ট সময়ে খেলায় উপস্থিত না হলে ওয়াকওভার প্রদান করা হবে।"
    ],
    rounds: "নকআউট রাউন্ড",
    tiebreaker: "টাই হলে অতিরিক্ত সময় অথবা টাইব্রেকার খেলা হবে।"
  };
}

export async function saveSportRule(
  db: Pick<Client, "execute">,
  rule: GameRule
): Promise<void> {
  await ensureRulesTable(db);
  const rulesText = Array.isArray(rule.rules) ? rule.rules.join("\n") : String(rule.rules);
  await db.execute({
    sql: `INSERT INTO sport_rules (sport_slug, title, format, advancement, rules_text, rounds, tiebreaker, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(sport_slug) DO UPDATE SET
            title = excluded.title,
            format = excluded.format,
            advancement = excluded.advancement,
            rules_text = excluded.rules_text,
            rounds = excluded.rounds,
            tiebreaker = excluded.tiebreaker,
            updated_at = excluded.updated_at`,
    args: [
      rule.sportSlug,
      rule.title,
      rule.format,
      rule.advancement,
      rulesText,
      rule.rounds || null,
      rule.tiebreaker || null,
      Date.now(),
    ],
  });
}

export async function seedAllDefaultRules(db: Pick<Client, "execute">): Promise<void> {
  for (const [slug, rule] of Object.entries(gameRules)) {
    const existing = await db.execute({
      sql: "SELECT 1 FROM sport_rules WHERE sport_slug = ?",
      args: [slug],
    });
    if (existing.rows.length === 0) {
      await saveSportRule(db, rule);
    }
  }
}
