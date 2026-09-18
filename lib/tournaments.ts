import "server-only";
import { cache } from "react";
import { ensureDatabaseInitialized } from "@/lib/db";
import { sports as catalog, eventDays, type Match, type Champion } from "@/lib/data";
import { championOf, roundName } from "@/lib/bracket";
import { initializeTournaments, listTournaments } from "@/lib/tournament-store";

export async function tournamentDatabase() {
  const db = await ensureDatabaseInitialized();
  await initializeTournaments(db, catalog);
  return db;
}

export const getTournamentData = cache(async () => {
  const db = await tournamentDatabase();
  const tournaments = await listTournaments(db);
  const matches: Match[] = [];
  const champions: Champion[] = [];
  for (const tournament of tournaments) {
    const sport = catalog.find(item => item.slug === tournament.sportSlug)!;
    const names = new Map(tournament.bracket.entries.map(entry => [entry.id, entry.name]));
    for (const match of tournament.bracket.rounds.flat()) {
      if (match.bye) continue;
      matches.push({
        id: `${tournament.id}-${match.id}`, sport: sport.name, sportSlug: sport.slug, tournamentId: tournament.id,
        icon: sport.icon, category: tournament.title, round: roundName(match.round, tournament.bracket.rounds.length),
        participantA: names.get(match.a ?? "") ?? "Awaiting winner", participantB: names.get(match.b ?? "") ?? "Awaiting winner",
        scoreA: match.scoreA, scoreB: match.scoreB, status: match.winner ? "completed" : "upcoming",
        date: match.date, time: match.time || "Time TBD", venue: match.venue || "Venue TBD",
        day: eventDays.findIndex(day => day.date === match.date) + 1,
        completedAt: match.completedAt, winner: names.get(match.winner ?? ""),
      });
    }
    const champion = championOf(tournament.bracket);
    if (champion) champions.push({ sport: tournament.title, icon: sport.icon, winner: champion.winner.name, runnerUp: champion.runnerUp.name, batch: sport.name });
  }
  const sports = catalog.map(sport => {
    const sections = tournaments.filter(t => t.sportSlug === sport.slug);
    const published = sections.filter(t => t.bracket.rounds.length);
    return { ...sport,
      participants: sections.reduce((sum, t) => sum + t.bracket.entries.length, 0),
      matches: matches.filter(m => m.sportSlug === sport.slug).length,
      detail: `${sections.length} ${sections.length === 1 ? "section" : "sections"} · Knockout`,
      stage: !published.length ? "Awaiting entries" : published.every(t => championOf(t.bracket)) ? "Completed" : "In progress",
    };
  });
  return { tournaments, sports, matches, champions };
});
