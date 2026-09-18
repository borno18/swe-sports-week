import type { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { chooseWinner, createBracket, renameEntries, type Tournament, type Bracket } from "./bracket.ts";

type Row = { id: string; sport_slug: string; title: string; entry_kind: "player" | "team"; version: number; bracket: string };
export type Mutation =
  | { kind: "lineup" | "rename"; names: string }
  | { kind: "winner"; matchId: string; entryId: string | null }
  | { kind: "reset" }
  | { kind: "details"; matchId: string; date: string; time: string; venue: string; scoreA: string; scoreB: string };

export function initializeTournaments(db: DatabaseSync, catalog: { slug: string; name: string }[]) {
  db.exec(`CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY, sport_slug TEXT NOT NULL, title TEXT NOT NULL COLLATE NOCASE,
    entry_kind TEXT NOT NULL CHECK(entry_kind IN ('player','team')), version INTEGER NOT NULL DEFAULT 0,
    bracket TEXT NOT NULL, UNIQUE(sport_slug, title)
  );
  CREATE TABLE IF NOT EXISTS tournament_changes (
    id TEXT PRIMARY KEY, tournament_id TEXT NOT NULL, actor_id TEXT NOT NULL,
    action TEXT NOT NULL, previous_bracket TEXT NOT NULL, created_at INTEGER NOT NULL
  );`);
  const insert = db.prepare("INSERT OR IGNORE INTO tournaments(id,sport_slug,title,entry_kind,bracket) VALUES(?,?,?,?,?)");
  for (const sport of catalog) insert.run(sport.slug, sport.slug, sport.name, ["football", "cricket"].includes(sport.slug) ? "team" : "player", JSON.stringify({ entries: [], rounds: [] }));
}

function decode(row: Row): Tournament {
  return { id: row.id, sportSlug: row.sport_slug, title: row.title, entryKind: row.entry_kind, version: row.version, bracket: JSON.parse(row.bracket) as Bracket };
}

export function listTournaments(db: DatabaseSync) {
  return (db.prepare("SELECT * FROM tournaments ORDER BY rowid").all() as Row[]).map(decode);
}

export function addTournament(db: DatabaseSync, sportSlug: string, title: string, entryKind: string) {
  title = title.trim();
  if (!title || title.length > 80 || /[\u0000-\u001f]/.test(title)) throw new Error("Enter a section name of 1–80 characters.");
  if (!["player", "team"].includes(entryKind)) throw new Error("Choose players or teams.");
  if (db.prepare("SELECT id FROM tournaments WHERE sport_slug = ? AND title = ? COLLATE NOCASE").get(sportSlug, title)) throw new Error("A section with this name already exists for this sport.");
  const id = randomUUID();
  db.prepare("INSERT INTO tournaments(id,sport_slug,title,entry_kind,bracket) VALUES(?,?,?,?,?)").run(id, sportSlug, title, entryKind, JSON.stringify({ entries: [], rounds: [] }));
  return id;
}

export function mutateTournament(db: DatabaseSync, id: string, version: number, actor: string, mutation: Mutation) {
  if (!Number.isSafeInteger(version) || version < 0) throw new Error("Invalid version. Refresh and try again.");
  db.exec("BEGIN IMMEDIATE");
  try {
    const row = db.prepare("SELECT * FROM tournaments WHERE id = ?").get(id) as Row | undefined;
    if (!row) throw new Error("Section not found.");
    if (row.version !== version) throw new Error("Another update was saved. Refresh this page before trying again.");
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
    db.prepare("UPDATE tournaments SET bracket = ?, version = version + 1 WHERE id = ?").run(JSON.stringify(bracket), id);
    db.prepare("INSERT INTO tournament_changes(id,tournament_id,actor_id,action,previous_bracket,created_at) VALUES(?,?,?,?,?,?)").run(randomUUID(), id, actor, mutation.kind, row.bracket, Date.now());
    db.exec("COMMIT");
    return { ...decode(row), bracket, version: row.version + 1 };
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}
