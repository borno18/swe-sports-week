import type { Client } from "@libsql/client";
import { randomUUID } from "node:crypto";
import {
  chooseWinner,
  createBracket,
  createFlexibleBracket,
  createRoundRobin,
  flexAddMatch,
  flexAddRound,
  flexRemoveMatch,
  flexSetAdvancers,
  flexUpdateParticipants,
  renameEntries,
  type Tournament,
  type Bracket,
  type TournamentFormat,
} from "./bracket.ts";

type Row = {
  id: string;
  sport_slug: string;
  title: string;
  entry_kind: "player" | "team";
  version: number;
  bracket: string;
};

export type Mutation =
  | {
      kind: "lineup" | "rename";
      names: string;
      format?: TournamentFormat;
      legs?: number;
    }
  | { kind: "winner"; matchId: string; entryId: string | null }
  | { kind: "reset" }
  | {
      kind: "details";
      matchId: string;
      date: string;
      time: string;
      venue: string;
      scoreA: string;
      scoreB: string;
      date2?: string;
      time2?: string;
      venue2?: string;
      scoreA2?: string;
      scoreB2?: string;
    }
  | { kind: "flex_add_match"; round: number; participantIds: string[] }
  | { kind: "flex_remove_match"; matchId: string }
  | { kind: "flex_set_advancers"; matchId: string; advancerIds: string[] }
  | { kind: "flex_update_participants"; matchId: string; participantIds: string[] }
  | { kind: "flex_add_round" };

export async function initializeTournaments(db: Pick<Client, "execute" | "batch">, catalog: { slug: string; name: string }[]) {
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
          JSON.stringify({ entries: [], rounds: [], format: "knockout", legs: 1 }),
        ],
      })),
      "write"
    );
  }
}

function decode(row: Row): Tournament {
  const parsed = JSON.parse(String(row.bracket)) as Bracket;
  if (!parsed.format) parsed.format = "knockout";
  if (!parsed.legs) parsed.legs = 1;
  return {
    id: String(row.id),
    sportSlug: String(row.sport_slug),
    title: String(row.title),
    entryKind: row.entry_kind as "player" | "team",
    version: Number(row.version),
    bracket: parsed,
  };
}

export async function listTournaments(db: Client): Promise<Tournament[]> {
  const res = await db.execute("SELECT * FROM tournaments ORDER BY rowid");
  return (res.rows as unknown as Row[]).map(decode);
}

export async function addTournament(
  db: Client,
  sportSlug: string,
  title: string,
  entryKind: string,
  format: TournamentFormat = "knockout",
  legs: number = 1
): Promise<string> {
  title = title.trim();
  if (!title || title.length > 80 || /[\u0000-\u001f]/.test(title)) {
    throw new Error("Enter a section name of 1–80 characters.");
  }
  if (!["player", "team"].includes(entryKind)) {
    throw new Error("Choose players or teams.");
  }

  const existing = await db.execute({
    sql: "SELECT id FROM tournaments WHERE sport_slug = ? AND title = ? COLLATE NOCASE",
    args: [sportSlug, title],
  });
  if (existing.rows.length > 0) {
    throw new Error("A section with this name already exists for this sport.");
  }

  const id = randomUUID();
  const initialBracket: Bracket = {
    entries: [],
    rounds: [],
    format,
    legs: legs === 2 ? 2 : 1,
  };

  await db.execute({
    sql: "INSERT INTO tournaments(id,sport_slug,title,entry_kind,bracket) VALUES(?,?,?,?,?)",
    args: [id, sportSlug, title, entryKind, JSON.stringify(initialBracket)],
  });
  return id;
}

export async function deleteTournament(db: Client, id: string): Promise<void> {
  if (!id) throw new Error("Tournament ID is required.");
  const tx = await db.transaction("write");
  try {
    await tx.execute({
      sql: "DELETE FROM tournament_changes WHERE tournament_id = ?",
      args: [id],
    });
    await tx.execute({
      sql: "DELETE FROM tournaments WHERE id = ?",
      args: [id],
    });
    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

export async function mutateTournament(
  db: Client,
  id: string,
  version: number,
  actor: string,
  mutation: Mutation
): Promise<Tournament> {
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
      case "lineup": {
        if (bracket.rounds.length) throw new Error("This bracket is already published. Rename entries or reset it first.");
        const chosenFormat = mutation.format || bracket.format || "knockout";
        const chosenLegs = mutation.legs || bracket.legs || 1;
        if (chosenFormat === "round_robin") {
          bracket = createRoundRobin(mutation.names, chosenLegs);
        } else if (chosenFormat === "flexible") {
          bracket = createFlexibleBracket(mutation.names);
        } else {
          bracket = createBracket(mutation.names, chosenLegs);
        }
        break;
      }
      case "rename":
        bracket = renameEntries(bracket, mutation.names);
        break;
      case "reset":
        bracket = {
          entries: [],
          rounds: [],
          format: bracket.format || "knockout",
          legs: bracket.legs || 1,
        };
        break;
      case "winner":
        bracket = chooseWinner(bracket, mutation.matchId, mutation.entryId);
        break;
      case "details": {
        const match = bracket.rounds.flat().find(item => item.id === mutation.matchId);
        if (!match || match.bye) throw new Error("Choose a playable match.");
        if (
          mutation.date &&
          (!/^\d{4}-\d{2}-\d{2}$/.test(mutation.date) ||
            Number.isNaN(Date.parse(mutation.date)) ||
            new Date(mutation.date).toISOString().slice(0, 10) !== mutation.date)
        ) {
          throw new Error("Choose a valid date.");
        }
        if (mutation.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(mutation.time)) {
          throw new Error("Choose a valid time.");
        }
        if (mutation.venue.trim().length > 100) {
          throw new Error("Venue must be no longer than 100 characters.");
        }
        if (![mutation.scoreA, mutation.scoreB].every(score => score === "" || /^\d{1,3}$/.test(score))) {
          throw new Error("Scores must be whole numbers from 0 to 999, or blank.");
        }
        if ((!match.a || !match.b) && (mutation.scoreA || mutation.scoreB)) {
          throw new Error("Wait for both opponents before entering scores.");
        }

        // Leg 2 validation if present
        if (mutation.scoreA2 !== undefined && mutation.scoreB2 !== undefined) {
          if (![mutation.scoreA2, mutation.scoreB2].every(score => score === "" || /^\d{1,3}$/.test(score))) {
            throw new Error("Leg 2 scores must be whole numbers from 0 to 999, or blank.");
          }
        }

        Object.assign(match, {
          date: mutation.date,
          time: mutation.time,
          venue: mutation.venue.trim(),
          scoreA: mutation.scoreA,
          scoreB: mutation.scoreB,
          scoreA2: mutation.scoreA2 !== undefined ? mutation.scoreA2 : match.scoreA2,
          scoreB2: mutation.scoreB2 !== undefined ? mutation.scoreB2 : match.scoreB2,
          date2: mutation.date2 !== undefined ? mutation.date2 : match.date2,
          time2: mutation.time2 !== undefined ? mutation.time2 : match.time2,
          venue2: mutation.venue2 !== undefined ? mutation.venue2.trim() : match.venue2,
        });
        break;
      }
      case "flex_add_match":
        bracket = flexAddMatch(bracket, mutation.round, mutation.participantIds);
        break;
      case "flex_remove_match":
        bracket = flexRemoveMatch(bracket, mutation.matchId);
        break;
      case "flex_set_advancers":
        bracket = flexSetAdvancers(bracket, mutation.matchId, mutation.advancerIds);
        break;
      case "flex_update_participants":
        bracket = flexUpdateParticipants(bracket, mutation.matchId, mutation.participantIds);
        break;
      case "flex_add_round":
        bracket = flexAddRound(bracket);
        break;
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
