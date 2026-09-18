import type { Client } from "@libsql/client";
import { randomUUID } from "node:crypto";
import { chooseWinner, createBracket, renameEntries, type Tournament, type Bracket } from "./bracket.ts";

type Row = { id: string; sport_slug: string; title: string; entry_kind: "player" | "team"; version: number; bracket: string };
export type Mutation =
  | { kind: "lineup" | "rename"; names: string }
  | { kind: "winner"; matchId: string; entryId: string | null }
  | { kind: "reset" }
  | { kind: "details"; matchId: string; date: string; time: string; venue: string; scoreA: string; scoreB: string };

export async function initializeTournaments(db: Client, catalog: { slug: string; name: string }[]) {
  const existing = await db.execute("SELECT id, sport_slug, title FROM tournaments");
  const existingSet = new Set(existing.rows.map(r => `${String(r.sport_slug)}:${String(r.title).toLowerCase()}`));
  const missing = catalog.filter(sport => !existingSet.has(`${sport.slug}:${sport.name.toLowerCase()}`));

  if (missing.length > 0) {
    await db.batch(
      missing.map(sport => ({
        sql: "INSERT OR IGNORE INTO tournaments(id,sport_slug,title,entry_kind,bracket) VALUES(?,?,?,?,?)",
        args: [
          sport.slug,
          sport.slug,
          sport.name,
          ["football", "cricket"].includes(sport.slug) ? "team" : "player",
          JSON.stringify({ entries: [], rounds: [] }),
        ],
      })),
      "write"
    );
  }
}

function decode(row: Row): Tournament {
  return {
    id: String(row.id),
    sportSlug: String(row.sport_slug),
    title: String(row.title),
    entryKind: row.entry_kind as "player" | "team",
    version: Number(row.version),
    bracket: JSON.parse(String(row.bracket)) as Bracket,
  };
}

export async function listTournaments(db: Client): Promise<Tournament[]> {
  const res = await db.execute("SELECT * FROM tournaments ORDER BY rowid");
  return (res.rows as unknown as Row[]).map(decode);
}

export async function addTournament(db: Client, sportSlug: string, title: string, entryKind: string): Promise<string> {
  title = title.trim();
  if (!title || title.length > 80 || /[\u0000-\u001f]/.test(title)) throw new Error("Enter a section name of 1–80 characters.");
  if (!["player", "team"].includes(entryKind)) throw new Error("Choose players or teams.");
  
  const existing = await db.execute({
    sql: "SELECT id FROM tournaments WHERE sport_slug = ? AND title = ? COLLATE NOCASE",
    args: [sportSlug, title],
  });
  if (existing.rows.length > 0) throw new Error("A section with this name already exists for this sport.");
  
  const id = randomUUID();
  await db.execute({
    sql: "INSERT INTO tournaments(id,sport_slug,title,entry_kind,bracket) VALUES(?,?,?,?,?)",
    args: [id, sportSlug, title, entryKind, JSON.stringify({ entries: [], rounds: [] })],
  });
  return id;
}

export async function mutateTournament(db: Client, id: string, version: number, actor: string, mutation: Mutation): Promise<Tournament> {
  if (!Number.isSafeInteger(version) || version < 0) throw new Error("Invalid version. Refresh and try again.");
  
  const tx = await db.transaction("write");
  try {
    const res = await tx.execute({
      sql: "SELECT * FROM tournaments WHERE id = ?",
      args: [id],
    });
    const row = res.rows[0] as unknown as Row | undefined;
    if (!row) throw new Error("Section not found.");
    if (Number(row.version) !== version) throw new Error("Another update was saved. Refresh this page before trying again.");
    
    let bracket = decode(row).bracket;
    switch (mutation.kind) {
      case "lineup":
        if (bracket.rounds.length) throw new Error("This bracket is already published. Rename entries or reset it first.");
        bracket = createBracket(mutation.names); break;
      case "rename": bracket = renameEntries(bracket, mutation.names); break;
      case "reset": bracket = { entries: [], rounds: [] }; break;
      case "winner": bracket = chooseWinner(bracket, mutation.matchId, mutation.entryId); break;
      case "details": {
        const match = bracket.rounds.flat().find(item => item.id === mutation.matchId);
        if (!match || match.bye) throw new Error("Choose a playable match.");
        if (mutation.date && (!/^\d{4}-\d{2}-\d{2}$/.test(mutation.date) || Number.isNaN(Date.parse(mutation.date)) || new Date(mutation.date).toISOString().slice(0, 10) !== mutation.date)) throw new Error("Choose a valid date.");
        if (mutation.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(mutation.time)) throw new Error("Choose a valid time.");
        if (mutation.venue.trim().length > 100) throw new Error("Venue must be no longer than 100 characters.");
        if (![mutation.scoreA, mutation.scoreB].every(score => score === "" || /^\d{1,3}$/.test(score))) throw new Error("Scores must be whole numbers from 0 to 999, or blank.");
        if ((!match.a || !match.b) && (mutation.scoreA || mutation.scoreB)) throw new Error("Wait for both opponents before entering scores.");
        Object.assign(match, { date: mutation.date, time: mutation.time, venue: mutation.venue.trim(), scoreA: mutation.scoreA, scoreB: mutation.scoreB });
        break;
      }
    }
    
    await tx.execute({
      sql: "UPDATE tournaments SET bracket = ?, version = version + 1 WHERE id = ?",
      args: [JSON.stringify(bracket), id],
    });
    await tx.execute({
      sql: "INSERT INTO tournament_changes(id,tournament_id,actor_id,action,previous_bracket,created_at) VALUES(?,?,?,?,?,?)",
      args: [randomUUID(), id, actor, mutation.kind, String(row.bracket), Date.now()],
    });
    await tx.commit();
    return { ...decode(row), bracket, version: Number(row.version) + 1 };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}
