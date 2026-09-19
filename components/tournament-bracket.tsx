"use client";

import { useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Trophy, Crown } from "lucide-react";
import { championOf, roundName, type BracketMatch, type Tournament } from "@/lib/bracket";
import { sports as catalog } from "@/lib/data";

export function TournamentBracket({
  tournament,
  onWinner,
  onDetails,
  busy = false,
}: {
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
  const sportObj = catalog.find(s => s.slug === tournament.sportSlug);
  const sportColor = sportObj?.color || "#72d2ff";

  function goTo(index: number) {
    const scroller = scrollRef.current;
    const column = scroller?.querySelectorAll<HTMLElement>(".ko-round")[index];
    if (!scroller || !column) return;
    setActive(index);
    scroller.scrollTo({
      left: column.offsetLeft - 18,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  if (!bracket.rounds.length) {
    return (
      <div className="ko-empty" style={{ "--sport-color": sportColor } as CSSProperties}>
        <Trophy strokeWidth={1.5} />
        <p>Draw not published yet</p>
        <span>The bracket will appear here once the organizer adds the lineup.</span>
      </div>
    );
  }

  return (
    <section
      className="ko"
      style={{ "--sport-color": sportColor } as CSSProperties}
      aria-label={`${tournament.title} tournament bracket`}
    >
      {champion && (
        <div className="ko-champion">
          <Crown strokeWidth={1.5} />
          <div>
            <span>Champion</span>
            <strong>{champion.winner.name}</strong>
          </div>
          <small>Runner-up · {champion.runnerUp.name}</small>
        </div>
      )}
      <div className="ko-nav">
        <button
          type="button"
          aria-label="Previous round"
          disabled={active === 0}
          onClick={() => goTo(active - 1)}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="ko-tabs" role="tablist">
          {bracket.rounds.map((_, index) => (
            <button
              type="button"
              role="tab"
              key={index}
              aria-selected={active === index}
              onClick={() => goTo(index)}
            >
              {roundName(index, bracket.rounds.length, bracket.format || "knockout")}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Next round"
          disabled={active >= bracket.rounds.length - 1}
          onClick={() => goTo(active + 1)}
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div
        className="ko-scroll"
        ref={scrollRef}
        tabIndex={0}
        aria-label="Scrollable tournament rounds"
        onScroll={(event) => {
          const scroller = event.currentTarget;
          const columns = Array.from(scroller.querySelectorAll<HTMLElement>(".ko-round"));
          const atEnd = scroller.scrollLeft > 0 && scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 2;
          const nearest = atEnd
            ? columns.length - 1
            : columns.reduce(
                (best, col, index) =>
                  Math.abs(col.offsetLeft - scroller.scrollLeft - 18) <
                  Math.abs(columns[best].offsetLeft - scroller.scrollLeft - 18)
                    ? index
                    : best,
                0
              );
          setActive(nearest);
        }}
      >
        <div
          className="ko-track"
          style={{ "--first-matches": bracket.rounds[0].length } as CSSProperties}
        >
          {bracket.rounds.map((round, roundIndex) => (
            <div
              className="ko-round"
              key={roundIndex}
              style={{ "--span": 2 ** roundIndex } as CSSProperties}
            >
              <span className="ko-round-label">
                {roundName(roundIndex, bracket.rounds.length, bracket.format || "knockout")}
              </span>
              <div className="ko-matches">
                {round.map((match) => {
                  const is2Leg = match.legs === 2 || bracket.legs === 2;
                  return (
                    <div
                      className={`ko-slot${roundIndex < bracket.rounds.length - 1 ? " has-line" : ""}`}
                      key={match.id}
                    >
                      <div
                        id={`bracket-${tournament.id}-${match.id}`}
                        className={`ko-match${match.winner ? " decided" : ""}${match.bye ? " bye" : ""}`}
                        aria-label={`${roundName(roundIndex, bracket.rounds.length, bracket.format || "knockout")}, match ${match.position + 1}`}
                      >
                        {/* Match header */}
                        <div className="ko-header">
                          <span>
                            {match.date
                              ? new Date(`${match.date}T12:00:00Z`).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  timeZone: "UTC",
                                })
                              : ""}
                            {match.time ? ` · ${match.time}` : ""}
                            {is2Leg && <strong className="ko-leg-pill"> 2 Legs</strong>}
                          </span>
                          <span
                            className={`ko-status${match.winner ? " ft" : match.bye ? " bye" : match.a && match.b ? " ready" : ""}`}
                          >
                            {match.bye ? "BYE" : match.winner ? "FT" : match.a && match.b ? "●" : ""}
                          </span>
                        </div>

                        {/* Entrants */}
                        {(["a", "b"] as const).map((side) => {
                          const id = match[side];
                          const isWinner = !!id && match.winner === id;
                          const isLoser = !!match.winner && !isWinner && !!id;
                          const name = id ? entries.get(id) : match.bye ? "Bye" : roundIndex ? `TBD` : "—";

                          let scoreDisplay = side === "a" ? match.scoreA : match.scoreB;
                          const s2 = side === "a" ? match.scoreA2 : match.scoreB2;
                          if (is2Leg && s2) {
                            const agg = (Number(scoreDisplay) || 0) + (Number(s2) || 0);
                            scoreDisplay = `${scoreDisplay || "0"}+${s2} (${agg})`;
                          }

                          const row = (
                            <>
                              <span className="ko-name" title={name}>
                                {name}
                              </span>
                              {scoreDisplay && <span className="ko-score">{scoreDisplay}</span>}
                              {isWinner && <span className="ko-tick">✓</span>}
                            </>
                          );

                          return onWinner ? (
                            <button
                              key={side}
                              type="button"
                              className={`ko-entry${isWinner ? " w" : isLoser ? " l" : ""}`}
                              disabled={busy || !match.a || !match.b || !!match.winner}
                              aria-label={isWinner ? `${name}, winner` : `Choose ${name} as winner`}
                              onClick={() => id && onWinner(match, id)}
                            >
                              {row}
                            </button>
                          ) : (
                            <div key={side} className={`ko-entry${isWinner ? " w" : isLoser ? " l" : ""}`}>
                              {row}
                            </div>
                          );
                        })}

                        {/* Footer */}
                        {!match.bye && (
                          <div className="ko-footer">
                            <span>{match.venue || ""}</span>
                            {onDetails && (
                              <button type="button" onClick={() => onDetails(match)} disabled={busy}>
                                Details
                              </button>
                            )}
                            {onWinner && match.winner && (
                              <button type="button" onClick={() => onWinner(match, null)} disabled={busy}>
                                Undo
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
