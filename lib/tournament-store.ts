import type { Client } from "@libsql/client";
import { randomUUID } from "node:crypto";
import {
  addMatchToTournament,
  addParticipantToMatch,
  chooseWinner,
  createBracket,
  createConfiguredBracket,
  confirmGroupQualifiers,
  refreshGroupQualification,
  isMatchReady,
  createFlexibleBracket,
  createRoundRobin,
  flexAddMatch,
  flexAddRound,
  flexRemoveMatch,
  flexSetAdvancers,
  flexUpdateParticipants,
  getMatchParticipants,
  parseCricketOvers,
  type CricketInnings,
  removeMatchFromTournament,
  removeParticipantFromMatch,
  renameEntries,
  type Tournament,
  type Bracket,
  type TournamentFormat,
  type BracketOptions,
  type RoundConfig,
  type GroupStageConfig,
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
      playersPerGame?: number;
      totalGames?: number;
      roundConfig?: RoundConfig[];
      hasGroupStage?: boolean;
      groupStageConfig?: GroupStageConfig;
    }
  | { kind: "winner"; matchId: string; entryId: string | null }
  | { kind: "reset" }
  | { kind: "qualifiers"; groupId: string; entryIds: string[] }
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
      scores?: Record<string, string>;
      cricketScores?: Record<string, { score: string; overs: string; allOut: boolean }>;
      participants?: string[];
    }
  | { kind: "add_match"; round: number; participantIds: string[] }
  | { kind: "delete_match"; matchId: string }
  | { kind: "add_participant"; matchId: string; participantId: string }
  | { kind: "remove_participant"; matchId: string; participantId: string }
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
  if (row.sport_slug === "cricket") parsed.sportSlug = "cricket";
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

/** Navigation needs counts, not every section's complete draw and score history. */
export async function readAdminTournaments(db: Client, section?: string, includeSelected = true) {
  const summariesSql = `SELECT id, sport_slug, title,
    COALESCE(json_array_length(bracket, '$.entries'), 0) AS entry_count,
    COALESCE(json_array_length(bracket, '$.rounds'), 0) AS round_count,
    COALESCE(json_extract(bracket, '$.format'), 'knockout') AS format,
    COALESCE(json_extract(bracket, '$.hasGroupStage'), 0) AS has_groups,
    (SELECT COUNT(*) FROM json_each(t.bracket, '$.rounds') r, json_each(r.value) m
      WHERE COALESCE(json_extract(m.value, '$.bye'), 0) = 0 AND
      (json_extract(m.value, '$.winner') IS NOT NULL OR json_extract(m.value, '$.completedAt') IS NOT NULL)) +
    (SELECT COUNT(*) FROM json_each(t.bracket, '$.groupStageRounds') r, json_each(r.value) m
      WHERE COALESCE(json_extract(m.value, '$.bye'), 0) = 0 AND
      (json_extract(m.value, '$.winner') IS NOT NULL OR json_extract(m.value, '$.completedAt') IS NOT NULL)) AS decided
    FROM tournaments t ORDER BY rowid`;
  const queries = [{ sql: summariesSql, args: [] as string[] }];
  if (includeSelected) queries.push({ sql: `SELECT * FROM tournaments WHERE id = COALESCE(
    (SELECT id FROM tournaments WHERE id = ?), (SELECT id FROM tournaments ORDER BY rowid LIMIT 1))`, args: [section ?? ""] });
  const results = await db.batch(queries, "read");
  return {
    tournaments: results[0].rows.map(row => ({
      id: String(row.id), sportSlug: String(row.sport_slug), title: String(row.title),
      entryCount: Number(row.entry_count), published: Number(row.round_count) > 0,
      format: String(row.format), hasGroupStage: Boolean(row.has_groups), decided: Number(row.decided),
    })),
    selected: results[1]?.rows[0] ? decode(results[1].rows[0] as unknown as Row) : undefined,
  };
}

export async function addTournament(
  db: Client,
  sportSlug: string,
  title: string,
  entryKind: string,
  format: TournamentFormat = "knockout",
  legs: number = 1,
  playersPerGame: number = 2,
  totalGames?: number
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
    playersPerGame: Math.max(2, playersPerGame || 2),
    totalGames: totalGames && totalGames > 0 ? totalGames : undefined,
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
    if (bracket.roundConfig?.length && !["lineup", "winner", "details", "rename", "reset", "qualifiers"].includes(mutation.kind)) {
      throw new Error("This tournament uses a configured round structure. Reset it before changing matches or participants.");
    }
    switch (mutation.kind) {
      case "lineup": {
        if (bracket.rounds.length) throw new Error("This bracket is already published. Rename entries or reset it first.");
        const chosenFormat = mutation.format || bracket.format || "knockout";
        const chosenLegs = mutation.legs || bracket.legs || 1;
        const pPerGame = mutation.playersPerGame || bracket.playersPerGame || 2;
        const totalG = mutation.totalGames || bracket.totalGames;
        const opts: BracketOptions = { legs: chosenLegs, playersPerGame: pPerGame, totalGames: totalG };

        // Use configured bracket if roundConfig is provided
        if (mutation.roundConfig !== undefined) {
          bracket = createConfiguredBracket(
            mutation.names,
            mutation.roundConfig,
            mutation.hasGroupStage || false,
            mutation.groupStageConfig,
            chosenLegs,
          );
        } else if (chosenFormat === "round_robin") {
          bracket = createRoundRobin(mutation.names, opts);
        } else if (chosenFormat === "flexible") {
          bracket = createFlexibleBracket(mutation.names, opts);
        } else {
          bracket = createBracket(mutation.names, opts);
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
          playersPerGame: bracket.playersPerGame || 2,
          totalGames: bracket.totalGames,
          roundConfig: bracket.roundConfig,
          hasGroupStage: bracket.hasGroupStage,
          groupStageConfig: bracket.groupStageConfig,
        };
        break;
      case "winner":
        bracket = chooseWinner(bracket, mutation.matchId, mutation.entryId);
        break;
      case "qualifiers":
        bracket = confirmGroupQualifiers(bracket, mutation.groupId, mutation.entryIds);
        break;
      case "details": {
        const allMatches = [...bracket.rounds.flat(), ...(bracket.groupStageRounds ? bracket.groupStageRounds.flat() : [])];
        const match = allMatches.find(item => item.id === mutation.matchId);
        if (!match || match.bye) throw new Error("Choose a playable match.");
        const previousScores = [match.scoreA, match.scoreB];
        const previousCricketInnings = JSON.stringify(match.cricketInnings ?? {});
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

        if (mutation.scores) {
          const participantIds = getMatchParticipants(match);
          for (const [entryId, score] of Object.entries(mutation.scores)) {
            if (!participantIds.includes(entryId) || (score !== "" && !/^\d{1,3}$/.test(score))) throw new Error("Enter whole-number scores from 0 to 999 for this match's participants.");
          }
          if (Object.values(mutation.scores).some(Boolean) && !isMatchReady(match)) throw new Error("Wait for all participants before entering scores.");
          match.scores = { ...(match.scores || {}), ...mutation.scores };
          const p = getMatchParticipants(match);
          if (p[0] && mutation.scores[p[0]] !== undefined) match.scoreA = mutation.scores[p[0]];
          if (p[1] && mutation.scores[p[1]] !== undefined) match.scoreB = mutation.scores[p[1]];
        }
        if (mutation.cricketScores !== undefined) {
          if (row.sport_slug !== "cricket") throw new Error("Cricket innings can only be saved for cricket matches.");
          const participantIds = getMatchParticipants(match);
          if (participantIds.length !== 2 || Object.keys(mutation.cricketScores).length !== 2 ||
              Object.keys(mutation.cricketScores).some(id => !participantIds.includes(id))) {
            throw new Error("Enter scores for both teams in this cricket match.");
          }
          const innings: Record<string, CricketInnings> = {};
          const runs: Record<string, string> = {};
          for (const id of participantIds) {
            const input = mutation.cricketScores[id];
            const parsed = /^(\d{1,3})(?:[/-](\d{1,2}))?$/.exec(input.score.trim());
            if (!input.score.trim()) {
              if (input.overs.trim() || input.allOut) throw new Error("Clear overs and all-out when clearing a cricket score.");
              runs[id] = "";
              continue;
            }
            if (!parsed) throw new Error("Enter cricket scores as runs/wickets, for example 91/3 or 91-3.");
            const wickets = parsed[2] === undefined ? null : Number(parsed[2]);
            if (wickets !== null && wickets > 10) throw new Error("Wickets must be between 0 and 10.");
            const balls = parseCricketOvers(input.overs.trim());
            if (balls === null) throw new Error("Enter overs from 0.1 to 8.0; the digit after the dot is balls (0–5).");
            if (input.allOut && wickets === null) throw new Error("Enter wickets before marking an innings all out.");
            innings[id] = { wickets, balls, allOut: input.allOut || wickets === 10 };
            runs[id] = parsed[1];
          }
          if (Object.values(runs).some(Boolean) && !isMatchReady(match)) throw new Error("Wait for both teams before entering scores.");
          match.scoreA = runs[participantIds[0]];
          match.scoreB = runs[participantIds[1]];
          match.scores = { ...(match.scores ?? {}), ...runs };
          match.cricketInnings = innings;
        }
        if (mutation.participants) {
          if (bracket.roundConfig) throw new Error("Participants in configured rounds come from the tournament draw.");
          match.participants = mutation.participants;
          if (!match.a) match.a = mutation.participants[0] ?? null;
          if (!match.b) match.b = mutation.participants[1] ?? null;
        }
        const groupMatch = bracket.groupStageRounds?.flat().some(item => item.id === match.id);
        if (bracket.format === "round_robin" || groupMatch) {
          const scoresChanged = previousScores[0] !== match.scoreA || previousScores[1] !== match.scoreB;
          const inningsChanged = previousCricketInnings !== JSON.stringify(match.cricketInnings ?? {});
          if (scoresChanged && match.scoreA !== "" && match.scoreB !== "") {
            match.winner = Number(match.scoreA) === Number(match.scoreB) ? "draw" : Number(match.scoreA) > Number(match.scoreB) ? match.a : match.b;
            match.completedAt = Date.now();
          } else if (scoresChanged) {
            match.winner = null;
            match.completedAt = null;
          }
          if (groupMatch && (scoresChanged || inningsChanged)) bracket = refreshGroupQualification(bracket, match);
        }
        break;
      }
      case "add_match":
        bracket = addMatchToTournament(bracket, mutation.round, mutation.participantIds);
        break;
      case "delete_match":
        bracket = removeMatchFromTournament(bracket, mutation.matchId);
        break;
      case "add_participant":
        bracket = addParticipantToMatch(bracket, mutation.matchId, mutation.participantId);
        break;
      case "remove_participant":
        bracket = removeParticipantFromMatch(bracket, mutation.matchId, mutation.participantId);
        break;
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
  } finally {
    tx.close();
  }
}
