"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Trophy, Crown, Calendar, MapPin, Clock, Edit2, Check, X, Minus } from "lucide-react";
import {
  calculateStandings,
  championOf,
  type BracketMatch,
  type Tournament,
} from "@/lib/bracket";
import { sports as catalog, formatMatchTime } from "@/lib/data";

function getCricketTeamBadge(name: string) {
  const n = name.trim();
  if (/9th/i.test(n)) return { initials: "9TH", bg: "linear-gradient(135deg, #10b981, #047857)" };
  if (/fakibaaz/i.test(n)) return { initials: "FKB", bg: "linear-gradient(135deg, #f59e0b, #b45309)" };
  if (/tlt/i.test(n)) return { initials: "TLT", bg: "linear-gradient(135deg, #3b82f6, #1d4ed8)" };
  if (/binary/i.test(n)) return { initials: "BB", bg: "linear-gradient(135deg, #6366f1, #4338ca)" };
  if (/jani/i.test(n)) return { initials: "JN", bg: "linear-gradient(135deg, #ec4899, #be185d)" };
  if (/semicolon/i.test(n)) return { initials: ";SC", bg: "linear-gradient(135deg, #06b6d4, #0e7490)" };
  if (/hepta/i.test(n)) return { initials: "HH", bg: "linear-gradient(135deg, #8b5cf6, #6d28d9)" };
  if (/backbench/i.test(n)) return { initials: "BXI", bg: "linear-gradient(135deg, #0ea5e9, #0369a1)" };
  const words = n.split(/\s+/);
  const initials = words.length > 1 ? (words[0][0] + words[1][0]).toUpperCase() : n.slice(0, 3).toUpperCase();
  return { initials, bg: "linear-gradient(135deg, #64748b, #334155)" };
}

function formatNRR(nrr?: number): string {
  if (nrr === undefined || nrr === null || isNaN(nrr)) return "+0.000";
  const sign = nrr > 0 ? "+" : nrr < 0 ? "" : "+";
  return `${sign}${nrr.toFixed(3)}`;
}

export function RoundRobinView({
  tournament,
  onWinner,
  onDetails,
  busy = false,
  groupStage = false,
}: {
  tournament: Tournament;
  onWinner?: (match: BracketMatch, entry: string | null) => void;
  onDetails?: (match: BracketMatch) => void;
  busy?: boolean;
  groupStage?: boolean;
}) {
  const { bracket } = tournament;
  const isCricket = tournament.sportSlug === "cricket";
  const entries = useMemo(() => new Map(bracket.entries.map(e => [e.id, e.name])), [bracket.entries]);
  const standings = useMemo(() => calculateStandings(bracket, tournament.sportSlug), [bracket, tournament.sportSlug]);
  const champion = useMemo(() => championOf(bracket), [bracket]);
  const sportObj = catalog.find(s => s.slug === tournament.sportSlug);
  const sportColor = sportObj?.color || "#72d2ff";

  const [activeRound, setActiveRound] = useState<number>(0);
  const selectedRound = Math.min(activeRound, Math.max(0, bracket.rounds.length - 1));

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
      {!groupStage && champion ? (
        <div className="ko-champion">
          <Crown strokeWidth={1.5} />
          <div>
            <span>League Champion</span>
            <strong>{champion.winner.name}</strong>
          </div>
          <small>Runner-up · {champion.runnerUp.name}</small>
        </div>
      ) : !groupStage && standings.length > 0 && standings[0].played > 0 ? (
        <div className="ko-champion table-leader-banner">
          <Trophy strokeWidth={1.5} />
          <div>
            <span>Current Table Leader</span>
            <strong>
              {standings[0].name} ({standings[0].points} pts{isCricket ? ` · NRR ${formatNRR(standings[0].nrr)}` : ""})
            </strong>
          </div>
          <small>{bracket.entries.length} teams competing</small>
        </div>
      ) : null}

      {/* Standings Table Card */}
      <section className="rr-standings-card">
        <div className="rr-card-head">
          <h3>{isCricket ? "Cricket Points Table" : "Tournament Standings"}</h3>
          <span className="rr-badge">{isCricket ? "Group Stage · 8 Overs" : bracket.legs === 2 ? "2-Leg Series" : "Round Robin"}</span>
        </div>
        <p className="rr-scroll-hint">Swipe the table for all stats <span aria-hidden="true">↔</span></p>
        {isCricket ? (
          <div className="cricket-table-theme">
          <div className="rr-table-wrapper cricket-table-scroll" role="region" aria-label={`${tournament.title} cricket standings, scroll for all statistics`} tabIndex={0}>
            <table className="rr-table cricket-rr-table">
              <caption className="sr-only">{tournament.title} cricket standings. M: matches, W: won, L: lost, NRR: net run rate, Pts: points, Last 5: recent form.</caption>
              <colgroup>
                <col className="cricket-col-rank" /><col className="cricket-col-team" />
                <col className="cricket-col-stat" /><col className="cricket-col-stat" /><col className="cricket-col-stat" />
                <col className="cricket-col-nrr" /><col className="cricket-col-points" /><col className="cricket-col-form" />
              </colgroup>
              <thead>
                <tr>
                  <th className="th-rank">#</th>
                  <th className="th-team">Team</th>
                  <th className="th-stat" title="Matches Played">M</th>
                  <th className="th-stat" title="Won">W</th>
                  <th className="th-stat" title="Lost">L</th>
                  <th className="th-stat th-nrr" title="Net Run Rate">NRR</th>
                  <th className="th-stat th-pts" title="Total Points">Pts</th>
                  <th className="th-form" title="Last 5 Matches Form">Last 5</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, idx) => {
                  const isTop2 = idx < 2;
                  const badge = getCricketTeamBadge(row.name);
                  const nrrNum = row.nrr ?? 0;
                  const nrrClass = nrrNum > 0 ? "nrr-pos" : nrrNum < 0 ? "nrr-neg" : "nrr-zero";

                  return (
                    <tr
                      key={row.id}
                      className={`${idx === 0 && row.played > 0 ? "rank-leader" : ""} ${isTop2 ? "qualifier-spot" : ""}`}
                    >
                      <td className="td-rank">
                        {idx === 0 && row.played > 0 ? (
                          <Crown size={13} className="crown-icon" aria-label="First place" />
                        ) : (
                          <span className="rank-num">{idx + 1}</span>
                        )}
                      </td>
                      <td className="td-team">
                        <div className="cricket-team-cell">
                          <span className="cricket-team-badge" style={{ background: badge.bg }}>
                            {badge.initials}
                          </span>
                          <span className="cricket-team-name">{row.name}</span>
                          {isTop2 && groupStage && (
                            <span className="qualifier-badge" title="Top 2 qualify for Semi-finals">Q</span>
                          )}
                        </div>
                      </td>
                      <td className="td-stat">{row.played}</td>
                      <td className="td-stat">{row.won}</td>
                      <td className="td-stat">{row.lost}</td>
                      <td className={`td-stat td-nrr ${nrrClass}`}>{formatNRR(row.nrr)}</td>
                      <td className="td-stat td-pts cricket-pts-cell">{row.points}</td>
                      <td className="td-form">
                        <div className="cricket-form-row">
                          {Array.from({ length: 5 }, (_, i) => {
                            const outcome = row.form?.[i];
                            if (outcome === "W") {
                              return (
                                <span key={i} className="form-badge form-win" title="Won">
                                  <Check size={11} strokeWidth={3} />
                                </span>
                              );
                            }
                            if (outcome === "L") {
                              return (
                                <span key={i} className="form-badge form-loss" title="Lost">
                                  <X size={11} strokeWidth={3} />
                                </span>
                              );
                            }
                            if (outcome === "D") {
                              return (
                                <span key={i} className="form-badge form-draw" title="Tie / No Result">
                                  <Minus size={11} strokeWidth={3} />
                                </span>
                              );
                            }
                            return (
                              <span key={i} className="form-badge form-empty" title="Fixture to be played">
                                <span className="form-dot" />
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
            <div className="cricket-table-footer">
              <span><span className="qualifier-dot-guide" /> Top 2 teams advance to Semi-finals</span>
              <span>Win = 2 Pts · Tie/NR = 1 Pt · Loss = 0 Pts</span>
            </div>
          </div>
        ) : (
          <div className="rr-table-wrapper" role="region" aria-label={`${tournament.title} standings, scroll for all statistics`} tabIndex={0}>
            <table className="rr-table">
              <caption className="sr-only">{tournament.title} standings. P: played, W: won, D: drawn, L: lost, GF: goals for, GA: goals against, GD: goal difference, PTS: points.</caption>
              <thead>
                <tr>
                  <th className="th-rank">#</th>
                  <th className="th-team">Team / Player</th>
                  <th className="th-pts" title="Total Points">PTS</th>
                  <th title="Matches Played">P</th>
                  <th title="Won">W</th>
                  <th title="Drawn">D</th>
                  <th title="Lost">L</th>
                  <th title="Goals/Points For">GF</th>
                  <th title="Goals/Points Against">GA</th>
                  <th title="Goal/Score Difference">GD</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, idx) => (
                  <tr key={row.id} className={idx === 0 && row.played > 0 ? "rank-leader" : ""}>
                    <td className="td-rank">
                      {idx === 0 && row.played > 0 ? <Crown size={13} className="crown-icon" aria-label="First place" /> : idx + 1}
                    </td>
                    <td className="td-team">
                      <strong>{row.name}</strong>
                    </td>
                    <td className="td-pts">{row.points}</td>
                    <td>{row.played}</td>
                    <td>{row.won}</td>
                    <td>{row.drawn}</td>
                    <td>{row.lost}</td>
                    <td>{row.gf}</td>
                    <td>{row.ga}</td>
                    <td className={row.gd > 0 ? "pos-gd" : row.gd < 0 ? "neg-gd" : ""}>
                      {row.gd > 0 ? `+${row.gd}` : row.gd}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Fixtures by Round */}
      <section className="rr-fixtures-card">
        <div className="rr-card-head">
          <h3>Fixtures &amp; Results</h3>
          <div className="rr-round-selector" role="group" aria-label="Fixture round">
            {bracket.rounds.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`rr-round-btn ${selectedRound === idx ? "active" : ""}`}
                aria-pressed={selectedRound === idx}
                onClick={() => setActiveRound(idx)}
              >
                Round {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="rr-matches-grid">
          {bracket.rounds[selectedRound]?.map((match) => {
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
                  {onWinner ? <button type="button" className={`rr-team-row ${winnerId === match.a ? "won" : ""}`} disabled={busy || !!winnerId || !match.a || !match.b} aria-label={`Choose ${nameA} as winner`} onClick={() => onWinner(match, match.a)}><span className="rr-team-name">{nameA}</span><span className="rr-team-score">{match.scoreA || "—"}</span></button> : <div className={`rr-team-row ${winnerId === match.a ? "won" : ""}`}>
                    <span className="rr-team-name">{nameA}</span>
                    <span className="rr-team-score">{match.scoreA || "—"}</span>
                  </div>}
                  {onWinner ? <button type="button" className={`rr-team-row ${winnerId === match.b ? "won" : ""}`} disabled={busy || !!winnerId || !match.a || !match.b} aria-label={`Choose ${nameB} as winner`} onClick={() => onWinner(match, match.b)}><span className="rr-team-name">{nameB}</span><span className="rr-team-score">{match.scoreB || "—"}</span></button> : <div className={`rr-team-row ${winnerId === match.b ? "won" : ""}`}>
                    <span className="rr-team-name">{nameB}</span>
                    <span className="rr-team-score">{match.scoreB || "—"}</span>
                  </div>}
                </div>

                <div className="rr-match-footer">
                  <div className="rr-meta-info">
                    {match.date && <span><Calendar size={12} /> {match.date}</span>}
                    {match.time && <span><Clock size={12} /> {formatMatchTime(match.time)}</span>}
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
                      {onWinner && match.winner && <button type="button" className="button ghost small-button" disabled={busy} onClick={() => onWinner(match, null)}>Undo result</button>}
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
