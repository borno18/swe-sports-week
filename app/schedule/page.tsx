import { Schedule } from "@/components/schedule";
import { eventDays, getEventDay, matches } from "@/lib/data";

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ day?: string; match?: string }> }) {
  const { day, match } = await searchParams;
  const selectedMatch = matches.find(item => item.id === match);
  const requestedDay = Number(day);
  const initialDay = Number.isInteger(requestedDay) && requestedDay >= 1 && requestedDay <= eventDays.length
    ? requestedDay : getEventDay() ?? 1;
  return <Schedule key={selectedMatch?.id ?? "schedule"} initialDay={selectedMatch?.day ?? initialDay} highlightedMatch={selectedMatch?.id} />;
}
