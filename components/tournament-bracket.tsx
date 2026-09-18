"use client";

import { useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Trophy, Check } from "lucide-react";
import { championOf, roundName, type BracketMatch, type Tournament } from "@/lib/bracket";

export function TournamentBracket({ tournament, onWinner, onDetails, busy = false }: {
  tournament: Tournament;
  onWinner?: (match: BracketMatch, entry: string | null) => void;
  onDetails?: (match: BracketMatch) => void;
  busy?: boolean;
}) {
  const { bracket } = tournament;
  const [active, setActive] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const entries = new Map(bracket.entries.map(entry => [entry.id, entry.name]));
  const champion = championOf(bracket);
  function goTo(index: number) {
    const scroller = scrollRef.current;
    const column = scroller?.querySelectorAll<HTMLElement>(".knockout-round")[index];
    if (!scroller || !column) return;
    setActive(index);
    scroller.scrollTo({ left: column.offsetLeft, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  if (!bracket.rounds.length) return <div className="empty-state"><Trophy /><h3>Draw not published yet</h3><p>Players, teams, and their route to the final will appear here once the organizer adds the lineup.</p></div>;
  return <section className="knockout" aria-label={`${tournament.title} tournament bracket`}>
    {champion && <div className="bracket-champion"><Trophy aria-hidden="true" /><div><small>Champion</small><strong>{champion.winner.name}</strong></div><span>Runner-up · {champion.runnerUp.name}</span></div>}
    <div className="round-toolbar">
      <button type="button" aria-label="Previous round" disabled={active === 0} onClick={() => goTo(active - 1)}><ChevronLeft /></button>
      <nav className="round-tabs" aria-label="Bracket rounds">
        {bracket.rounds.map((_, index) => <button type="button" key={index} aria-current={active === index ? "step" : undefined} onClick={() => goTo(index)}>{roundName(index, bracket.rounds.length)}</button>)}
      </nav>
      <button type="button" aria-label="Next round" disabled={active >= bracket.rounds.length - 1} onClick={() => goTo(active + 1)}><ChevronRight /></button>
    </div>
    <p className="bracket-help">{onWinner ? "Click a player's or team's name to record the winner. " : "Follow the connecting lines to see who advances. "}Swipe or use the round buttons to explore.</p>
    <div className="knockout-scroll" ref={scrollRef} tabIndex={0} aria-label="Scrollable tournament rounds" onScroll={(event) => {
      const scroller = event.currentTarget;
      const columns = Array.from(scroller.querySelectorAll<HTMLElement>(".knockout-round"));
      const atEnd = scroller.scrollLeft > 0 && scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 2;
      const nearest = atEnd ? columns.length - 1 : columns.reduce((best, col, index) => Math.abs(col.offsetLeft - scroller.scrollLeft) < Math.abs(columns[best].offsetLeft - scroller.scrollLeft) ? index : best, 0);
      setActive(nearest);
    }}>
      <div className="knockout-track" style={{ "--first-matches": bracket.rounds[0].length } as CSSProperties}>
        {bracket.rounds.map((round, roundIndex) => <div className="knockout-round" key={roundIndex} style={{ "--span": 2 ** roundIndex } as CSSProperties}>
          <h3>{roundName(roundIndex, bracket.rounds.length)}</h3>
          <div className="knockout-round-matches">
            {round.map(match => <div className={`knockout-slot ${roundIndex < bracket.rounds.length - 1 ? "has-next" : ""}`} key={match.id}>
              <article id={`bracket-${tournament.id}-${match.id}`} className={`knockout-card ${match.winner ? "decided" : ""}`} aria-label={`${roundName(roundIndex, bracket.rounds.length)}, match ${match.position + 1}`}>
                <div className="knockout-meta"><span>{match.date ? new Date(`${match.date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) : `Match ${match.position + 1}`}{match.time ? ` · ${match.time}` : ""}</span><b>{match.bye ? "BYE" : match.winner ? "FT" : match.a && match.b ? "Ready" : "Waiting"}</b></div>
                {(["a", "b"] as const).map(side => {
                  const id = match[side];
                  const winner = !!id && match.winner === id;
                  const label = id ? entries.get(id) : match.bye ? "Bye · automatic advance" : roundIndex ? `Winner of match ${match.position * 2 + (side === "a" ? 1 : 2)}` : "Awaiting entry";
                  const content = <><span className="entrant-initial" aria-hidden="true">{id ? entries.get(id)?.slice(0, 1).toUpperCase() : "—"}</span><span className="entrant-name" title={label}>{label}</span><span className="entrant-score">{side === "a" ? match.scoreA : match.scoreB}</span>{winner && <Check size={16} aria-label="Winner" />}</>;
                  return onWinner ? <button key={side} type="button" className={`knockout-entrant ${winner ? "winner" : match.winner ? "eliminated" : ""}`} disabled={busy || !match.a || !match.b || !!match.winner} aria-label={winner ? `${label}, winner` : `Choose ${label} as winner`} onClick={() => id && onWinner(match, id)}>{content}</button> : <div key={side} className={`knockout-entrant ${winner ? "winner" : match.winner ? "eliminated" : ""}`}>{content}</div>;
                })}
                <div className="knockout-bottom"><span title={match.venue}>{match.venue || (match.bye ? "Advances automatically" : "Venue to be confirmed")}</span>{onDetails && !match.bye && <button type="button" onClick={() => onDetails(match)} disabled={busy}>Details</button>}{onWinner && match.winner && !match.bye && <button type="button" onClick={() => onWinner(match, null)} disabled={busy}>Undo</button>}</div>
              </article>
            </div>)}
          </div>
        </div>)}
      </div>
    </div>
  </section>;
}
