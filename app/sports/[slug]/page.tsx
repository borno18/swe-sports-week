import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Trophy, Users, UserCheck } from "lucide-react";
import Link from "next/link";
import { getTournamentData } from "@/lib/tournaments";
import { TournamentBracket } from "@/components/tournament-bracket";
import { RoundRobinView } from "@/components/round-robin-view";
import { FlexibleBracketView } from "@/components/flexible-bracket-view";
import { GameRulesCard } from "@/components/game-rules-card";
import { GroupStageView } from "@/components/group-stage-view";
import { ensureDatabaseInitialized } from "@/lib/db";
import { getSportRule } from "@/lib/rules-store";
import { getCoordinatorsForSport } from "@/lib/volunteers-data";

export default async function SportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await ensureDatabaseInitialized();
  const [{ sports, tournaments }, rule] = await Promise.all([
    getTournamentData(),
    getSportRule(db, slug),
  ]);
  const sport = sports.find(item => item.slug === slug);
  if (!sport) notFound();
  const sections = tournaments.filter(t => t.sportSlug === slug);
  const hasLeague = sections.some(s => s.bracket.format === "round_robin" || s.bracket.hasGroupStage);
  const hasFlexible = sections.some(s => s.bracket.format === "flexible");
  const coordinators = getCoordinatorsForSport(slug);

  return (
    <div className="sport-page" style={{ "--sport-color": sport.color } as React.CSSProperties}>
      <header className="sport-hero">
        <Link href="/sports"><ArrowLeft size={16} /> All sports</Link>
        <div className="sport-hero-icon">{sport.icon}</div>
        <div className="sport-hero-topline">
          <span>{sport.category} tournament</span>
          {coordinators.length > 0 && (
            <span className="sport-coordinator-badge">
              <UserCheck size={14} />
              <span><strong>Coordinator:</strong> {coordinators.join(", ")}</span>
            </span>
          )}
        </div>
        <h1>{sport.name}</h1>
        <p>{sport.detail} · {sport.stage}</p>
        <div className="sport-summary">
          <span><Users /> <b>{sport.participants}</b> Players / teams</span>
          <span><CalendarDays /> <b>{sport.matches}</b> Matches</span>
          <span><Trophy /> {hasLeague ? (sections.some(s => s.bracket.format !== "round_robin") ? "League & knockout" : "Round robin league") : hasFlexible ? "Flexible knockout" : "Single elimination"}</span>
          {coordinators.length > 0 && (
            <span className="sport-coordinator-pill-item">
              <UserCheck size={15} /> <b>Coordinator:</b> {coordinators.join(", ")}
            </span>
          )}
        </div>
      </header>
      <div className="public-brackets">
        {/* Official Rules & Match Format */}
        <GameRulesCard sportSlug={slug} initialRule={rule} />

        <div className="section-heading">
          <div>
            <span className="eyebrow">From the first round to the final</span>
            <h2>Tournament fixtures &amp; tables</h2>
          </div>
          <span className="update-label">Live updates · checked every 10 seconds</span>
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
              {t.bracket.entries.length} {t.entryKind === "team" ? "teams / pairs" : "players"} · {t.bracket.hasGroupStage ? "Groups + Knockout" : t.bracket.format === "round_robin" ? "Round Robin League" : t.bracket.format === "flexible" ? "Flexible Knockout" : "Knockout"}
              {t.bracket.legs === 2 ? " (2 Legs)" : ""}
            </p>
            {t.bracket.hasGroupStage && <GroupStageView tournament={t} />}
            {t.bracket.format === "round_robin" ? (
              <RoundRobinView tournament={t} />
            ) : t.bracket.format === "flexible" ? (
              <FlexibleBracketView tournament={t} />
            ) : (
              <TournamentBracket tournament={t} />
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
