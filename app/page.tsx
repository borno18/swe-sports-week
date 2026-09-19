import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronRight, MapPin, Trophy, GitBranch } from "lucide-react";
import { event } from "@/lib/data";
import { getTournamentData } from "@/lib/tournaments";
import { SportCard } from "@/components/sport-card";
import { EventCountdown } from "@/components/event-countdown";
import { Suspense } from "react";

async function HeroStats() {
  const { sports, tournaments, matches, champions } = await getTournamentData();
  return <div className="hero-scorebar"><div><strong>{sports.length}</strong><span>Sports</span></div><i /><div><strong>{tournaments.reduce((sum, t) => sum + t.bracket.entries.length, 0)}</strong><span>Entries</span></div><i /><div><strong>{matches.filter(m => m.status === "completed").length}</strong><span>Matches played</span></div><i /><div><strong>{champions.length}</strong><span>Champions</span></div></div>;
}

function StatsPlaceholder() {
  return <div className="hero-scorebar" aria-label="Loading event statistics">{["Sports", "Entries", "Matches played", "Champions"].map(label => <div key={label}><strong>—</strong><span>{label}</span></div>)}</div>;
}

export default function Home() {
  return <>
    <section className="hero">
      <div className="hero-halo" /><div className="halftone halftone-left" /><div className="halftone halftone-right" />
      <div className="hero-content">
        <div className="hero-organizer-badge">
          <img
            src="/logos/swe-society-logo-white.png"
            alt="SWE Society"
            className="hero-society-logo"
          />
          <div className="badge-text">
            <span className="badge-kicker">ORGANIZED BY</span>
            <strong className="badge-title">SWE SOCIETY</strong>
          </div>
        </div>
        <div className="live-kicker">The official tournament hub</div>
        <h1><span>INTRA SWE</span>SPORTS WEEK</h1>
        <p className="hero-year">{event.year}</p>
        <div className="hero-details"><span><CalendarDays size={18} />{event.dates}</span><span><MapPin size={18} />IICT,SUST</span></div>
        <p className="hero-copy">One campus. Every batch. Follow every player, every match, and every path to the final.</p>
        <div className="hero-actions"><Link href="#tournaments" className="button primary">Explore the arenas <ArrowRight size={18} /></Link><Link href="/schedule" className="button ghost">View match schedule</Link></div>
        <EventCountdown />
      </div>
      <div className="hero-orbit orbit-one">⚽</div><div className="hero-orbit orbit-two">🎯</div><div className="hero-orbit orbit-three">🏸</div>
      <Suspense fallback={<StatsPlaceholder />}><HeroStats /></Suspense>
    </section>
    <Suspense fallback={<section className="section" id="tournaments" aria-label="Loading tournaments"><p role="status">Loading the arenas…</p></section>}><HomeTournaments /></Suspense>
  </>;
}

async function HomeTournaments() {
  const { sports, matches, champions } = await getTournamentData();
  const completed = matches.filter(m => m.status === "completed");
  const progress = matches.length ? Math.round(completed.length / matches.length * 100) : 0;
  return <>
    <section className="section" id="tournaments"><div className="section-heading"><div><span className="eyebrow"><GitBranch size={15} /> Every path to the final</span><h2>Pick your arena</h2></div><Link href="/sports">All sports <ChevronRight size={17} /></Link></div><div className="sports-grid">{sports.map(sport => <SportCard key={sport.slug} sport={sport} />)}</div></section>
    <section className="progress-band"><div><span className="eyebrow">Event progress</span><h2>Every match brings us closer.</h2><p>{completed.length} of {matches.length} published matches are complete.</p></div><div className="progress-visual"><strong>{progress}<sup>%</sup></strong><div className="progress-track"><span style={{ width: `${progress}%` }} /><i>{completed.length} / {matches.length}</i></div></div><div className="stage-list"><span><Trophy />{champions.length} champions crowned</span></div></section>
    <section className="champion-cta"><Trophy className="trophy-watermark" /><span>Hall of champions</span><h2>Legends are made this week.</h2><p>Celebrate every winner, runner-up, and story from Sports Week.</p><Link href="/champions" className="button cream">Meet the champions <ArrowRight size={18} /></Link></section>
  </>;
}
