import "server-only";
import { cache } from "react";
import { ensureDatabaseInitialized } from "@/lib/db";
import { sports as catalog, eventDays, type Match, type Champion, type Sport } from "@/lib/data";
import { championOf, roundName } from "@/lib/bracket";
import { listTournaments } from "@/lib/tournament-store";
import { listSports } from "@/lib/sports-store";
import { initializeCatalog } from "@/lib/catalog-store";

declare global {
  var sportsWeekCatalogInitPromise: Promise<void> | undefined;
}

export async function tournamentDatabase() {
  const db = await ensureDatabaseInitialized();
  if (!global.sportsWeekCatalogInitPromise) {
    global.sportsWeekCatalogInitPromise = initializeCatalog(db, catalog).catch(error => {
      global.sportsWeekCatalogInitPromise = undefined;
      throw error;
    });
  }
  await global.sportsWeekCatalogInitPromise;
  return db;
}

export const getTournamentData = cache(async () => {
  const db = await tournamentDatabase();
  const [tournaments, dynamicSports] = await Promise.all([
    listTournaments(db),
    listSports(db),
  ]);

  const activeCatalog: Sport[] = dynamicSports;
  const matches: Match[] = [];
  const champions: Champion[] = [];
  const completedSections = new Set<string>();

  for (const tournament of tournaments) {
    const sport = activeCatalog.find(item => item.slug === tournament.sportSlug) || {
      slug: tournament.sportSlug,
      name: tournament.title,
      icon: "🏆",
      category: "Indoor" as const,
      color: "#72d2ff",
      detail: "",
      participants: 0,
      matches: 0,
      stage: "",
    };

    const names = new Map(tournament.bracket.entries.map(entry => [entry.id, entry.name]));
    const format = tournament.bracket.format || "knockout";

    for (const match of tournament.bracket.rounds.flat()) {
      if (match.bye) continue;

      let scoreDisplayA = match.scoreA;
      let scoreDisplayB = match.scoreB;
      if (match.legs === 2 && (match.scoreA2 || match.scoreB2)) {
        const aggA = (Number(match.scoreA) || 0) + (Number(match.scoreA2) || 0);
        const aggB = (Number(match.scoreB) || 0) + (Number(match.scoreB2) || 0);
        scoreDisplayA = `${match.scoreA || "0"}+${match.scoreA2 || "0"} (${aggA})`;
        scoreDisplayB = `${match.scoreB || "0"}+${match.scoreB2 || "0"} (${aggB})`;
      }

      matches.push({
        id: `${tournament.id}-${match.id}`,
        sport: sport.name,
        sportSlug: sport.slug,
        tournamentId: tournament.id,
        icon: sport.icon,
        category: tournament.title,
        round: roundName(match.round, tournament.bracket.rounds.length, format),
        participantA: names.get(match.a ?? "") ?? (format === "round_robin" ? "Team A" : "Awaiting winner"),
        participantB: names.get(match.b ?? "") ?? (format === "round_robin" ? "Team B" : "Awaiting winner"),
        scoreA: scoreDisplayA,
        scoreB: scoreDisplayB,
        status: match.winner ? "completed" : "upcoming",
        date: match.date,
        time: match.time || "Time TBD",
        venue: match.venue || "Venue TBD",
        day: eventDays.findIndex(day => day.date === match.date) + 1,
        completedAt: match.completedAt,
        winner: match.winner === "draw" ? "Draw" : names.get(match.winner ?? ""),
      });
    }

    const champion = championOf(tournament.bracket);
    if (champion) {
      completedSections.add(tournament.id);
      champions.push({
        sport: tournament.title,
        icon: sport.icon,
        winner: champion.winner.name,
        runnerUp: champion.runnerUp.name,
        batch: sport.name,
      });
    }
  }

  const sports = activeCatalog.map(sport => {
    const sections = tournaments.filter(t => t.sportSlug === sport.slug);
    const published = sections.filter(t => t.bracket.rounds.length);
    const hasRoundRobin = sections.some(t => t.bracket.format === "round_robin");
    const formatLabel = hasRoundRobin ? "Group / League" : "Knockout";

    return {
      ...sport,
      participants: sections.reduce((sum, t) => sum + t.bracket.entries.length, 0),
      matches: matches.filter(m => m.sportSlug === sport.slug).length,
      detail: `${sections.length} ${sections.length === 1 ? "section" : "sections"} · ${formatLabel}`,
      stage: !published.length
        ? "Awaiting entries"
        : published.every(t => completedSections.has(t.id))
          ? "Completed"
          : "In progress",
    };
  });

  return { tournaments, sports, matches, champions };
});
