export type Entry = { id: string; name: string };
export type BracketMatch = {
  id: string; round: number; position: number;
  a: string | null; b: string | null; winner: string | null; bye: boolean;
  date: string; time: string; venue: string;
  scoreA: string; scoreB: string; completedAt: number | null;
};
export type Bracket = { entries: Entry[]; rounds: BracketMatch[][] };
export type Tournament = {
  id: string; sportSlug: string; title: string; entryKind: "player" | "team";
  version: number; bracket: Bracket;
};

export function roundName(index: number, count: number) {
  const remaining = 2 ** (count - index);
  return remaining === 2 ? "Final" : remaining === 4 ? "Semi-finals" : remaining === 8 ? "Quarter-finals" : `Round of ${remaining}`;
}

export function parseNames(text: string) {
  if (text.length > 6000) throw new Error("Please enter no more than 64 names, up to 80 characters each.");
  const names = text.split(/\r?\n/).map(name => name.trim()).filter(Boolean);
  if (names.length < 2 || names.length > 64) throw new Error("Enter between 2 and 64 players or teams, one per line.");
  if (names.some(name => name.length > 80 || /[\u0000-\u001f\u007f]/.test(name))) throw new Error("Each name must be 1–80 characters without control characters.");
  if (new Set(names.map(name => name.toLocaleLowerCase())).size !== names.length) throw new Error("Names must be unique within this section. Add a batch or team label to distinguish them.");
  return names;
}

export function createBracket(text: string): Bracket {
  const names = parseNames(text);
  const entries = names.map((name, index) => ({ id: `p${index + 1}`, name }));
  const size = 2 ** Math.ceil(Math.log2(entries.length));
  const count = Math.log2(size);
  const rounds: BracketMatch[][] = Array.from({ length: count }, (_, round) =>
    Array.from({ length: size / 2 ** (round + 1) }, (_, position) => ({
      id: `r${round + 1}m${position + 1}`, round, position, a: null, b: null, winner: null,
      bye: false, date: "", time: "", venue: "", scoreA: "", scoreB: "", completedAt: null,
    })));
  let entry = 0;
  const contested = entries.length - size / 2;
  rounds[0].forEach((match, index) => {
    match.a = entries[entry++].id;
    match.b = index < contested ? entries[entry++].id : null;
    if (!match.b) { match.bye = true; match.winner = match.a; }
  });
  return propagate({ entries, rounds });
}

function propagate(bracket: Bracket) {
  for (let round = 1; round < bracket.rounds.length; round++) {
    for (const match of bracket.rounds[round]) {
      const a = bracket.rounds[round - 1][match.position * 2].winner;
      const b = bracket.rounds[round - 1][match.position * 2 + 1].winner;
      if (match.a !== a || match.b !== b) {
        match.winner = null; match.completedAt = null; match.scoreA = ""; match.scoreB = "";
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
  if (entryId !== null && (!match.a || !match.b || ![match.a, match.b].includes(entryId))) throw new Error("Both opponents must be known before choosing a winner.");
  if (match.winner === entryId) return bracket;
  match.winner = entryId; match.completedAt = entryId ? now : null;
  if (!entryId) { match.scoreA = ""; match.scoreB = ""; }
  return propagate(bracket);
}

export function renameEntries(source: Bracket, text: string) {
  const names = parseNames(text);
  if (names.length !== source.entries.length) throw new Error("Keep the same number of names when renaming. Reset the bracket to change the lineup.");
  const bracket = structuredClone(source);
  bracket.entries.forEach((entry, index) => { entry.name = names[index]; });
  return bracket;
}

export function championOf(bracket: Bracket) {
  const final = bracket.rounds.at(-1)?.[0];
  if (!final?.winner) return null;
  return {
    winner: bracket.entries.find(entry => entry.id === final.winner)!,
    runnerUp: bracket.entries.find(entry => entry.id === (final.winner === final.a ? final.b : final.a))!,
  };
}
