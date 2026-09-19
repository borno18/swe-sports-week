import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { getTournamentData } from "@/lib/tournaments";
import { TournamentBracket } from "@/components/tournament-bracket";
import { RoundRobinView } from "@/components/round-robin-view";

export default async function SportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { sports, tournaments } = await getTournamentData();
  const sport = sports.find(item => item.slug === slug);
  if (!sport) notFound();
  const sections = tournaments.filter(t => t.sportSlug === slug);
  const hasLeague = sections.some(s => s.bracket.format === "round_robin");

  return (
    <div className="sport-page" style={{ "--sport-color": sport.color } as React.CSSProperties}>
      <header className="sport-hero">
        <Link href="/sports"><ArrowLeft size={16} /> All sports</Link>
        <div className="sport-hero-icon">{sport.icon}</div>
        <span>{sport.category} tournament</span>
        <h1>{sport.name}</h1>
        <p>{sport.detail} · {sport.stage}</p>
        <div className="sport-summary">
          <span><Users /> <b>{sport.participants}</b> Players / teams</span>
          <span><CalendarDays /> <b>{sport.matches}</b> Matches</span>
          <span><Trophy /> {hasLeague ? "Group Stage & Knockout" : "Single elimination"}</span>
        </div>
      </header>
      <div className="public-brackets">
        <div className="section-heading">
          <div>
            <span className="eyebrow">From the first round to the final</span>
            <h2>Tournament fixtures &amp; tables</h2>
          </div>
          <span className="update-label">Updates automatically · every 10 seconds</span>
        </div>
        {sections.length > 1 && (
          <nav className="filter-row" aria-label="Sport sections">
            {sections.map(t => (
              <a key={t.id} className="filter" href={`#section-${t.id}`}>
                {t.title}
              </a>
            ))}
          </nav>
        )}
        {sections.map(t => (
          <section className="public-bracket-section" id={`section-${t.id}`} key={t.id}>
            <h2>{t.title}</h2>
            <p className="result-count">
              {t.bracket.entries.length} {t.entryKind === "team" ? "teams / pairs" : "players"} · {t.bracket.format === "round_robin" ? "Round Robin League" : "Knockout"}
              {t.bracket.legs === 2 ? " (2 Legs)" : ""}
            </p>
            {t.bracket.format === "round_robin" ? (
              <RoundRobinView tournament={t} />
            ) : (
              <TournamentBracket tournament={t} />
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
