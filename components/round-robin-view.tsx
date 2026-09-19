"use client";

import { useState, type CSSProperties } from "react";
import { Trophy, Crown, Calendar, MapPin, Clock, Edit2 } from "lucide-react";
import {
  calculateStandings,
  championOf,
  type BracketMatch,
  type Tournament,
} from "@/lib/bracket";
import { sports as catalog } from "@/lib/data";

export function RoundRobinView({
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
  const entries = new Map(bracket.entries.map(e => [e.id, e.name]));
  const standings = calculateStandings(bracket);
  const champion = championOf(bracket);
  const sportObj = catalog.find(s => s.slug === tournament.sportSlug);
  const sportColor = sportObj?.color || "#72d2ff";

  const [activeRound, setActiveRound] = useState<number>(0);

  if (!bracket.rounds.length) {
    return (
      <div className="ko-empty" style={{ "--sport-color": sportColor } as CSSProperties}>
        <Trophy strokeWidth={1.5} />
        <p>Schedule not published yet</p>
        <span>Add players or teams in the lineup to generate the round-robin fixtures.</span>
      </div>
    );
  }

  return (
    <div
      className="round-robin-container"
      style={{ "--sport-color": sportColor } as CSSProperties}
      aria-label={`${tournament.title} round-robin league`}
    >
      {champion ? (
        <div className="ko-champion">
          <Crown strokeWidth={1.5} />
          <div>
            <span>League Champion</span>
            <strong>{champion.winner.name}</strong>
          </div>
          <small>Runner-up · {champion.runnerUp.name}</small>
        </div>
      ) : standings.length > 0 && standings[0].played > 0 ? (
        <div className="ko-champion table-leader-banner">
          <Trophy strokeWidth={1.5} />
          <div>
            <span>Current Table Leader</span>
            <strong>{standings[0].name} ({standings[0].points} pts)</strong>
          </div>
          <small>{bracket.entries.length} teams competing</small>
        </div>
      ) : null}

      {/* Standings Table Card */}
      <section className="rr-standings-card">
        <div className="rr-card-head">
          <h3>Tournament Standings</h3>
          <span className="rr-badge">{bracket.legs === 2 ? "2-Leg Series" : "Round Robin"}</span>
        </div>
        <div className="rr-table-wrapper">
          <table className="rr-table">
            <thead>
              <tr>
                <th className="th-rank">#</th>
                <th className="th-team">Team / Player</th>
                <th title="Matches Played">P</th>
                <th title="Won">W</th>
                <th title="Drawn">D</th>
                <th title="Lost">L</th>
                <th title="Goals/Points For">GF</th>
                <th title="Goals/Points Against">GA</th>
                <th title="Goal/Score Difference">GD</th>
                <th className="th-pts" title="Total Points">PTS</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, idx) => (
                <tr key={row.id} className={idx === 0 ? "rank-leader" : ""}>
                  <td className="td-rank">
                    {idx === 0 ? <Crown size={13} className="crown-icon" /> : idx + 1}
                  </td>
                  <td className="td-team">
                    <strong>{row.name}</strong>
                  </td>
                  <td>{row.played}</td>
                  <td>{row.won}</td>
                  <td>{row.drawn}</td>
                  <td>{row.lost}</td>
                  <td>{row.gf}</td>
                  <td>{row.ga}</td>
                  <td className={row.gd > 0 ? "pos-gd" : row.gd < 0 ? "neg-gd" : ""}>
                    {row.gd > 0 ? `+${row.gd}` : row.gd}
                  </td>
                  <td className="td-pts">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Fixtures by Round */}
      <section className="rr-fixtures-card">
        <div className="rr-card-head">
          <h3>Fixtures &amp; Results</h3>
          <div className="rr-round-selector">
            {bracket.rounds.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`rr-round-btn ${activeRound === idx ? "active" : ""}`}
                onClick={() => setActiveRound(idx)}
              >
                Round {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="rr-matches-grid">
          {bracket.rounds[activeRound]?.map((match) => {
            const nameA = match.a ? entries.get(match.a) ?? "Team A" : "TBD";
            const nameB = match.b ? entries.get(match.b) ?? "Team B" : "TBD";
            const isCompleted = !!match.completedAt || (match.scoreA !== "" && match.scoreB !== "");
            const winnerId = match.winner;

            return (
              <article
                key={match.id}
                className={`rr-match-card ${isCompleted ? "completed" : ""}`}
              >
                <div className="rr-match-header">
                  <span>Round {match.round + 1} · Match {match.position + 1}</span>
                  <span className={`rr-status-pill ${isCompleted ? "ft" : "upcoming"}`}>
                    {isCompleted ? "FT" : "Upcoming"}
                  </span>
                </div>

                <div className="rr-versus-box">
                  <div className={`rr-team-row ${winnerId === match.a ? "won" : ""}`}>
                    <span className="rr-team-name">{nameA}</span>
                    <span className="rr-team-score">{match.scoreA || "—"}</span>
                  </div>
                  <div className={`rr-team-row ${winnerId === match.b ? "won" : ""}`}>
                    <span className="rr-team-name">{nameB}</span>
                    <span className="rr-team-score">{match.scoreB || "—"}</span>
                  </div>
                </div>

                <div className="rr-match-footer">
                  <div className="rr-meta-info">
                    {match.date && <span><Calendar size={12} /> {match.date}</span>}
                    {match.time && <span><Clock size={12} /> {match.time}</span>}
                    {match.venue && <span><MapPin size={12} /> {match.venue}</span>}
                  </div>

                  {onDetails && (
                    <div className="rr-actions-row">
                      <button
                        type="button"
                        className="button small-button rr-details-btn"
                        onClick={() => onDetails(match)}
                        disabled={busy}
                      >
                        <Edit2 size={12} /> Score / Details
                      </button>
                      {onWinner && match.a && match.b && !match.winner && (
                        <div className="rr-quick-winner">
                          <button
                            type="button"
                            className="button ghost small-button"
                            onClick={() => onWinner(match, match.a)}
                            disabled={busy}
                          >
                            {nameA.slice(0, 8)} wins
                          </button>
                          <button
                            type="button"
                            className="button ghost small-button"
                            onClick={() => onWinner(match, "draw")}
                            disabled={busy}
                          >
                            Draw
                          </button>
                          <button
                            type="button"
                            className="button ghost small-button"
                            onClick={() => onWinner(match, match.b)}
                            disabled={busy}
                          >
                            {nameB.slice(0, 8)} wins
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
