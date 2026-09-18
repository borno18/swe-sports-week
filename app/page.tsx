import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronRight, MapPin, Trophy, GitBranch } from "lucide-react";
import { event } from "@/lib/data";
import { getTournamentData } from "@/lib/tournaments";
import { MatchCard } from "@/components/match-card";
import { SportCard } from "@/components/sport-card";
import { TournamentBracket } from "@/components/tournament-bracket";
import { EventCountdown } from "@/components/event-countdown";

export default async function Home() {
  const { sports, tournaments, matches, champions } = await getTournamentData();
  const published = tournaments.filter(t => t.bracket.rounds.length);
  const completed = matches.filter(m => m.status === "completed");
  const recent = [...completed].sort((a,b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)).slice(0, 2);
  const progress = matches.length ? Math.round(completed.length / matches.length * 100) : 0;
  return <>
    <section className="hero">
      <div className="hero-halo" /><div className="halftone halftone-left" /><div className="halftone halftone-right" />
      <div className="hero-content">
        <div className="hero-organizer-badge">
          <div className="society-badge">
            <img
              src="/logos/swe-society-logo-white.png"
              alt="SWE Society Logo"
              className="hero-society-logo"
            />
            <div className="badge-text">
              <span className="badge-kicker">ORGANIZED BY</span>
              <strong className="badge-title">SWE SOCIETY</strong>
            </div>
          </div>
          <span className="organizer-slash">/</span>
          <div className="sust-badge">
            <div className="sust-crest-container">
              <img
                src="/logos/sust-logo.png"
                alt="SUST Crest"
                className="hero-sust-crest"
              />
            </div>
            <div className="badge-text">
              <span className="badge-kicker">AFFILIATION</span>
              <strong className="badge-title">SUST</strong>
            </div>
          </div>
        </div>
        <div className="live-kicker">The official tournament hub</div>
        <h1><span>INTRA SWE</span>SPORTS WEEK</h1>
        <p className="hero-year">{event.year}</p>
        <div className="hero-details"><span><CalendarDays size={18} />{event.dates}</span><span><MapPin size={18} />SUST Campus</span></div>
        <p className="hero-copy">One campus. Every batch. Follow every player, every match, and every path to the final.</p>
        <div className="hero-actions"><Link href="#tournaments" className="button primary">Explore the brackets <ArrowRight size={18} /></Link><Link href="/schedule" className="button ghost">View match schedule</Link></div>
        <EventCountdown />
      </div>
      <div className="hero-orbit orbit-one">⚽</div><div className="hero-orbit orbit-two">🎯</div><div className="hero-orbit orbit-three">🏸</div>
      <div className="hero-scorebar"><div><strong>{sports.length}</strong><span>Sports</span></div><i /><div><strong>{tournaments.reduce((sum,t) => sum + t.bracket.entries.length,0)}</strong><span>Entries</span></div><i /><div><strong>{completed.length}</strong><span>Matches played</span></div><i /><div><strong>{champions.length}</strong><span>Champions</span></div></div>
    </section>
    <section className="section" id="tournaments"><div className="section-heading"><div><span className="eyebrow"><GitBranch size={15} /> Every path to the final</span><h2>Pick your arena</h2></div><Link href="/sports">All sports <ChevronRight size={17} /></Link></div><div className="sports-grid">{sports.map(sport => <SportCard key={sport.slug} sport={sport} />)}</div></section>
    {published.length > 0 && <section className="public-brackets home-brackets"><div className="section-heading"><div><span className="eyebrow">The tournament picture</span><h2>Follow the competition</h2></div><span className="update-label">Updates automatically · every 10 seconds</span></div>{published.map(t => <section className="public-bracket-section" key={t.id}><div className="section-heading"><h2>{t.title}</h2><Link href={`/sports/${t.sportSlug}#section-${t.id}`}>View section <ChevronRight size={16} /></Link></div><TournamentBracket tournament={t} /></section>)}</section>}
    {!published.length && <section className="section"><div className="empty-state"><GitBranch /><h3>The draws are on their way.</h3><p>Official brackets will appear here as each section's lineup is published.</p></div></section>}
    {recent.length > 0 && <section className="section"><div className="section-heading"><div><span className="eyebrow">Latest outcomes</span><h2>Through to the next round</h2></div><Link href="/results">All results <ChevronRight size={17} /></Link></div><div className="mc-grid">{recent.map(match => <MatchCard key={match.id} match={match} />)}</div></section>}
    <section className="progress-band"><div><span className="eyebrow">Event progress</span><h2>Every match brings us closer.</h2><p>{completed.length} of {matches.length} published matches are complete.</p></div><div className="progress-visual"><strong>{progress}<sup>%</sup></strong><div className="progress-track"><span style={{ width: `${progress}%` }} /><i>{completed.length} / {matches.length}</i></div></div><div className="stage-list"><span><Trophy />{champions.length} champions crowned</span></div></section>
    <section className="champion-cta"><Trophy className="trophy-watermark" /><span>Hall of champions</span><h2>Legends are made this week.</h2><p>Celebrate every winner, runner-up, and story from Sports Week.</p><Link href="/champions" className="button cream">Meet the champions <ArrowRight size={18} /></Link></section>
  </>;
}
