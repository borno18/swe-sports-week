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

export const matches: Match[] = [
  {
    id: "football-semi-1",
    sport: "Football",
    icon: "⚽",
    category: "Men's Football",
    round: "Semi Final",
    participantA: "Null Pointers",
    participantB: "Runtime Terror",
    scoreA: "2",
    scoreB: "1",
    time: "42'",
    venue: "Central Field",
    status: "live",
    day: 1,
  },
  {
    id: "badminton-qf-3",
    sport: "Badminton",
    icon: "🏸",
    category: "Men's Doubles",
    round: "Quarter Final",
    participantA: "Rafi + Sami",
    participantB: "Nabil + Zihan",
    scoreA: "18",
    scoreB: "16",
    time: "Set 2",
    venue: "Gymnasium · Court 1",
    status: "live",
    day: 1,
  },
  {
    id: "chess-semi-1",
    sport: "Chess",
    icon: "♟",
    category: "Open Singles",
    round: "Semi Final",
    participantA: "Mahir Hasan · 23",
    participantB: "Sadia Noor · 22",
    time: "5:00 PM",
    venue: "IICT Gallery",
    status: "upcoming",
    day: 1,
  },
  {
    id: "cricket-group-8",
    sport: "Cricket",
    icon: "🏏",
    category: "Batch Tournament",
    round: "Group B",
    participantA: "Batch 22",
    participantB: "Batch 24",
    time: "5:45 PM",
    venue: "Central Field",
    status: "upcoming",
    day: 1,
  },
  {
    id: "fifa-qf-2",
    sport: "FIFA",
    icon: "🎮",
    category: "Open Singles",
    round: "Quarter Final",
    participantA: "Adnan Rahman",
    participantB: "Turja Saha",
    scoreA: "1",
    scoreB: "3",
    time: "4:10 PM",
    venue: "SWE Common Room",
    status: "completed",
    day: 1,
  },
  {
    id: "penfight-final",
    sport: "Pen Fight",
    icon: "✒",
    category: "Open Singles",
    round: "Final",
    participantA: "Tareq Monowar",
    participantB: "Fatema Rahman",
    scoreA: "3",
    scoreB: "1",
    time: "1:30 PM",
    venue: "SWE Common Room",
    status: "completed",
    day: 1,
  },
  {
    id: "minimilitia-final",
    sport: "Mini Militia",
    icon: "🎮",
    category: "Open Singles",
    round: "Final",
    participantA: "Niloy Ahmed",
    participantB: "Joydip Das",
    scoreA: "5",
    scoreB: "2",
    time: "2:45 PM",
    venue: "SWE Lab",
    status: "completed",
    day: 1,
  },
  {
    id: "tt-r16-1",
    sport: "Table Tennis",
    icon: "🏓",
    category: "Men's Singles",
    round: "Round of 16",
    participantA: "Iftekhar Alam · 22",
    participantB: "Rakib Hasan · 24",
    time: "10:00 AM",
    venue: "Gymnasium · Table 1",
    status: "upcoming",
    day: 2,
  },
  {
    id: "carrom-r16-3",
    sport: "Carrom",
    icon: "◉",
    category: "Singles",
    round: "Round of 16",
    participantA: "Mahin Chowdhury",
    participantB: "Sifat Uddin",
    time: "11:30 AM",
    venue: "SWE Common Room",
    status: "upcoming",
    day: 2,
  },
  {
    id: "ludo-r2-5",
    sport: "Ludo",
    icon: "🎲",
    category: "Open Tournament",
    round: "Round 2",
    participantA: "Tamim Iqbal",
    participantB: "Faisal Kabir",
    time: "2:00 PM",
    venue: "IICT Gallery",
    status: "upcoming",
    day: 2,
  },
  {
    id: "football-semi-2",
    sport: "Football",
    icon: "⚽",
    category: "Men's Football",
    round: "Semi Final",
    participantA: "Segfault FC",
    participantB: "404 United",
    time: "4:30 PM",
    venue: "Central Field",
    status: "upcoming",
    day: 2,
  },
];

export const sports: Sport[] = [
  { slug: "football", name: "Football", icon: "⚽", category: "Outdoor", color: "#72d2ff", detail: "6 batch teams", participants: 78, matches: 9, stage: "Semi Finals" },
  { slug: "cricket", name: "Cricket", icon: "🏏", category: "Outdoor", color: "#9de393", detail: "8 batch teams", participants: 96, matches: 14, stage: "Group Stage" },
  { slug: "badminton", name: "Badminton", icon: "🏸", category: "Indoor", color: "#ffbd66", detail: "Singles & doubles", participants: 42, matches: 38, stage: "Quarter Finals" },
  { slug: "chess", name: "Chess", icon: "♟", category: "Indoor", color: "#d6b3ff", detail: "Single elimination", participants: 32, matches: 31, stage: "Semi Finals" },
  { slug: "table-tennis", name: "Table Tennis", icon: "🏓", category: "Indoor", color: "#ff8f9b", detail: "Singles & doubles", participants: 38, matches: 34, stage: "Round of 16" },
  { slug: "fifa", name: "FIFA", icon: "🎮", category: "Indoor", color: "#9ea9ff", detail: "Open singles", participants: 32, matches: 31, stage: "Quarter Finals" },
  { slug: "carrom", name: "Carrom", icon: "◉", category: "Indoor", color: "#f0db85", detail: "Singles & doubles", participants: 40, matches: 28, stage: "Round of 16" },
  { slug: "ludo", name: "Ludo", icon: "🎲", category: "Indoor", color: "#70e6cd", detail: "Open knockout", participants: 48, matches: 20, stage: "Round 2" },
];

export const announcements = [
  { level: "urgent", title: "Football semi-final moved to 4:30 PM", body: "The Central Field is being prepared after rain. All players should report by 4:10 PM.", time: "12 min ago" },
  { level: "important", title: "Badminton players: check-in reminder", body: "Quarter-finalists must check in at the gymnasium desk 20 minutes before their match.", time: "1 hr ago" },
];

export const champions = [
  { sport: "Pen Fight", icon: "✒", winner: "Tareq Monowar", runnerUp: "Fatema Rahman", batch: "Batch 22" },
  { sport: "Mini Militia", icon: "🎮", winner: "Niloy Ahmed", runnerUp: "Joydip Das", batch: "Open" },
  { sport: "UNO", icon: "🃏", winner: "Nusrat Jahan", runnerUp: "Rifat Hossain", batch: "Batch 23" },
];
