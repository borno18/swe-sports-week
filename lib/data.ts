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
  { slug: "fifa", name: "E-Football Mobile / FIFA", icon: "🎮", category: "Indoor", color: "#9ea9ff", detail: "1v1 Knockout tournament", participants: 32, matches: 31, stage: "Quarter Finals" },
  { slug: "carrom", name: "Carrom", icon: "◉", category: "Indoor", color: "#f0db85", detail: "Singles & doubles knockout", participants: 40, matches: 28, stage: "Round of 16" },
  { slug: "twenty-nine", name: "29 Card", icon: "♠️", category: "Indoor", color: "#60a5fa", detail: "10-Round team matches", participants: 0, matches: 0, stage: "Registration" },
  { slug: "big-two", name: "Big-2", icon: "♥️", category: "Indoor", color: "#f43f5e", detail: "8-Round lowest-scorer advances", participants: 0, matches: 0, stage: "Registration" },
  { slug: "uno", name: "UNO", icon: "🃏", category: "Indoor", color: "#f59eba", detail: "Top 3 advance per group match", participants: 0, matches: 0, stage: "Registration" },
  { slug: "mini-militia", name: "Mini Militia", icon: "🎮", category: "Indoor", color: "#b8c5fa", detail: "8 players max · 2 advance", participants: 0, matches: 0, stage: "Registration" },
  { slug: "dart", name: "Dart", icon: "🎯", category: "Indoor", color: "#ffb59d", detail: "8 groups · 3 per group · Project 350", participants: 0, matches: 0, stage: "Registration" },
  { slug: "pen-fight", name: "Pen Fight", icon: "✒", category: "Indoor", color: "#dfbf92", detail: "1 winner per group to final", participants: 0, matches: 0, stage: "Registration" },
  { slug: "ludo", name: "Ludo", icon: "🎲", category: "Indoor", color: "#70e6cd", detail: "Open knockout", participants: 48, matches: 20, stage: "Round 2" },
];

export type GameRule = {
  sportSlug: string;
  title: string;
  format: "knockout" | "flexible" | "round_robin";
  advancement: string;
  rules: string[];
  rounds?: string;
  tiebreaker?: string;
};

export const gameRules: Record<string, GameRule> = {
  "uno": {
    sportSlug: "uno",
    title: "UNO খেলার নিয়মাবলি",
    format: "flexible",
    advancement: "গ্রুপ পর্বের প্রতি খেলা থেকে ৩ জন করে বিজয়ী নেওয়া হবে।",
    rules: [
      "গ্রুপ পর্বের প্রতি ম্যাচ থেকে শীর্ষ ৩ জন খেলোয়াড় পরবর্তী রাউন্ডে উত্তীর্ণ হবে।",
      "ম্যাচে নির্দিষ্ট সংখ্যক কার্ড শেষ করার ক্রমানুসারে বিজয়ী নির্ধারণ করা হবে।",
      "পরবর্তী রাউন্ডগুলোতেও নির্ধারিত সংখ্যক বিজয়ী নিয়ে খেলা পরিচালিত হবে যতক্ষণ না চ্যাম্পিয়ন নির্ধারিত হয়।"
    ],
  },
  "carrom": {
    sportSlug: "carrom",
    title: "Carrom Tournament – Match Format & Rules",
    format: "knockout",
    advancement: "৪ রাউন্ডের মোট পয়েন্ট (সেমিফাইনাল ও ফাইনাল ২৯ পয়েন্ট একক গেম)",
    rules: [
      "সেমিফাইনাল ও ফাইনাল ব্যতীত টুর্নামেন্টের সকল ম্যাচে ৪ রাউন্ড করে খেলা হবে।",
      "চারটি রাউন্ড শেষে যে টিমের মোট পয়েন্ট বেশি থাকবে, সেই টিম বিজয়ী হিসেবে বিবেচিত হবে এবং পরবর্তী রাউন্ডে উত্তীর্ণ হবে।",
      "সেমিফাইনাল ও ফাইনাল ম্যাচ অনুষ্ঠিত হবে ২৯ পয়েন্টের একক গেমে।",
      "টুর্নামেন্টের সকল ম্যাচ নকআউট ভিত্তিতে অনুষ্ঠিত হবে।"
    ],
    rounds: "প্রাথমিক ও কোয়ার্টার: ৪ রাউন্ড | সেমি ও ফাইনাল: ২৯ পয়েন্ট",
    tiebreaker: "কোনো ম্যাচে নির্ধারিত রাউন্ড শেষে উভয় টিমের পয়েন্ট সমান হলে (টাই), টাই ব্রেক করার জন্য অতিরিক্ত ১টি রাউন্ড খেলার সুযোগ দেওয়া হবে। অতিরিক্ত রাউন্ড শেষে যে টিম বেশি পয়েন্ট অর্জন করবে, সেই টিম বিজয়ী হবে।"
  },
  "pen-fight": {
    sportSlug: "pen-fight",
    title: "পেন ফাইটের নিয়মাবলী",
    format: "flexible",
    advancement: "প্রতি গ্রুপ থেকে নকআউটের মাধ্যমে ১ জন বিজয়ী → ফাইনাল রাউন্ড",
    rules: [
      "একজন বিজয়ী: প্রতি গ্রুপ থেকে নকআউটের মাধ্যমে শুধু একজনই বিজয়ী হবে।",
      "ফাইনাল: প্রতি গ্রুপ বিজয়ী নিয়ে পরবর্তীতে ফাইনাল রাউন্ড অনুষ্ঠিত হবে।"
    ]
  },
  "dart": {
    sportSlug: "dart",
    title: "ডার্ট খেলার নিয়মাবলি",
    format: "flexible",
    advancement: "৮টি গ্রুপ (প্রতি গ্রুপে ৩ জন) → কোয়ার্টার ফাইনাল → সেমিফাইনাল → ফাইনাল (Project 350)",
    rules: [
      "মোট আটটি গ্রুপ হবে এবং প্রত্যেক গ্রুপে তিন জন করে প্লেয়ার থাকবে।",
      "প্রাথমিক রাউন্ড থেকে কোয়ার্টার ফাইনাল পর্যন্ত: প্রতি গ্রুপে ৩ সেটে খেলা হবে, ১ সেটে একজন প্লেয়ার ৩ বার করে ডার্ট নিক্ষেপের সুযোগ পাবে। প্রত্যেক গ্রুপ থেকে সব সেট মিলিয়ে যারা সর্বোচ্চ স্কোর করবে, তারা পরবর্তী রাউন্ডের জন্য নির্বাচিত হবে।",
      "কোয়ার্টার ফাইনাল রাউন্ড (Whoever is the loser is the winner): ৩ সেটে খেলা হবে, ১ সেটে ৩ বার ডার্ট। কিন্তু যে টোটাল সবচেয়ে কম স্কোর করবে সে উইনার হবে! তবে বোর্ডের পয়েন্ট সার্কেলের বাইরে মারলে +৫০ পেনাল্টি যোগ হবে।",
      "সেমিফাইনাল রাউন্ড: ৫ সেটে খেলা হবে, প্রতি সেটে ৩ বার ডার্ট। বিজয়ী নির্বাচনের ক্রাইটেরিয়া: ১) সর্বোচ্চ সেটে বিজয়ী হতে হবে। ২) সমান সংখ্যক সেট জিতলে ৫ সেটের টোটাল স্কোর বিবেচিত হবে (যার স্কোর বেশি, সে বিজয়ী)।",
      "ফাইনাল রাউন্ড (Project 350): শুরুতে প্লেয়ারদের কাছে ৩৫০ পয়েন্ট থাকবে। টার্গেট থাকবে ০ করার। ২ জন প্লেয়ার পালা করে খেলবে। যে সবার আগে exactly ০ পয়েন্টে পৌঁছাবে, সে বিজয়ী গণ্য হবে (কম বা বেশি হওয়া চলবে না)।"
    ],
    rounds: "গ্রুপ পর্ব (৩ সেট) → QF (কম স্কোর জয়ী) → SF (৫ সেট) → Final (Project 350)"
  },
  "mini-militia": {
    sportSlug: "mini-militia",
    title: "Mini Militia – অফিসিয়াল নিয়মাবলি",
    format: "flexible",
    advancement: "প্রতি ম্যাচে সর্বোচ্চ ৮ জন খেলোয়াড় · প্রতি ম্যাচ থেকে মাত্র ২ জন উত্তীর্ণ হবে",
    rules: [
      "প্রতি ম্যাচে সর্বোচ্চ ৮ জন খেলোয়াড় অংশগ্রহণ করতে পারবে।",
      "Only 2 players will go through to the next rounds from each match.",
      "পরবর্তী রাউন্ডগুলোতে একই নিয়মে প্রতি ম্যাচ থেকে ২ জন করে বিজয়ী নিয়ে ফাইনাল অনুষ্ঠিত হবে।"
    ]
  },
  "twenty-nine": {
    sportSlug: "twenty-nine",
    title: "২৯ কার্ড খেলার নিয়মাবলী",
    format: "knockout",
    advancement: "১০ রাউন্ড শেষে বিজয়ী নির্ধারণ (নকআউট)",
    rules: [
      "ম্যাচের ধরন ও রাউন্ড: প্রতিটি ম্যাচ ১০ রাউন্ডে অনুষ্ঠিত হবে (যদি এর মধ্যে কোনো দল আগেই নির্ধারিত জয়ে না পৌঁছায়)।",
      "টুর্নামেন্টের ম্যাচগুলো নকআউট ভিত্তিতে পরিচালিত হবে।"
    ],
    rounds: "১০ রাউন্ড",
    tiebreaker: "১০ রাউন্ড শেষে যদি ফলাফল সমান হয়, তবে ১টি টাইব্রেকার রাউন্ড খেলা হবে।"
  },
  "fifa": {
    sportSlug: "fifa",
    title: "E-Football Mobile এর নিয়মাবলি",
    format: "knockout",
    advancement: "1v1 Single Elimination Knockout",
    rules: [
      "Matches will be played between two players and whoever loses will be knocked out.",
      "Number of matches and rounds depends on total number of participants.",
      "Draw matches will be decided via Extra Time & Penalty Shootout."
    ]
  },
  "big-two": {
    sportSlug: "big-two",
    title: "Big-2 ♥️♠️ অফিসিয়াল নিয়মাবলি",
    format: "flexible",
    advancement: "৮ রাউন্ড শেষে সর্বনিম্ন ২ জন স্কোরার পরবর্তী ম্যাচে উত্তীর্ণ হবে",
    rules: [
      "প্রত্যেক ম্যাচে ৮টি রাউন্ডে খেলা হবে। ৮ রাউন্ড শেষে সর্বনিম্ন ২ জন স্কোরার পরবর্তী ম্যাচ এর জন্য সিলেক্ট হবে।",
      "শুধুমাত্র ফাইনাল ম্যাচ ১২টি রাউন্ডে অনুষ্ঠিত হবে।",
      "টাইব্রেকার ১: ৮ রাউন্ড শেষে যদি দেখা যায় ২য় এবং ৩য় স্থানকারীর স্কোর একই, তাহলে এডিশনাল আর ১টি রাউন্ড খেলা হবে।",
      "টাইব্রেকার ২: ৯ম রাউন্ডের পরেও যদি ২য় ও ৩য় স্থানকারীর স্কোর আবার সমান হয়, তাহলে কে সর্বোচ্চ সংখ্যক রাউন্ড জিতেছে সেটার ভিত্তিতে প্লেয়ার সিলেক্ট করা হবে।",
      "টাইব্রেকার ৩: এরপরেও সমান হলে রক-পেপার-সিজার (Rock, Paper, Scissors) করে উইনার সিলেক্ট করা হবে।"
    ],
    rounds: "নকআউট পর্ব: ৮ রাউন্ড | ফাইনাল: ১২ রাউন্ড",
    tiebreaker: "এডিশনাল রাউন্ড → সর্বোচ্চ ম্যাচ জয় → রক-পেপার-সিজার"
  }
};

export const announcements: { level: string; title: string; body: string; time: string }[] = [];

export type Champion = { sport: string; icon: string; winner: string; runnerUp: string; batch: string };
