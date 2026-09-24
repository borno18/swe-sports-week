export type VolunteerAssignment = {
  id: string;
  sport: string;
  category: "Outdoor" | "Indoor";
  icon: string;
  volunteers: string[];
  role: string;
  sportSlug?: string;
  color: string;
  detail: string;
  venue: string;
};

export type VolunteerPerson = {
  name: string;
  isSpecialGroup?: boolean;
  sports: {
    sport: string;
    category: "Outdoor" | "Indoor";
    icon: string;
    sportSlug?: string;
    role: string;
    color: string;
  }[];
};

export const volunteerAssignments: VolunteerAssignment[] = [
  // Outdoor
  {
    id: "football",
    sport: "Football",
    category: "Outdoor",
    icon: "⚽",
    volunteers: ["Nasim"],
    role: "Field Coordinator",
    sportSlug: "football",
    color: "#72d2ff",
    detail: "6 batch teams · Knockout tournament",
    venue: "Main Football Ground",
  },
  {
    id: "cricket",
    sport: "Cricket",
    category: "Outdoor",
    icon: "🏏",
    volunteers: ["Apu"],
    role: "Field Coordinator",
    sportSlug: "cricket",
    color: "#9de393",
    detail: "8 batch teams · Group stage & playoffs",
    venue: "Main University Ground",
  },

  // Indoor
  {
    id: "ludo",
    sport: "Ludo",
    category: "Indoor",
    icon: "🎲",
    volunteers: ["Ramisa", "Mahi"],
    role: "Arena Coordinators",
    sportSlug: "ludo",
    color: "#70e6cd",
    detail: "Open knockout tournament",
    venue: "Indoor Games Arena · IICT",
  },
  {
    id: "uno",
    sport: "UNO",
    category: "Indoor",
    icon: "🃏",
    volunteers: ["Fatema", "Raisa"],
    role: "Arena Coordinators",
    sportSlug: "uno",
    color: "#f59eba",
    detail: "Top 3 advance per group match",
    venue: "Indoor Games Hall",
  },
  {
    id: "pillow-passing",
    sport: "Pillow Passing",
    category: "Indoor",
    icon: "🌸",
    volunteers: ["All Girls"],
    role: "Special Committee",
    color: "#f472b6",
    detail: "Special interactive sports event for girls",
    venue: "Central Activity Hall",
  },
  {
    id: "chess",
    sport: "Chess",
    category: "Indoor",
    icon: "♟",
    volunteers: ["Sami"],
    role: "Mind Sports Coordinator",
    sportSlug: "chess",
    color: "#d6b3ff",
    detail: "Single elimination timed matches",
    venue: "Quiet Mind Sports Room",
  },
  {
    id: "dart",
    sport: "Dart",
    category: "Indoor",
    icon: "🎯",
    volunteers: ["Goutom"],
    role: "Target Sports Coordinator",
    sportSlug: "dart",
    color: "#ffb59d",
    detail: "8 groups · 3 per group · Project 350",
    venue: "Target Arena",
  },
  {
    id: "fifa",
    sport: "FIFA",
    category: "Indoor",
    icon: "🎮",
    volunteers: ["Surjo"],
    role: "E-Sports Coordinator",
    sportSlug: "fifa",
    color: "#9ea9ff",
    detail: "1v1 Knockout console/PC tournament",
    venue: "E-Sports Arena",
  },
  {
    id: "e-football",
    sport: "E-Football",
    category: "Indoor",
    icon: "📱",
    volunteers: ["Arko"],
    role: "E-Sports Coordinator",
    sportSlug: "e-football",
    color: "#818cf8",
    detail: "Mobile 1v1 tournament bracket",
    venue: "E-Sports Lounge",
  },
  {
    id: "big-two-call-bridge",
    sport: "Big 2 & Call Bridge",
    category: "Indoor",
    icon: "♠️",
    volunteers: ["Arnob"],
    role: "Card Games Coordinator",
    sportSlug: "big-two",
    color: "#f43f5e",
    detail: "8-Round elimination & card tricks",
    venue: "Card Sports Hall",
  },
  {
    id: "twenty-nine",
    sport: "29 Card",
    category: "Indoor",
    icon: "🃏",
    volunteers: ["Nazmul"],
    role: "Card Games Coordinator",
    sportSlug: "twenty-nine",
    color: "#60a5fa",
    detail: "10-Round team matches",
    venue: "Card Sports Hall",
  },
  {
    id: "mini-militia",
    sport: "Mini Militia",
    category: "Indoor",
    icon: "💥",
    volunteers: ["Surjo", "Arko"],
    role: "Mobile Gaming Coordinators",
    sportSlug: "mini-militia",
    color: "#b8c5fa",
    detail: "8 players max battle · 2 advance per group",
    venue: "E-Sports Arena",
  },
  {
    id: "carrom",
    sport: "Carrom",
    category: "Indoor",
    icon: "◉",
    volunteers: ["Sajeeb"],
    role: "Board Sports Coordinator",
    sportSlug: "carrom",
    color: "#f0db85",
    detail: "Singles & doubles knockout",
    venue: "Carrom Room · IICT",
  },
  {
    id: "pen-fight",
    sport: "Pen Fight",
    category: "Indoor",
    icon: "✒",
    volunteers: ["Estiak"],
    role: "Arena Coordinator",
    sportSlug: "pen-fight",
    color: "#dfbf92",
    detail: "1 winner per group to final showdown",
    venue: "Table Arena · IICT",
  },
  {
    id: "table-tennis",
    sport: "Table Tennis",
    category: "Indoor",
    icon: "🏓",
    volunteers: ["Arnob Sabit"],
    role: "Racquet Sports Coordinator",
    sportSlug: "table-tennis",
    color: "#ff8f9b",
    detail: "Singles & doubles knockouts",
    venue: "Table Tennis Arena",
  },
];

export const outdoorVolunteerAssignments = volunteerAssignments.filter(
  (v) => v.category === "Outdoor"
);

export const indoorVolunteerAssignments = volunteerAssignments.filter(
  (v) => v.category === "Indoor"
);

export function getUniqueVolunteers(): VolunteerPerson[] {
  const map = new Map<string, VolunteerPerson>();

  for (const item of volunteerAssignments) {
    for (const vName of item.volunteers) {
      const isSpecialGroup = vName.toLowerCase().includes("all girls");
      if (!map.has(vName)) {
        map.set(vName, {
          name: vName,
          isSpecialGroup,
          sports: [],
        });
      }
      map.get(vName)!.sports.push({
        sport: item.sport,
        category: item.category,
        icon: item.icon,
        sportSlug: item.sportSlug,
        role: item.role,
        color: item.color,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.isSpecialGroup) return 1;
    if (b.isSpecialGroup) return -1;
    return a.name.localeCompare(b.name);
  });
}

export function getCoordinatorsForSport(slug: string): string[] {
  const match = volunteerAssignments.find(
    (v) => v.id === slug || v.sportSlug === slug
  );
  if (!match) return [];
  return match.volunteers;
}

