"use client";

import { useRef, useState, useEffect, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Trophy, Crown, Maximize2, Minimize2, Code2, Check } from "lucide-react";
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
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const containerRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const entries = new Map(bracket.entries.map(entry => [entry.id, entry.name]));
  const champion = championOf(bracket);
  const sportObj = catalog.find(s => s.slug === tournament.sportSlug);
  const sportColor = sportObj?.color || "#72d2ff";

  // Watch fullscreen changes
  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function handleShare() {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}${window.location.pathname}#section-${tournament.id}`;
      navigator.clipboard?.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

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

  // Get initial letters or abbreviation for avatar crest
  function getInitials(name: string): string {
    if (!name || name === "—" || name === "TBD" || name === "Bye") return "•";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
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

  const isFinalRound = (roundIdx: number) => roundIdx === bracket.rounds.length - 1;

  return (
    <section
      ref={containerRef}
      className={`ko dark-theme${isFullscreen ? " is-fullscreen" : ""}`}
      style={{ "--sport-color": sportColor } as CSSProperties}
      aria-label={`${tournament.title} tournament bracket`}
    >
      {/* Champion Banner */}
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

      {/* Top Controls Bar (Champions League Style) */}
      <div className="ko-cl-controls">
        <div className="ko-cl-title">
          <span className="ko-sport-icon">{sportObj?.icon || "🏆"}</span>
          <strong>{tournament.title}</strong>
        </div>

        <div className="ko-cl-actions">
          {/* Embed / Copy Link */}
          <button
            type="button"
            className="ko-cl-btn"
            onClick={handleShare}
            title="Copy shareable link to this bracket"
            aria-label="Copy bracket link"
          >
            {copiedLink ? <Check size={16} className="ko-copied" /> : <Code2 size={16} />}
          </button>

          {/* Round Dropdown Selector */}
          <div className="ko-cl-select-wrap">
            <select
              value={active}
              onChange={(e) => goTo(Number(e.target.value))}
              aria-label="Select round to view"
            >
              {bracket.rounds.map((_, index) => (
                <option key={index} value={index}>
                  {roundName(index, bracket.rounds.length, bracket.format || "knockout")}
                </option>
              ))}
            </select>
          </div>

          {/* Prev / Next Arrows */}
          <button
            type="button"
            className="ko-cl-btn"
            aria-label="Previous round"
            disabled={active === 0}
            onClick={() => goTo(active - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="ko-cl-btn"
            aria-label="Next round"
            disabled={active >= bracket.rounds.length - 1}
            onClick={() => goTo(active + 1)}
          >
            <ChevronRight size={16} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            className="ko-cl-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "View Fullscreen"}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Scrollable Bracket Area */}
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
              <div className="ko-round-header">
                <span className="ko-round-label">
                  {roundName(roundIndex, bracket.rounds.length, bracket.format || "knockout")}
                </span>
              </div>

              <div className="ko-matches">
                {round.map((match) => {
                  const is2Leg = match.legs === 2 || bracket.legs === 2;
                  const isFinal = isFinalRound(roundIndex);
                  const isSelected = selectedMatchId === match.id;

                  return (
                    <div
                      className={`ko-slot${roundIndex < bracket.rounds.length - 1 ? " has-line" : ""}${isSelected ? " active-line" : ""}`}
                      key={match.id}
                    >
                      <div
                        id={`bracket-${tournament.id}-${match.id}`}
                        className={`ko-match${match.winner ? " decided" : ""}${match.bye ? " bye" : ""}${isSelected ? " is-selected" : ""}${isFinal ? " is-final-match" : ""}`}
                        aria-label={`${roundName(roundIndex, bracket.rounds.length, bracket.format || "knockout")}, match ${match.position + 1}`}
                        onClick={() => setSelectedMatchId(selectedMatchId === match.id ? null : match.id)}
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
                          const name = id ? entries.get(id) ?? "Unknown" : match.bye ? "Bye" : roundIndex ? `TBD` : "—";

                          let scoreDisplay = side === "a" ? match.scoreA : match.scoreB;
                          const s2 = side === "a" ? match.scoreA2 : match.scoreB2;
                          if (is2Leg && s2) {
                            const agg = (Number(scoreDisplay) || 0) + (Number(s2) || 0);
                            scoreDisplay = `${scoreDisplay || "0"}+${s2} (${agg})`;
                          }

                          const initials = getInitials(name);

                          const row = (
                            <>
                              <span className="ko-crest" aria-hidden="true">
                                {initials}
                              </span>
                              <span className="ko-name" title={name}>
                                {name}
                              </span>
                              {scoreDisplay !== undefined && scoreDisplay !== "" && (
                                <span className="ko-score">{scoreDisplay}</span>
                              )}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                id && onWinner(match, id);
                              }}
                            >
                              {row}
                            </button>
                          ) : (
                            <div key={side} className={`ko-entry${isWinner ? " w" : isLoser ? " l" : ""}`}>
                              {row}
                            </div>
                          );
                        })}

                        {/* Final Pill Badge (Matching the user photo) */}
                        {isFinal && (
                          <div className="ko-final-badge-wrap">
                            <span className="ko-final-badge">Final</span>
                          </div>
                        )}

                        {/* Footer */}
                        {!match.bye && (onDetails || (onWinner && match.winner) || match.venue) && (
                          <div className="ko-footer">
                            <span>{match.venue || ""}</span>
                            {onDetails && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDetails(match);
                                }}
                                disabled={busy}
                              >
                                Details
                              </button>
                            )}
                            {onWinner && match.winner && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onWinner(match, null);
                                }}
                                disabled={busy}
                              >
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

      {/* Bottom Bar: Bye Legend matching user photo */}
      <div className="ko-bottom-bar">
        <div className="ko-legend">
          <span className="ko-legend-arrow">→</span>
          <span>Bye - automatic advancement</span>
        </div>
      </div>
    </section>
  );
}
