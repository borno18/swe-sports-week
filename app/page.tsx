import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronRight, MapPin, Megaphone, Radio, Sparkles, Trophy } from "lucide-react";
import { announcements, event, eventDays, matches, sports } from "@/lib/data";
import { MatchCard } from "@/components/match-card";
import { SportCard } from "@/components/sport-card";
import { AnimateOnScroll } from "@/components/animate-on-scroll";

export default function Home() {
  const liveMatches = matches.filter((match) => match.status === "live");
  const nextMatches = matches.filter((match) => match.status === "upcoming" && match.day === 1);

  return (
    <>
      <section className="hero">
        <div className="hero-halo" />
        <div className="halftone halftone-left" />
        <div className="halftone halftone-right" />
        <div className="hero-content">
          <div className="live-kicker">Sports Week preview</div>
          <h1><span>INTRA SWE</span>SPORTS WEEK</h1>
          <p className="hero-year">{event.year}</p>
          <div className="hero-details"><span><CalendarDays size={18} />{event.dates}</span><span><MapPin size={18} />SUST Campus</span></div>
          <p className="hero-copy">One campus. Every batch. Seven days of competition, connection, and unforgettable moments.</p>
          <div className="hero-actions"><Link href="/schedule" className="button primary">View match schedule <ArrowRight size={18} /></Link><Link href="/sports" className="button ghost">Explore tournaments</Link></div>
          <p className="demo-note">Preview data · Fixtures and scores shown are examples.</p>
        </div>
        <div className="hero-orbit orbit-one">⚽</div><div className="hero-orbit orbit-two">♟</div><div className="hero-orbit orbit-three">🏸</div>
        <div className="hero-scorebar">
          <div><strong>16</strong><span>Sports</span></div><i /><div><strong>286</strong><span>Players</span></div><i /><div><strong>134</strong><span>Matches played</span></div><i /><div><strong className="live-number">2</strong><span>Live now</span></div>
        </div>
      </section>

      <AnimateOnScroll>
        <section className="section live-section">
          <div className="section-heading"><div><span className="eyebrow live-text"><Radio size={14} /> Live now</span><h2>The action is happening</h2></div><Link href="/schedule">Full schedule <ChevronRight size={17} /></Link></div>
          <div className="match-grid">{liveMatches.map((match) => <MatchCard key={match.id} match={match} />)}</div>
        </section>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <section className="section today-section">
          <div className="section-heading"><div><span className="eyebrow">{eventDays[0].label}</span><h2>Coming up on day one</h2></div><div className="date-chip"><CalendarDays size={16} /> Day 1 of 7</div></div>
          <div className="timeline">
            {nextMatches.map((match, index) => (
              <Link className="timeline-item" href={`/schedule?day=${match.day}&match=${match.id}#match-${match.id}`} key={match.id}>
                <div className="timeline-time"><strong>{match.time}</strong><span>{index === 0 ? "Next" : "Later"}</span></div>
                <div className="timeline-dot" />
                <div className="timeline-body"><span className="sport-label"><b>{match.icon}</b>{match.sport}</span><h3>{match.participantA} <em>vs</em> {match.participantB}</h3><p>{match.category} · {match.round}</p><small><MapPin size={14} />{match.venue}</small></div>
                <ChevronRight className="timeline-arrow" />
              </Link>
            ))}
          </div>
        </section>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <section className="progress-band">
          <div><span className="eyebrow"><Sparkles size={14} /> Event progress</span><h2>Every match brings us closer.</h2><p>134 of 172 scheduled matches are complete.</p></div>
          <div className="progress-visual"><strong>78<sup>%</sup></strong><div className="progress-track"><span /><i>134 / 172</i></div></div>
          <div className="stage-list"><span><b className="complete">✓</b> Pen Fight <small>Completed</small></span><span><b>⚽</b> Football <small>Semi Finals</small></span><span><b>🏸</b> Badminton <small>Quarter Finals</small></span></div>
        </section>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <section className="section sports-section">
          <div className="section-heading"><div><span className="eyebrow">All tournaments</span><h2>Pick your arena</h2></div><Link href="/sports">View all sports <ChevronRight size={17} /></Link></div>
          <div className="sports-grid">{sports.slice(0, 4).map((sport) => <SportCard key={sport.slug} sport={sport} />)}</div>
        </section>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <section className="section notice-section">
          <div className="section-heading"><div><span className="eyebrow"><Megaphone size={14} /> Official updates</span><h2>Don&apos;t miss a change</h2></div><Link href="/announcements">All announcements <ChevronRight size={17} /></Link></div>
          <div className="notice-grid">{announcements.map((item) => <article className={`notice-card ${item.level}`} key={item.title}><div className="notice-icon"><Megaphone /></div><div><span>{item.level} · {item.time}</span><h3>{item.title}</h3><p>{item.body}</p></div></article>)}</div>
        </section>
      </AnimateOnScroll>

      <AnimateOnScroll>
        <section className="champion-cta"><Trophy className="trophy-watermark" /><span>Hall of champions</span><h2>Legends are made this week.</h2><p>Celebrate every winner, runner-up, and story from Sports Week.</p><Link href="/champions" className="button cream">Meet the champions <ArrowRight size={18} /></Link></section>
      </AnimateOnScroll>
    </>
  );
}
