export type Entry = { id: string; name: string };

export const CRICKET_BALLS_PER_INNINGS = 48;
export type CricketInnings = { wickets: number | null; balls: number; allOut: boolean };

export function parseCricketOvers(value: string): number | null {
  if (!/^(?:[0-7](?:\.[0-5])?|8(?:\.0)?)$/.test(value)) return null;
  const [overs, balls = "0"] = value.split(".");
  const total = Number(overs) * 6 + Number(balls);
  return total > 0 && total <= CRICKET_BALLS_PER_INNINGS ? total : null;
}

export function formatCricketOvers(balls: number): string {
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}

export function formatCricketScore(match: BracketMatch, entryId: string | null): string {
  if (!entryId) return "";
  const score = match.scores?.[entryId] ?? (entryId === match.a ? match.scoreA : entryId === match.b ? match.scoreB : "");
  const wickets = match.cricketInnings?.[entryId]?.wickets;
  return score !== "" && wickets != null ? `${score}/${wickets}` : score;
}

export type BracketMatch = {
  id: string;
  round: number;
  position: number;
  a: string | null;
  b: string | null;
  winner: string | null;
  bye: boolean;
  date: string;
  time: string;
  venue: string;
  scoreA: string;
  scoreB: string;
  completedAt: number | null;
  // Two-leg / aggregate support
  legs?: number; // 1 or 2
  scoreA2?: string;
  scoreB2?: string;
  date2?: string;
  time2?: string;
  venue2?: string;
  // Multi-participant (>= 2 players/teams) support
  participants?: string[];  // all entry IDs in this match (2–48)
  advancers?: string[];     // entry IDs that advance to next round
  scores?: Record<string, string>; // entry ID -> score string
  cricketInnings?: Record<string, CricketInnings>; // entry ID -> wickets, balls bowled and all-out status
  sourceSlots?: (string | null)[]; // fixed incoming slots; null means a result is pending
  groupId?: string;
};

export type TournamentFormat = "knockout" | "round_robin" | "flexible";

export type BracketOptions = {
  legs?: number;
  playersPerGame?: number; // 2, 3, 4, etc. (default 2)
  totalGames?: number;     // custom total number of games
};

export type RoundConfig = {
  name: string;             // e.g. "Quarter-finals", "Semi-finals"
  matchCount: number;       // number of matches in this round
  playersPerMatch: number;  // players per match in this round (default 2)
  playerCount?: number; // total entrants in this round, including any byes
};

export type GroupStageConfig = {
  groupCount: number;       // number of groups/pools
  playersPerGroup: number;  // players per group
  advancePerGroup: number;  // how many advance from each group
};

export type Bracket = {
  entries: Entry[];
  rounds: BracketMatch[][];
  format?: TournamentFormat;
  legs?: number;
  playersPerGame?: number;
  totalGames?: number;
  roundConfig?: RoundConfig[];          // custom round configuration
  hasGroupStage?: boolean;              // whether group stage is enabled
  groupStageConfig?: GroupStageConfig;  // group stage details
  groupStageRounds?: BracketMatch[][];  // group stage match rounds
  groupQualifiers?: Record<string, string[]>;
  sportSlug?: string;
};

/** Returns all participant IDs in a match, falling back to [a, b] */
export function getMatchParticipants(match: BracketMatch): string[] {
  if (match.participants && match.participants.length > 0) {
    return match.participants.filter(Boolean);
  }
  const result: string[] = [];
  if (match.a) result.push(match.a);
  if (match.b) result.push(match.b);
  return result;
}

export type Tournament = {
  id: string;
  sportSlug: string;
  title: string;
  entryKind: "player" | "team";
  version: number;
  bracket: Bracket;
};

export type StandingRow = {
  id: string;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  nrr?: number;
  form?: ("W" | "L" | "D")[];
};

export function roundName(index: number, count: number, format: TournamentFormat = "knockout", roundConfig?: RoundConfig[]) {
  // Use custom round name if configured
  if (roundConfig && roundConfig[index]?.name) {
    return roundConfig[index].name;
  }
  if (format === "round_robin") {
    return `Round ${index + 1}`;
  }
  if (format === "flexible") {
    if (index === count - 1) return "Final";
    if (index === count - 2 && count >= 2) return "Semi-finals";
    return `Round ${index + 1}`;
  }
  const remaining = 2 ** (count - index);
  return remaining === 2 ? "Final" : remaining === 4 ? "Semi-finals" : remaining === 8 ? "Quarter-finals" : `Round of ${remaining}`;
}

export function parseNames(text: string, maxEntries: number = 64) {
  if (text.length > 6000) throw new Error(`Please enter no more than ${maxEntries} names, up to 80 characters each.`);
  const names = text.split(/\r?\n/).map(name => name.trim()).filter(Boolean);
  if (names.length < 2 || names.length > maxEntries) throw new Error(`Enter between 2 and ${maxEntries} players or teams, one per line.`);
  if (names.some(name => name.length > 80 || /[\u0000-\u001f\u007f]/.test(name))) throw new Error("Each name must be 1–80 characters without control characters.");
  if (new Set(names.map(name => name.toLocaleLowerCase())).size !== names.length) throw new Error("Names must be unique within this section. Add a batch or team label to distinguish them.");
  return names;
}

function propagateMulti(bracket: Bracket): Bracket {
  const pPerGame = bracket.playersPerGame || 2;
  for (let r = 1; r < bracket.rounds.length; r++) {
    const prevMatches = bracket.rounds[r - 1];
    for (const match of bracket.rounds[r]) {
      const incomingSlots: (string | null)[] = [];
      for (let k = 0; k < pPerGame; k++) {
        const prevM = prevMatches[match.position * pPerGame + k];
        if (prevM) incomingSlots.push(prevM.winner ?? null);
      }
      if (JSON.stringify(match.sourceSlots ?? getMatchParticipants(match)) !== JSON.stringify(incomingSlots)) clearMatchResult(match);
      match.sourceSlots = incomingSlots;
      match.participants = incomingSlots.filter((id): id is string => id !== null);
      match.a = incomingSlots[0] ?? null;
      match.b = incomingSlots[1] ?? null;
    }
  }
  return bracket;
}

export function createBracket(text: string, options: number | BracketOptions = 1): Bracket {
  const opts: BracketOptions = typeof options === "number" ? { legs: options } : options;
  const names = parseNames(text);
  const entries = names.map((name, index) => ({ id: `p${index + 1}`, name }));
  const matchLegs = opts.legs === 2 ? 2 : 1;
  const pPerGame = Math.max(2, opts.playersPerGame || 2);
  const totalG = opts.totalGames && opts.totalGames > 0 ? opts.totalGames : undefined;

  // Custom playersPerGame > 2 OR custom totalGames specified
  if (pPerGame > 2 || totalG) {
    const numRound1 = totalG ?? Math.max(1, Math.ceil(entries.length / pPerGame));
    const round1: BracketMatch[] = [];
    let pIdx = 0;
    for (let i = 0; i < numRound1; i++) {
      const slice: string[] = [];
      for (let k = 0; k < pPerGame && pIdx < entries.length; k++) {
        slice.push(entries[pIdx++].id);
      }
      round1.push({
        id: `r1m${i + 1}`,
        round: 0,
        position: i,
        a: slice[0] ?? null,
        b: slice[1] ?? null,
        winner: null,
        bye: slice.length === 1,
        date: "",
        time: "",
        venue: "",
        scoreA: "",
        scoreB: "",
        completedAt: null,
        legs: matchLegs,
        participants: slice,
        advancers: [],
        scores: {},
      });
      if (slice.length === 1) {
        round1[i].winner = slice[0];
      }
    }

    const rounds: BracketMatch[][] = [round1];
    let prevRoundCount = round1.length;
    let roundIndex = 1;
    while (prevRoundCount > 1) {
      const nextRoundCount = Math.max(1, Math.ceil(prevRoundCount / pPerGame));
      const nextRound: BracketMatch[] = [];
      for (let pos = 0; pos < nextRoundCount; pos++) {
        nextRound.push({
          id: `r${roundIndex + 1}m${pos + 1}`,
          round: roundIndex,
          position: pos,
          a: null, b: null, winner: null, bye: false,
          date: "", time: "", venue: "",
          scoreA: "", scoreB: "",
          completedAt: null,
          legs: matchLegs,
          participants: [],
          advancers: [],
          scores: {},
        });
      }
      rounds.push(nextRound);
      prevRoundCount = nextRoundCount;
      roundIndex++;
    }

    return propagateMulti({
      entries,
      rounds,
      format: "knockout",
      legs: matchLegs,
      playersPerGame: pPerGame,
      totalGames: totalG,
    });
  }

  // Standard 2-player binary tree knockout
  const size = 2 ** Math.ceil(Math.log2(entries.length));
  const count = Math.log2(size);
  const rounds: BracketMatch[][] = Array.from({ length: count }, (_, round) =>
    Array.from({ length: size / 2 ** (round + 1) }, (_, position) => ({
      id: `r${round + 1}m${position + 1}`,
      round,
      position,
      a: null,
      b: null,
      winner: null,
      bye: false,
      date: "",
      time: "",
      venue: "",
      scoreA: "",
      scoreB: "",
      completedAt: null,
      legs: matchLegs,
      scoreA2: matchLegs === 2 ? "" : undefined,
      scoreB2: matchLegs === 2 ? "" : undefined,
      date2: matchLegs === 2 ? "" : undefined,
      time2: matchLegs === 2 ? "" : undefined,
      venue2: matchLegs === 2 ? "" : undefined,
      participants: [],
      advancers: [],
      scores: {},
    })));
  let entry = 0;
  const contested = entries.length - size / 2;
  rounds[0].forEach((match, index) => {
    match.a = entries[entry++].id;
    match.b = index < contested ? entries[entry++].id : null;
    match.participants = [match.a, match.b].filter(Boolean) as string[];
    if (!match.b) { match.bye = true; match.winner = match.a; }
  });
  return propagate({ entries, rounds, format: "knockout", legs: matchLegs, playersPerGame: 2 });
}

export function createFlexibleBracket(text: string, options: BracketOptions = {}): Bracket {
  const names = parseNames(text, 50);
  const entries = names.map((name, index) => ({ id: `p${index + 1}`, name }));
  const pPerGame = Math.max(2, options.playersPerGame || 4);
  const totalG = options.totalGames && options.totalGames > 0 ? options.totalGames : undefined;

  let round1Matches: BracketMatch[] = [];
  if (totalG) {
    let entryIdx = 0;
    for (let i = 0; i < totalG; i++) {
      const pSlice: string[] = [];
      for (let k = 0; k < pPerGame && entryIdx < entries.length; k++) {
        pSlice.push(entries[entryIdx++].id);
      }
      round1Matches.push({
        id: `r1m${i + 1}`,
        round: 0,
        position: i,
        a: pSlice[0] ?? null,
        b: pSlice[1] ?? null,
        winner: null,
        bye: false,
        date: "", time: "", venue: "",
        scoreA: "", scoreB: "",
        completedAt: null,
        legs: 1,
        participants: pSlice,
        advancers: [],
        scores: {},
      });
    }
  }

  return {
    entries,
    rounds: round1Matches.length > 0 ? [round1Matches] : [[]],
    format: "flexible",
    legs: 1,
    playersPerGame: pPerGame,
    totalGames: totalG,
  };
}

// ── Universal match & participant management helpers (>= 2 players, custom total games) ──

/** Adds a new match with >= 2 participants to any round in any tournament */
export function addMatchToTournament(
  source: Bracket,
  roundIndex: number,
  participantIds: string[]
): Bracket {
  const bracket = structuredClone(source);
  while (bracket.rounds.length <= roundIndex) {
    bracket.rounds.push([]);
  }
  const round = bracket.rounds[roundIndex];
  const position = round.length;
  const pA = participantIds[0] ?? null;
  const pB = participantIds[1] ?? null;
  const newMatch: BracketMatch = {
    id: `r${roundIndex + 1}m${position + 1}_${Date.now().toString(36)}`,
    round: roundIndex,
    position,
    a: pA,
    b: pB,
    winner: null,
    bye: false,
    date: "",
    time: "",
    venue: "",
    scoreA: "",
    scoreB: "",
    completedAt: null,
    legs: bracket.legs || 1,
    participants: [...participantIds],
    advancers: [],
    scores: {},
  };
  round.push(newMatch);
  return bracket;
}

/** Removes a match from any round in any tournament */
export function removeMatchFromTournament(source: Bracket, matchId: string): Bracket {
  const bracket = structuredClone(source);
  for (const round of bracket.rounds) {
    const idx = round.findIndex(m => m.id === matchId);
    if (idx !== -1) {
      round.splice(idx, 1);
      round.forEach((m, i) => { m.position = i; });
      return bracket;
    }
  }
  throw new Error("Match not found.");
}

/** Adds a participant to an existing match (allowing >= 2, 3, 4, 5... players per game) */
export function addParticipantToMatch(source: Bracket, matchId: string, participantId: string): Bracket {
  const bracket = structuredClone(source);
  const match = bracket.rounds.flat().find(m => m.id === matchId);
  if (!match) throw new Error("Match not found.");
  const existing = getMatchParticipants(match);
  if (existing.includes(participantId)) throw new Error("This player or team is already in this game.");
  const updated = [...existing, participantId];
  match.participants = updated;
  if (!match.a) match.a = updated[0] ?? null;
  if (!match.b) match.b = updated[1] ?? null;
  return bracket;
}

/** Removes a participant from an existing match */
export function removeParticipantFromMatch(source: Bracket, matchId: string, participantId: string): Bracket {
  const bracket = structuredClone(source);
  const match = bracket.rounds.flat().find(m => m.id === matchId);
  if (!match) throw new Error("Match not found.");
  const existing = getMatchParticipants(match);
  if (existing.length <= 2) throw new Error("A game must have at least 2 teams or players.");
  const updated = existing.filter(id => id !== participantId);
  match.participants = updated;
  match.a = updated[0] ?? null;
  match.b = updated[1] ?? null;
  if (match.winner === participantId) match.winner = null;
  if (match.advancers) match.advancers = match.advancers.filter(id => id !== participantId);
  if (match.scores) delete match.scores[participantId];
  if (match.cricketInnings) delete match.cricketInnings[participantId];
  return bracket;
}

// ── Flexible format helpers ──

/** Available player pool for a given round in a flexible bracket */
export function flexAvailablePool(bracket: Bracket, roundIndex: number): string[] {
  if (roundIndex === 0) return bracket.entries.map(e => e.id);
  const prevRound = bracket.rounds[roundIndex - 1];
  if (!prevRound) return [];
  return prevRound.flatMap(m => m.advancers ?? []);
}

/** IDs already assigned to a match in the given round */
function flexAssignedInRound(bracket: Bracket, roundIndex: number, excludeMatchId?: string): Set<string> {
  const round = bracket.rounds[roundIndex] ?? [];
  const assigned = new Set<string>();
  for (const m of round) {
    if (m.id === excludeMatchId) continue;
    for (const p of m.participants ?? []) assigned.add(p);
  }
  return assigned;
}

export function flexAddMatch(source: Bracket, roundIndex: number, participantIds: string[]): Bracket {
  if (source.format !== "flexible") throw new Error("Not a flexible bracket.");
  if (participantIds.length < 2 || participantIds.length > 48) throw new Error("A match needs 2–48 participants.");
  const bracket = structuredClone(source);
  while (bracket.rounds.length <= roundIndex) bracket.rounds.push([]);
  const round = bracket.rounds[roundIndex];
  const pool = new Set(flexAvailablePool(bracket, roundIndex));
  const assigned = flexAssignedInRound(bracket, roundIndex);
  for (const id of participantIds) {
    if (!pool.has(id)) throw new Error("One or more participants are not in the available pool for this round.");
    if (assigned.has(id)) throw new Error("One or more participants are already in another match this round.");
  }
  const position = round.length;
  round.push({
    id: `r${roundIndex + 1}m${position + 1}`,
    round: roundIndex,
    position,
    a: participantIds[0] ?? null,
    b: participantIds[1] ?? null,
    winner: null,
    bye: false,
    date: "", time: "", venue: "",
    scoreA: "", scoreB: "",
    completedAt: null,
    participants: [...participantIds],
    advancers: [],
    scores: {},
  });
  return bracket;
}

export function flexRemoveMatch(source: Bracket, matchId: string): Bracket {
  if (source.format !== "flexible") throw new Error("Not a flexible bracket.");
  const bracket = structuredClone(source);
  for (const round of bracket.rounds) {
    const idx = round.findIndex(m => m.id === matchId);
    if (idx !== -1) {
      round.splice(idx, 1);
      round.forEach((m, i) => { m.position = i; });
      return bracket;
    }
  }
  throw new Error("Match not found.");
}

export function flexSetAdvancers(source: Bracket, matchId: string, advancerIds: string[], now = Date.now()): Bracket {
  if (source.format !== "flexible") throw new Error("Not a flexible bracket.");
  const bracket = structuredClone(source);
  const match = bracket.rounds.flat().find(m => m.id === matchId);
  if (!match) throw new Error("Match not found.");
  const participants = new Set(match.participants ?? []);
  for (const id of advancerIds) {
    if (!participants.has(id)) throw new Error("Advancer is not a participant of this match.");
  }
  match.advancers = [...advancerIds];
  match.completedAt = advancerIds.length > 0 ? now : null;
  return bracket;
}

export function flexAddRound(source: Bracket): Bracket {
  if (source.format !== "flexible") throw new Error("Not a flexible bracket.");
  const bracket = structuredClone(source);
  const lastRound = bracket.rounds.at(-1);
  if (!lastRound || lastRound.length === 0) throw new Error("Current round has no matches.");
  for (const m of lastRound) {
    if (!m.advancers || m.advancers.length === 0) {
      throw new Error("All matches in the current round must have advancers before starting the next round.");
    }
  }
  bracket.rounds.push([]);
  return bracket;
}

export function flexUpdateParticipants(source: Bracket, matchId: string, participantIds: string[]): Bracket {
  if (source.format !== "flexible") throw new Error("Not a flexible bracket.");
  if (participantIds.length < 2 || participantIds.length > 48) throw new Error("A match needs 2–48 participants.");
  const bracket = structuredClone(source);
  const match = bracket.rounds.flat().find(m => m.id === matchId);
  if (!match) throw new Error("Match not found.");
  const roundIndex = match.round;
  const pool = new Set(flexAvailablePool(bracket, roundIndex));
  const assigned = flexAssignedInRound(bracket, roundIndex, matchId);
  for (const id of participantIds) {
    if (!pool.has(id)) throw new Error("One or more participants are not in the available pool for this round.");
    if (assigned.has(id)) throw new Error("One or more participants are already in another match this round.");
  }
  match.participants = [...participantIds];
  match.a = participantIds[0] ?? null;
  match.b = participantIds[1] ?? null;
  match.advancers = (match.advancers ?? []).filter(a => participantIds.includes(a));
  if (match.advancers.length === 0) match.completedAt = null;
  return bracket;
}

export function createRoundRobin(text: string, options: number | BracketOptions = 1): Bracket {
  const opts: BracketOptions = typeof options === "number" ? { legs: options } : options;
  const legs = opts.legs === 2 ? 2 : 1;
  const pPerGame = Math.max(2, opts.playersPerGame || 2);
  const totalG = opts.totalGames && opts.totalGames > 0 ? opts.totalGames : undefined;
  const names = parseNames(text);
  const entries = names.map((name, index) => ({ id: `p${index + 1}`, name }));

  // If playersPerGame > 2, group into multi-team matches
  if (pPerGame > 2) {
    const numMatches = totalG ?? Math.max(1, Math.ceil(entries.length / pPerGame));
    const matches: BracketMatch[] = [];
    let pIdx = 0;
    for (let i = 0; i < numMatches; i++) {
      const slice: string[] = [];
      for (let k = 0; k < pPerGame && pIdx < entries.length; k++) {
        slice.push(entries[pIdx++].id);
      }
      matches.push({
        id: `r1m${i + 1}`,
        round: 0,
        position: i,
        a: slice[0] ?? null,
        b: slice[1] ?? null,
        winner: null,
        bye: false,
        date: "", time: "", venue: "",
        scoreA: "", scoreB: "",
        completedAt: null,
        legs: 1,
        participants: slice,
        advancers: [],
        scores: {},
      });
    }
    return {
      entries,
      rounds: [matches],
      format: "round_robin",
      legs,
      playersPerGame: pPerGame,
      totalGames: totalG,
    };
  }

  // Standard 2-player round robin
  const n = entries.length;
  const isOdd = n % 2 !== 0;
  const teamList: (string | null)[] = entries.map(e => e.id);
  if (isOdd) teamList.push(null);

  const m = teamList.length;
  const roundsPerLeg = m - 1;
  const totalLegs = legs;
  const rounds: BracketMatch[][] = [];
  let currentTotalMatches = 0;

  for (let leg = 0; leg < totalLegs; leg++) {
    const list = [...teamList];
    for (let r = 0; r < roundsPerLeg; r++) {
      if (totalG && currentTotalMatches >= totalG) break;
      const roundIndex = leg * roundsPerLeg + r;
      const matches: BracketMatch[] = [];
      let position = 0;

      for (let i = 0; i < m / 2; i++) {
        if (totalG && currentTotalMatches >= totalG) break;
        const t1 = list[i];
        const t2 = list[m - 1 - i];
        if (t1 === null || t2 === null) continue;

        const home = leg === 0 ? t1 : t2;
        const away = leg === 0 ? t2 : t1;

        matches.push({
          id: `r${roundIndex + 1}m${position + 1}`,
          round: roundIndex,
          position: position++,
          a: home,
          b: away,
          winner: null,
          bye: false,
          date: "",
          time: "",
          venue: "",
          scoreA: "",
          scoreB: "",
          completedAt: null,
          legs: 1,
          participants: [home, away],
          advancers: [],
          scores: {},
        });
        currentTotalMatches++;
      }

      if (matches.length > 0) rounds.push(matches);
      const last = list.pop()!;
      list.splice(1, 0, last);
    }
  }

  return {
    entries,
    rounds,
    format: "round_robin",
    legs: totalLegs,
    playersPerGame: 2,
    totalGames: totalG,
  };
}

function propagate(bracket: Bracket) {
  if (bracket.format === "round_robin" || bracket.format === "flexible") return bracket;

  if (bracket.roundConfig?.length) return propagateConfigured(bracket);

  if ((bracket.playersPerGame || 2) > 2) return propagateMulti(bracket);
  for (let round = 1; round < bracket.rounds.length; round++) {
    for (const match of bracket.rounds[round]) {
      const a = bracket.rounds[round - 1][match.position * 2]?.winner ?? null;
      const b = bracket.rounds[round - 1][match.position * 2 + 1]?.winner ?? null;
      if (match.a !== a || match.b !== b) {
        clearMatchResult(match);
        if (match.legs === 2) {
          match.scoreA2 = ""; match.scoreB2 = "";
        }
      }
      match.a = a; match.b = b;
      match.participants = [a, b].filter(Boolean) as string[];
    }
  }
  return bracket;
}

export function chooseWinner(source: Bracket, matchId: string, entryId: string | null, now = Date.now()) {
  if (source.format === "flexible") return flexSetAdvancers(source, matchId, entryId ? [entryId] : [], now);
  const bracket = structuredClone(source);
  const allMatches = [...bracket.rounds.flat(), ...(bracket.groupStageRounds ? bracket.groupStageRounds.flat() : [])];
  const match = allMatches.find(item => item.id === matchId);
  if (!match) throw new Error("This match no longer exists. Refresh and try again.");
  if (match.bye) throw new Error("Byes advance automatically.");
  if (entryId && !isMatchReady(match)) throw new Error("Both opponents (all participants) must qualify before choosing a winner.");

  const participants = getMatchParticipants(match);

  const isGroupMatch = Boolean(bracket.groupStageRounds?.flat().some(m => m.id === matchId));

  if (bracket.format === "round_robin" || isGroupMatch) {
    if (entryId !== null && !participants.includes(entryId) && entryId !== "draw") {
      throw new Error("Choose a participant or Draw as the result.");
    }
    match.winner = entryId;
    match.completedAt = entryId ? now : null;
    if (!entryId) clearMatchResult(match);
    return isGroupMatch ? refreshGroupQualification(bracket, match) : bracket;
  }

  if (entryId !== null) {
    if ((bracket.playersPerGame && bracket.playersPerGame > 2) || (match.participants && match.participants.length > 2)) {
      if (!participants.includes(entryId)) {
        throw new Error("Choose a valid participant as the winner.");
      }
    } else if (!match.a || !match.b || ![match.a, match.b].includes(entryId)) {
      throw new Error("Both opponents must be known before choosing a winner.");
    }
  }

  if (match.winner === entryId) return bracket;
  match.winner = entryId;
  match.completedAt = entryId ? now : null;
  if (!entryId) {
    clearMatchResult(match);
  }
  return propagate(bracket);
}

export function renameEntries(source: Bracket, text: string) {
  const names = parseNames(text, source.roundConfig ? 200 : 64);
  if (names.length !== source.entries.length) throw new Error("Keep the same number of names when renaming. Reset the bracket to change the lineup.");
  const bracket = structuredClone(source);
  bracket.entries.forEach((entry, index) => { entry.name = names[index]; });
  return bracket;
}

export function calculateStandings(bracket: Bracket, sportSlug?: string): StandingRow[] {
  const slug = sportSlug || bracket.sportSlug;
  const isCricket = slug === "cricket";
  const table = new Map<string, StandingRow>();
  const formMap = new Map<string, ("W" | "L" | "D")[]>();
  const cricketTotals = new Map<string, { runsFor: number; ballsFaced: number; runsAgainst: number; ballsBowled: number }>();

  for (const entry of bracket.entries) {
    table.set(entry.id, {
      id: entry.id,
      name: entry.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
      nrr: 0,
      form: [],
    });
    formMap.set(entry.id, []);
    cricketTotals.set(entry.id, { runsFor: 0, ballsFaced: 0, runsAgainst: 0, ballsBowled: 0 });
  }

  for (const match of bracket.rounds.flat()) {
    if (!match.a || !match.b || match.bye) continue;
    const a = table.get(match.a);
    const b = table.get(match.b);
    if (!a || !b) continue;

    // Check if score is recorded or winner decided
    const sA = match.scoreA !== "" ? parseInt(match.scoreA, 10) : NaN;
    const sB = match.scoreB !== "" ? parseInt(match.scoreB, 10) : NaN;
    const hasScores = !isNaN(sA) && !isNaN(sB);

    if (hasScores || match.winner) {
      a.played += 1;
      b.played += 1;

      const goalsA = !isNaN(sA) ? sA : 0;
      const goalsB = !isNaN(sB) ? sB : 0;
      a.gf += goalsA;
      a.ga += goalsB;
      b.gf += goalsB;
      b.ga += goalsA;
      a.gd = a.gf - a.ga;
      b.gd = b.gf - b.ga;

      if (isCricket && hasScores) {
        const inningsA = match.cricketInnings?.[match.a];
        const inningsB = match.cricketInnings?.[match.b];
        const ballsA = inningsA?.allOut ? CRICKET_BALLS_PER_INNINGS : inningsA?.balls ?? CRICKET_BALLS_PER_INNINGS;
        const ballsB = inningsB?.allOut ? CRICKET_BALLS_PER_INNINGS : inningsB?.balls ?? CRICKET_BALLS_PER_INNINGS;
        const totalsA = cricketTotals.get(match.a)!;
        const totalsB = cricketTotals.get(match.b)!;
        totalsA.runsFor += sA; totalsA.ballsFaced += ballsA;
        totalsA.runsAgainst += sB; totalsA.ballsBowled += ballsB;
        totalsB.runsFor += sB; totalsB.ballsFaced += ballsB;
        totalsB.runsAgainst += sA; totalsB.ballsBowled += ballsA;
      }

      if (match.winner === "draw" || (hasScores && sA === sB && !match.winner)) {
        a.drawn += 1;
        b.drawn += 1;
        a.points += 1;
        b.points += 1;
        formMap.get(match.a)?.push("D");
        formMap.get(match.b)?.push("D");
      } else if (match.winner === a.id || (!match.winner && hasScores && sA > sB)) {
        a.won += 1;
        b.lost += 1;
        a.points += isCricket ? 2 : 3;
        formMap.get(match.a)?.push("W");
        formMap.get(match.b)?.push("L");
      } else if (match.winner === b.id || (!match.winner && hasScores && sB > sA)) {
        b.won += 1;
        a.lost += 1;
        b.points += isCricket ? 2 : 3;
        formMap.get(match.b)?.push("W");
        formMap.get(match.a)?.push("L");
      }
    }
  }

  for (const row of table.values()) {
    row.form = (formMap.get(row.id) ?? []).slice(-5);
    if (isCricket) {
      const totals = cricketTotals.get(row.id)!;
      row.nrr = totals.ballsFaced && totals.ballsBowled
        ? (totals.runsFor * 6 / totals.ballsFaced) - (totals.runsAgainst * 6 / totals.ballsBowled)
        : 0;
    }
  }

  return Array.from(table.values()).sort((x, y) => {
    if (y.points !== x.points) return y.points - x.points;
    if (isCricket) {
      const nrrX = x.nrr ?? 0;
      const nrrY = y.nrr ?? 0;
      if (Math.abs(nrrY - nrrX) > 0.0001) return nrrY - nrrX;
      if (y.won !== x.won) return y.won - x.won;
      if (y.gf !== x.gf) return y.gf - x.gf;
    } else {
      if (y.gd !== x.gd) return y.gd - x.gd;
      if (y.gf !== x.gf) return y.gf - x.gf;
    }
    return x.name.localeCompare(y.name);
  });
}

export function championOf(bracket: Bracket) {
  if (bracket.format === "round_robin") {
    const standings = calculateStandings(bracket);
    const playable = bracket.rounds.flat().filter(m => !m.bye);
    const allCompleted = playable.length > 0 && playable.every(m => m.completedAt || (m.scoreA !== "" && m.scoreB !== ""));
    if (allCompleted && standings.length >= 2) {
      return {
        winner: { id: standings[0].id, name: standings[0].name },
        runnerUp: { id: standings[1].id, name: standings[1].name },
      };
    }
    return null;
  }

  if (bracket.format === "flexible") {
    // Champion = sole advancer from the last completed round
    const lastRound = bracket.rounds.at(-1);
    if (!lastRound || lastRound.length === 0) return null;
    const allAdvancers = lastRound.flatMap(m => m.advancers ?? []);
    const allComplete = lastRound.every(m => m.completedAt);
    if (allComplete && allAdvancers.length === 1) {
      const winnerId = allAdvancers[0];
      // Find runner-up: last eliminated players from the final round
      const finalParticipants = lastRound.flatMap(m => m.participants ?? []);
      const eliminated = finalParticipants.filter(id => id !== winnerId);
      const runnerUpId = eliminated[0] ?? winnerId;
      return {
        winner: bracket.entries.find(e => e.id === winnerId)!,
        runnerUp: bracket.entries.find(e => e.id === runnerUpId)!,
      };
    }
    return null;
  }

  // knockout: champion is the winner of the final match
  const final = bracket.rounds.at(-1)?.[0];
  if (!final?.winner) return null;
  const winner = bracket.entries.find(entry => entry.id === final.winner)!;
  const participants = getMatchParticipants(final);
  const otherId = participants.find(id => id !== final.winner) ?? (final.winner === final.a ? final.b : final.a);
  const runnerUp = bracket.entries.find(entry => entry.id === otherId) ?? winner;
  return { winner, runnerUp };
}

/** Generate a sensible default name for a round given index and total count */
export function defaultRoundName(index: number, totalRounds: number): string {
  if (totalRounds === 1) return "Final";
  if (index === totalRounds - 1) return "Final";
  if (index === totalRounds - 2) return "Semi-finals";
  if (index === totalRounds - 3 && totalRounds >= 3) return "Quarter-finals";
  if (index === totalRounds - 4 && totalRounds >= 4) return "Round of 16";
  return `Round ${index + 1}`;
}

/**
 * Create a bracket from explicit round configuration.
 * Each round specifies: name, number of matches, players per match.
 * Optional group stage generates round-robin pools.
 */
export function validateRoundConfiguration(configs: RoundConfig[], entrants: number, hasGroups = false, groups?: GroupStageConfig) {
  const integer = (value: number, min: number, max: number) => Number.isSafeInteger(value) && value >= min && value <= max;
  if (!Array.isArray(configs) || configs.length < 1 || configs.length > 10) throw new Error("Configure between 1 and 10 knockout rounds.");
  let incoming = entrants;
  if (hasGroups) {
    if (!groups || !integer(groups.groupCount, 1, 16) || !integer(groups.playersPerGroup, 2, 20) || !integer(groups.advancePerGroup, 1, groups.playersPerGroup - 1)) {
      throw new Error("Choose 1–16 groups, 2–20 players per group, and fewer qualifiers than players per group.");
    }
    if (entrants !== groups.groupCount * groups.playersPerGroup) throw new Error(`Enter exactly ${groups.groupCount * groups.playersPerGroup} names for these groups.`);
    incoming = groups.groupCount * groups.advancePerGroup;
  }
  for (const [index, config] of configs.entries()) {
    if (!config || typeof config.name !== 'string' || !config.name.trim() || config.name.trim().length > 40 || /[\u0000-\u001f]/.test(config.name)) throw new Error(`Give round ${index + 1} a name of 1–40 characters.`);
    if (!integer(config.matchCount, 1, 100) || !integer(config.playersPerMatch, 2, 48)) throw new Error(`${config.name}: choose 1–100 matches and 2–48 players per match.`);
    if (config.playerCount !== undefined && (!integer(config.playerCount, 2, 200) || config.playerCount !== incoming)) throw new Error(`${config.name} must have ${incoming} players: ${index ? 'one winner from each preceding match' : hasGroups ? 'the group qualifiers' : 'all the entered names'}.`);
    if (incoming > config.matchCount * config.playersPerMatch || incoming < config.matchCount) throw new Error(`${config.name}: ${incoming} players cannot fit into ${config.matchCount} matches of up to ${config.playersPerMatch}. Adjust the match count or players per match.`);
    if (config.matchCount >= incoming) throw new Error(`${config.name} must eliminate at least one player. Use fewer matches than players.`);
    incoming = config.matchCount;
  }
  if (configs.at(-1)!.matchCount !== 1) throw new Error("The final round must contain one championship match.");
}

function legsInvalidForMulti(config: RoundConfig) { return config.playersPerMatch > 2; }

function configuredMatch(round: number, position: number, legs: number): BracketMatch {
  return { id: `r${round + 1}m${position + 1}`, round, position, a: null, b: null, winner: null, bye: false, date: '', time: '', venue: '', scoreA: '', scoreB: '', completedAt: null, legs, participants: [], scores: {}, advancers: [] };
}

function clearMatchResult(match: BracketMatch) {
  match.winner = null;
  match.completedAt = null;
  match.scoreA = ''; match.scoreB = ''; match.scoreA2 = ''; match.scoreB2 = '';
  match.scores = {}; match.advancers = [];
  match.cricketInnings = {};
}

function assignConfiguredRound(matches: BracketMatch[], slots: (string | null)[]) {
  let offset = 0;
  matches.forEach((match, index) => {
    const count = Math.floor(slots.length / matches.length) + (index < slots.length % matches.length ? 1 : 0);
    const incoming = slots.slice(offset, offset + count);
    offset += count;
    const previous = match.sourceSlots ?? getMatchParticipants(match);
    if (JSON.stringify(previous) !== JSON.stringify(incoming)) clearMatchResult(match);
    match.sourceSlots = incoming;
    match.participants = incoming.filter((id): id is string => id !== null);
    match.a = incoming[0] ?? null;
    match.b = incoming[1] ?? null;
    match.bye = count === 1 && incoming[0] !== null;
    if (match.bye) match.winner = incoming[0];
  });
}

export function isMatchReady(match: BracketMatch) {
  return !match.bye && (match.sourceSlots ? match.sourceSlots.length >= 2 && match.sourceSlots.every(Boolean) : getMatchParticipants(match).length >= 2);
}

export function tournamentGroups(bracket: Bracket, sportSlug?: string) {
  if (!bracket.hasGroupStage || !bracket.groupStageConfig) return [];
  const config = bracket.groupStageConfig;
  const slug = sportSlug || bracket.sportSlug;
  const isCricket = slug === "cricket";
  return Array.from({ length: config.groupCount }, (_, index) => {
    const id = `g${index + 1}`;
    const entries = bracket.entries.slice(index * config.playersPerGroup, (index + 1) * config.playersPerGroup);
    const rounds = (bracket.groupStageRounds ?? []).map(round => round.filter(m => m.groupId === id || m.id.startsWith(`gs_${id}r`))).filter(round => round.length);
    const groupBracket: Bracket = { entries, rounds, format: 'round_robin', legs: 1, sportSlug: slug };
    const standings = calculateStandings(groupBracket, slug);
    const complete = rounds.length > 0 && rounds.flat().every(m => Boolean(m.winner));
    const sameRank = (a: StandingRow, b?: StandingRow) => !!b && a.points === b.points && (isCricket ? Math.abs((a.nrr ?? 0) - (b.nrr ?? 0)) < 0.0001 : (a.gd === b.gd && a.gf === b.gf));
    const tied = complete && standings.slice(0, config.advancePerGroup).some((row, i) => sameRank(row, standings[i + 1]));
    const confirmed = bracket.groupQualifiers?.[id];
    const qualifiers = complete ? confirmed ?? (tied ? [] : standings.slice(0, config.advancePerGroup).map(row => row.id)) : [];
    return { id, name: `Group ${String.fromCharCode(65 + index)}`, bracket: groupBracket, standings, complete, tied, qualifiers };
  });
}

export function propagateConfigured(bracket: Bracket): Bracket {
  if (!bracket.roundConfig?.length) return bracket;
  let slots: (string | null)[] = bracket.entries.map(e => e.id);
  if (bracket.hasGroupStage && bracket.groupStageConfig) {
    const groups = tournamentGroups(bracket);
    slots = [];
    // Pair neighbouring groups in opposite seed order (A1/B2, B1/A2 for two qualifiers).
    for (let index = 0; index < groups.length; index += 2) {
      const left = groups[index];
      const right = groups[index + 1];
      for (let rank = 0; rank < bracket.groupStageConfig.advancePerGroup; rank++) {
        slots.push(left.qualifiers[rank] ?? null);
        if (right) slots.push(right.qualifiers[bracket.groupStageConfig.advancePerGroup - 1 - rank] ?? null);
      }
    }
  }
  bracket.rounds.forEach(round => {
    assignConfiguredRound(round, slots);
    slots = round.map(m => m.winner);
  });
  return bracket;
}

export function confirmGroupQualifiers(source: Bracket, groupId: string, entryIds: string[], sportSlug?: string) {
  const bracket = structuredClone(source);
  const group = tournamentGroups(bracket, sportSlug).find(g => g.id === groupId);
  const count = bracket.groupStageConfig?.advancePerGroup;
  if (!group || !group.complete || !count) throw new Error("Finish every group match before confirming qualifiers.");
  if (entryIds.length !== count || new Set(entryIds).size !== count) throw new Error(`Choose ${count} different qualifiers in finishing order.`);
  const isCricket = (sportSlug || bracket.sportSlug) === "cricket";
  entryIds.forEach((id, rank) => {
    const entry = group.standings.find(row => row.id === id);
    const expected = group.standings[rank];
    if (!entry || entry.points !== expected.points || (isCricket ? Math.abs((entry.nrr ?? 0) - (expected.nrr ?? 0)) >= 0.0001 : (entry.gd !== expected.gd || entry.gf !== expected.gf))) {
      throw new Error("Keep the standings order; choose between tied players only.");
    }
  });
  bracket.groupQualifiers = { ...bracket.groupQualifiers, [groupId]: entryIds };
  return propagateConfigured(bracket);
}

export function refreshGroupQualification(bracket: Bracket, match: BracketMatch) {
  const group = tournamentGroups(bracket).find(g => g.bracket.rounds.flat().some(m => m.id === match.id));
  if (group && bracket.groupQualifiers) delete bracket.groupQualifiers[group.id];
  return propagateConfigured(bracket);
}

export function createConfiguredBracket(text: string, roundConfigs: RoundConfig[], hasGroupStage = false, groupStageConfig?: GroupStageConfig, legs = 1): Bracket {
  const names = parseNames(text, 200);
  validateRoundConfiguration(roundConfigs, names.length, hasGroupStage, groupStageConfig);
  if (legs !== 1 && legs !== 2) throw new Error("Choose one match or two legs per tie.");
  if (legs === 2 && roundConfigs.some(legsInvalidForMulti)) throw new Error("Two-leg ties require two players per match in every knockout round.");
  const entries = names.map((name, index) => ({ id: `p${index + 1}`, name }));
  const groupStageRounds: BracketMatch[][] = [];
  if (hasGroupStage && groupStageConfig) {
    for (let group = 0; group < groupStageConfig.groupCount; group++) {
      const groupEntries = entries.slice(group * groupStageConfig.playersPerGroup, (group + 1) * groupStageConfig.playersPerGroup);
      const generated = createRoundRobin(groupEntries.map(e => e.name).join('\n'));
      const ids = new Map(generated.entries.map((entry, index) => [entry.id, groupEntries[index].id]));
      generated.rounds.forEach((round, roundIndex) => {
        groupStageRounds[roundIndex] ??= [];
        for (const match of round) {
          const a = ids.get(match.a!)!; const b = ids.get(match.b!)!;
          groupStageRounds[roundIndex].push({ ...match, id: `gs_g${group + 1}${match.id}`, groupId: `g${group + 1}`, a, b, participants: [a, b] });
        }
      });
    }
  }
  const bracket: Bracket = {
    entries, rounds: roundConfigs.map((r, index) => Array.from({ length: r.matchCount }, (_, position) => configuredMatch(index, position, legs))),
    format: 'knockout', legs, playersPerGame: roundConfigs[0].playersPerMatch,
    roundConfig: roundConfigs.map(r => ({ ...r, name: r.name.trim() })), hasGroupStage,
    groupStageConfig: hasGroupStage ? groupStageConfig : undefined,
    groupStageRounds: hasGroupStage ? groupStageRounds : undefined,
  };
  return propagateConfigured(bracket);
}
