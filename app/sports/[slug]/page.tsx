import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { matches, sports } from "@/lib/data";
import { MatchCard } from "@/components/match-card";

export default async function SportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sport = sports.find((item) => item.slug === slug);
  if (!sport) notFound();
  const sportMatches = matches.filter((match) => match.sport === sport.name);
  return (
    <div className="sport-page" style={{ "--sport-color": sport.color } as React.CSSProperties}>
      <header className="sport-hero"><Link href="/sports"><ArrowLeft size={16} /> All sports</Link><div className="sport-hero-icon">{sport.icon}</div><span>{sport.category} tournament</span><h1>{sport.name}</h1><p>{sport.detail} · {sport.stage}</p><div className="sport-summary"><span><Users /> <b>{sport.participants}</b> Competitors</span><span><CalendarDays /> <b>{sport.matches}</b> Matches</span><span><Trophy /> <b>{sport.stage}</b> Current stage</span></div></header>
      <div className="page-shell compact"><section className="content-section"><div className="section-heading"><div><span className="eyebrow">Tournament pulse</span><h2>Current matches</h2></div></div><div className="match-grid">{sportMatches.length ? sportMatches.map((match) => <MatchCard key={match.id} match={match} />) : <div className="empty-state"><span>{sport.icon}</span><h3>Fixtures coming soon</h3><p>The tournament draw will appear here once published.</p></div>}</div></section><section className="bracket-preview"><div><span className="eyebrow">Knockout path</span><h2>Road to the final</h2></div><div className="bracket-round"><small>Quarter Final</small><span>Match 1 <b>TBD</b></span><span>Match 2 <b>TBD</b></span></div><div className="bracket-round"><small>Semi Final</small><span>Winner M1 <b>—</b></span></div><div className="bracket-round final"><small>Final</small><span><Trophy size={17} /> Championship <b>—</b></span></div></section></div>
    </div>
  );
}
