export type MatchStatus = "live" | "upcoming" | "completed" | "postponed";

export type Match = {
  id: string;
  sport: string;
  icon: string;
  category: string;
  round: string;
  participantA: string;
  participantB: string;
  scoreA?: string;
  scoreB?: string;
  time: string;
  venue: string;
  status: MatchStatus;
  day: number;
  date?: string;
  completedAt?: number | null;
  winner?: string;
  sportSlug?: string;
  tournamentId?: string;
};

export type Sport = {
  slug: string;
  name: string;
  icon: string;
  category: "Indoor" | "Outdoor";
  color: string;
  detail: string;
  participants: number;
  matches: number;
  stage: string;
};

export const event = {
  year: 2026,
  startsAt: "2026-09-26T00:00:00+06:00",
  dates: "26 September — 2 October",
  venue: "Shahjalal University of Science & Technology",
};

export const eventDays = Array.from({ length: 7 }, (_, index) => {
  const date = new Date(Date.UTC(event.year, 8, 26 + index));
  return {
    date: date.toISOString().slice(0, 10),
    label: `${date.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" })}, ${date.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })}`,
    short: `Day ${index + 1} of 7`,
  };
});

export function getEventDay(now = new Date()) {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
  const index = eventDays.findIndex(day => day.date === date);
  return index < 0 ? null : index + 1;
}

export const sports: Sport[] = [
  { slug: "football", name: "Football", icon: "⚽", category: "Outdoor", color: "#72d2ff", detail: "6 batch teams", participants: 78, matches: 9, stage: "Semi Finals" },
  { slug: "cricket", name: "Cricket", icon: "🏏", category: "Outdoor", color: "#9de393", detail: "8 batch teams", participants: 96, matches: 14, stage: "Group Stage" },
  { slug: "badminton", name: "Badminton", icon: "🏸", category: "Indoor", color: "#ffbd66", detail: "Singles & doubles", participants: 42, matches: 38, stage: "Quarter Finals" },
  { slug: "chess", name: "Chess", icon: "♟", category: "Indoor", color: "#d6b3ff", detail: "Single elimination", participants: 32, matches: 31, stage: "Semi Finals" },
  { slug: "table-tennis", name: "Table Tennis", icon: "🏓", category: "Indoor", color: "#ff8f9b", detail: "Singles & doubles", participants: 38, matches: 34, stage: "Round of 16" },
  { slug: "fifa", name: "FIFA", icon: "🎮", category: "Indoor", color: "#9ea9ff", detail: "Open singles", participants: 32, matches: 31, stage: "Quarter Finals" },
  { slug: "carrom", name: "Carrom", icon: "◉", category: "Indoor", color: "#f0db85", detail: "Singles & doubles", participants: 40, matches: 28, stage: "Round of 16" },
  { slug: "ludo", name: "Ludo", icon: "🎲", category: "Indoor", color: "#70e6cd", detail: "Open knockout", participants: 48, matches: 20, stage: "Round 2" },
  { slug: "dart", name: "Dart", icon: "🎯", category: "Indoor", color: "#ffb59d", detail: "Singles tournament", participants: 0, matches: 0, stage: "Registration" },
  { slug: "pen-fight", name: "Pen Fight", icon: "✒", category: "Indoor", color: "#dfbf92", detail: "Singles tournament", participants: 0, matches: 0, stage: "Registration" },
  { slug: "mini-militia", name: "Mini Militia", icon: "🎮", category: "Indoor", color: "#b8c5fa", detail: "Singles tournament", participants: 0, matches: 0, stage: "Registration" },
  { slug: "uno", name: "UNO", icon: "🃏", category: "Indoor", color: "#f59eba", detail: "Singles tournament", participants: 0, matches: 0, stage: "Registration" },
];

export const announcements: { level: string; title: string; body: string; time: string }[] = [];

export type Champion = { sport: string; icon: string; winner: string; runnerUp: string; batch: string };
