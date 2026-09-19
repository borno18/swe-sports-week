import { getTournamentData } from "@/lib/tournaments";
import { getAnnouncements } from "@/lib/announcements";

export async function GET() {
  const [{ sports, matches }, announcements] = await Promise.all([getTournamentData(), getAnnouncements()]);
  const items = [
    ...sports.map(s => ({ icon: s.icon, title: s.name, subtitle: `${s.category} tournament · ${s.stage}`, href: `/sports/${s.slug}`, type: "Sport" })),
    ...matches.map(m => ({ icon: m.icon, title: `${m.participantA} vs ${m.participantB}`, subtitle: `${m.sport} · ${m.round} · ${m.venue}`, href: `/schedule?day=${m.day}&match=${m.id}#match-${m.id}`, type: "Match" })),
    ...announcements.map(a => ({ icon: "📢", title: a.title, subtitle: a.body.slice(0, 80), href: "/announcements", type: "Notice" })),
  ];
  return Response.json(items, { headers: { "Cache-Control": "no-store" } });
}
