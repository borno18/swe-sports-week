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
};

export type TournamentFormat = "knockout" | "round_robin" | "flexible";

export type Bracket = {
  entries: Entry[];
  rounds: BracketMatch[][];
  format?: TournamentFormat;
  legs?: number;
};

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

export function createBracket(text: string, legs: number = 1): Bracket {
  const names = parseNames(text);
  const entries = names.map((name, index) => ({ id: `p${index + 1}`, name }));
  const size = 2 ** Math.ceil(Math.log2(entries.length));
  const count = Math.log2(size);
  const matchLegs = legs === 2 ? 2 : 1;
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
    })));
  let entry = 0;
  const contested = entries.length - size / 2;
  rounds[0].forEach((match, index) => {
    match.a = entries[entry++].id;
    match.b = index < contested ? entries[entry++].id : null;
    if (!match.b) { match.bye = true; match.winner = match.a; }
  });
  return propagate({ entries, rounds, format: "knockout", legs: matchLegs });
}

export function createFlexibleBracket(text: string, legs: number = 1): Bracket {
  const names = parseNames(text, 50);
  const entries = names.map((name, index) => ({ id: `p${index + 1}`, name }));
  const n = entries.length;
  const totalRounds = Math.ceil(Math.log2(n));
  const fullSize = 2 ** totalRounds; // nearest power-of-2 >= n
  const matchLegs = legs === 2 ? 2 : 1;

  // Build all rounds with the right match counts
  const rounds: BracketMatch[][] = Array.from({ length: totalRounds }, (_, round) =>
    Array.from({ length: fullSize / 2 ** (round + 1) }, (_, position) => ({
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
    })));

  // Seed round 1: pair entries top-to-bottom, extras beyond fullSize/2 get matches, rest get byes
  let entry = 0;
  const contested = n - fullSize / 2; // how many "extra" players need preliminary matches
  rounds[0].forEach((match, index) => {
    match.a = entries[entry++].id;
    match.b = index < contested ? entries[entry++].id : null;
    if (!match.b) { match.bye = true; match.winner = match.a; }
  });

  return propagate({ entries, rounds, format: "flexible", legs: matchLegs });
}

export function createRoundRobin(text: string, legs: number = 1): Bracket {
  const names = parseNames(text);
  const entries = names.map((name, index) => ({ id: `p${index + 1}`, name }));
  const n = entries.length;
  const isOdd = n % 2 !== 0;
  const teamList: (string | null)[] = entries.map(e => e.id);
  if (isOdd) teamList.push(null); // dummy bye team

  const m = teamList.length; // even number
  const roundsPerLeg = m - 1;
  const totalLegs = legs === 2 ? 2 : 1;
  const rounds: BracketMatch[][] = [];

  for (let leg = 0; leg < totalLegs; leg++) {
    const list = [...teamList];
    for (let r = 0; r < roundsPerLeg; r++) {
      const roundIndex = leg * roundsPerLeg + r;
      const matches: BracketMatch[] = [];
      let position = 0;

      for (let i = 0; i < m / 2; i++) {
        const t1 = list[i];
        const t2 = list[m - 1 - i];
        // If one is null, the other has a bye this round
        if (t1 === null || t2 === null) continue;

        // In leg 2, swap home/away
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
        });
      }

      rounds.push(matches);

      // Rotate list clockwise, keeping element 0 fixed
      const last = list.pop()!;
      list.splice(1, 0, last);
    }
  }

  return { entries, rounds, format: "round_robin", legs: totalLegs };
}

function propagate(bracket: Bracket) {
  if (bracket.format === "round_robin") return bracket;
  // Both knockout and flexible use the same tree-based propagation
  for (let round = 1; round < bracket.rounds.length; round++) {
    for (const match of bracket.rounds[round]) {
      const a = bracket.rounds[round - 1][match.position * 2].winner;
      const b = bracket.rounds[round - 1][match.position * 2 + 1].winner;
      if (match.a !== a || match.b !== b) {
        match.winner = null; match.completedAt = null; match.scoreA = ""; match.scoreB = "";
        if (match.legs === 2) {
          match.scoreA2 = ""; match.scoreB2 = "";
        }
      }
      match.a = a; match.b = b;
    }
  }
  return bracket;
}

export function chooseWinner(source: Bracket, matchId: string, entryId: string | null, now = Date.now()) {
  const bracket = structuredClone(source);
  const match = bracket.rounds.flat().find(item => item.id === matchId);
  if (!match) throw new Error("This match no longer exists. Refresh and try again.");
  if (match.bye) throw new Error("Byes advance automatically.");

  if (bracket.format === "round_robin") {
    // flexible and knockout share the same final-match champion logic
    if (entryId !== null && (!match.a || !match.b || ![match.a, match.b, "draw"].includes(entryId))) {
      throw new Error("Choose team A, team B, or Draw as the result.");
    }
    match.winner = entryId;
    match.completedAt = entryId ? now : null;
    return bracket;
  }

  if (entryId !== null && (!match.a || !match.b || ![match.a, match.b].includes(entryId))) {
    throw new Error("Both opponents must be known before choosing a winner.");
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

  // knockout and flexible: champion is the winner of the final match
  const final = bracket.rounds.at(-1)?.[0];
  if (!final?.winner) return null;
  return {
    winner: bracket.entries.find(entry => entry.id === final.winner)!,
    runnerUp: bracket.entries.find(entry => entry.id === (final.winner === final.a ? final.b : final.a))!,
  };
}
