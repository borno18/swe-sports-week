export type Entry = { id: string; name: string };

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
};

export type TournamentFormat = "knockout" | "round_robin" | "flexible";

export type BracketOptions = {
  legs?: number;
  playersPerGame?: number; // 2, 3, 4, etc. (default 2)
  totalGames?: number;     // custom total number of games
};

export type Bracket = {
  entries: Entry[];
  rounds: BracketMatch[][];
  format?: TournamentFormat;
  legs?: number;
  playersPerGame?: number;
  totalGames?: number;
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
};

export function roundName(index: number, count: number, format: TournamentFormat = "knockout") {
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
      const incomingWinners: string[] = [];
      for (let k = 0; k < pPerGame; k++) {
        const prevM = prevMatches[match.position * pPerGame + k];
        if (prevM?.winner) incomingWinners.push(prevM.winner);
      }
      match.participants = incomingWinners;
      match.a = incomingWinners[0] ?? null;
      match.b = incomingWinners[1] ?? null;
      if (match.winner && !incomingWinners.includes(match.winner)) {
        match.winner = null;
        match.completedAt = null;
      }
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
  if ((bracket.playersPerGame || 2) > 2) return propagateMulti(bracket);
  for (let round = 1; round < bracket.rounds.length; round++) {
    for (const match of bracket.rounds[round]) {
      const a = bracket.rounds[round - 1][match.position * 2]?.winner ?? null;
      const b = bracket.rounds[round - 1][match.position * 2 + 1]?.winner ?? null;
      if (match.a !== a || match.b !== b) {
        match.winner = null; match.completedAt = null; match.scoreA = ""; match.scoreB = "";
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
  if (source.format === "flexible") throw new Error("Use flexSetAdvancers for flexible brackets.");
  const bracket = structuredClone(source);
  const match = bracket.rounds.flat().find(item => item.id === matchId);
  if (!match) throw new Error("This match no longer exists. Refresh and try again.");
  if (match.bye) throw new Error("Byes advance automatically.");

  const participants = getMatchParticipants(match);

  if (bracket.format === "round_robin") {
    if (entryId !== null && !participants.includes(entryId) && entryId !== "draw") {
      throw new Error("Choose a participant or Draw as the result.");
    }
    match.winner = entryId;
    match.completedAt = entryId ? now : null;
    return bracket;
  }

  if (entryId !== null) {
    if (participants.length > 0) {
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
    match.scoreA = ""; match.scoreB = "";
    if (match.legs === 2) { match.scoreA2 = ""; match.scoreB2 = ""; }
  }
  return propagate(bracket);
}

export function renameEntries(source: Bracket, text: string) {
  const names = parseNames(text);
  if (names.length !== source.entries.length) throw new Error("Keep the same number of names when renaming. Reset the bracket to change the lineup.");
  const bracket = structuredClone(source);
  bracket.entries.forEach((entry, index) => { entry.name = names[index]; });
  return bracket;
}

export function calculateStandings(bracket: Bracket): StandingRow[] {
  const table = new Map<string, StandingRow>();
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
    });
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

      if (match.winner === "draw" || (hasScores && sA === sB && !match.winner)) {
        a.drawn += 1;
        b.drawn += 1;
        a.points += 1;
        b.points += 1;
      } else if (match.winner === a.id || (hasScores && sA > sB)) {
        a.won += 1;
        b.lost += 1;
        a.points += 3;
      } else if (match.winner === b.id || (hasScores && sB > sA)) {
        b.won += 1;
        a.lost += 1;
        b.points += 3;
      }
    }
  }

  return Array.from(table.values()).sort((x, y) => {
    if (y.points !== x.points) return y.points - x.points;
    if (y.gd !== x.gd) return y.gd - x.gd;
    if (y.gf !== x.gf) return y.gf - x.gf;
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
