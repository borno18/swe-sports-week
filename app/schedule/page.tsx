import { Schedule } from "@/components/schedule";
import { eventDays, getEventDay } from "@/lib/data";

import { getTournamentData } from "@/lib/tournaments";

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ day?: string; match?: string }> }) {
  const { matches } = await getTournamentData();
  const { day, match } = await searchParams;
  const selectedMatch = matches.find(item => item.id === match);
  const requestedDay = Number(day);
  const initialDay = Number.isInteger(requestedDay) && day !== undefined && requestedDay >= 0 && requestedDay <= eventDays.length
    ? requestedDay : getEventDay() ?? (matches.some(m => m.day === 0) ? 0 : 1);
  return <Schedule key={selectedMatch?.id ?? "schedule"} initialDay={selectedMatch?.day ?? initialDay} highlightedMatch={selectedMatch?.id} matches={matches} />;
}
