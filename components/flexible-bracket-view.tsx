"use client";

import { useState, useTransition } from "react";
import { Crown, Plus, Trash2, ChevronDown, ChevronUp, Users } from "lucide-react";
import { saveTournament, type ActionResult } from "@/app/admin/tournament-actions";
import {
  championOf,
  flexAvailablePool,
  roundName,
  type BracketMatch,
  type Tournament,
} from "@/lib/bracket";
import { sports as catalog, formatMatchTime } from "@/lib/data";

const initial: ActionResult = { ok: false, message: "" };

export function FlexibleBracketView({
  tournament,
  editable = false,
}: {
  tournament: Tournament;
  editable?: boolean;
}) {
  const { bracket } = tournament;
  const entries = new Map(bracket.entries.map((e) => [e.id, e.name]));
  const champion = championOf(bracket);
  const sportObj = catalog.find((s) => s.slug === tournament.sportSlug);
  const sportColor = sportObj?.color || "#72d2ff";

  const [result, setResult] = useState<ActionResult>(initial);
  const [saving, startTransition] = useTransition();
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(
    new Set(bracket.rounds.map((_, i) => i))
  );
  // State for the "Add Match" flow
  const [addingMatchRound, setAddingMatchRound] = useState<number | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    new Set()
  );

  function toggleRound(i: number) {
    setExpandedRounds((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function submit(kind: string, extra: Record<string, string>) {
    const form = new FormData();
    form.set("id", tournament.id);
    form.set("version", String(tournament.version));
    form.set("kind", kind);
    for (const [k, v] of Object.entries(extra)) form.set(k, v);
    startTransition(async () => {
      try {
        const res = await saveTournament(initial, form);
        setResult(res);
        if (res.ok) {
          setAddingMatchRound(null);
          setSelectedParticipants(new Set());
        }
      } catch {
        setResult({
          ok: false,
          message: "Connection interrupted. Refresh and try again.",
        });
      }
    });
  }

  // Available pool for each round
  function poolForRound(roundIndex: number): string[] {
    return flexAvailablePool(bracket, roundIndex);
  }

  function assignedInRound(roundIndex: number): Set<string> {
    const round = bracket.rounds[roundIndex] ?? [];
    const s = new Set<string>();
    for (const m of round) for (const p of m.participants ?? []) s.add(p);
    return s;
  }

  function unassignedInRound(roundIndex: number): string[] {
    const pool = poolForRound(roundIndex);
    const assigned = assignedInRound(roundIndex);
    return pool.filter((id) => !assigned.has(id));
  }

  if (!bracket.rounds.length) {
    return (
      <div
        className="flex-empty"
        style={{ "--sport-color": sportColor } as React.CSSProperties}
      >
        <Users strokeWidth={1.5} />
        <p>Tournament not set up yet</p>
        <span>
          The bracket will appear here once the organizer adds the lineup.
        </span>
      </div>
    );
  }

  const isComplete = !!champion;

  return (
    <section
      className="flex-bracket"
      style={{ "--sport-color": sportColor } as React.CSSProperties}
    >
      {/* Champion Banner */}
      {champion && (
        <div className="flex-champion">
          <Crown strokeWidth={1.5} />
          <div>
            <span>Champion</span>
            <strong>{champion.winner.name}</strong>
          </div>
          <small>Runner-up · {champion.runnerUp.name}</small>
        </div>
      )}

      {/* Feedback */}
      {result.message && (
        <p
          className={`admin-feedback ${result.ok ? "success" : "error"}`}
          role={result.ok ? "status" : "alert"}
        >
          {result.message}
        </p>
      )}

      {/* Rounds */}
      {bracket.rounds.map((round, roundIndex) => {
        const pool = poolForRound(roundIndex);
        const unassigned = unassignedInRound(roundIndex);
        const allMatchesComplete =
          round.length > 0 &&
          round.every(
            (m) => m.completedAt && (m.advancers ?? []).length > 0
          );
        const totalAdvancers = round.flatMap(
          (m) => m.advancers ?? []
        ).length;
        const isLastRound = roundIndex === bracket.rounds.length - 1;
        const expanded = expandedRounds.has(roundIndex);
        const isAddingHere = addingMatchRound === roundIndex;

        return (
          <div className="flex-round" key={roundIndex}>
            {/* Round Header */}
            <button
              type="button"
              className="flex-round-header"
              onClick={() => toggleRound(roundIndex)}
              aria-expanded={expanded}
            >
              <div className="flex-round-info">
                <h3>
                  {roundName(
                    roundIndex,
                    bracket.rounds.length,
                    "flexible",
                    bracket.roundConfig
                  )}
                </h3>
                <span className="flex-round-meta">
                  {pool.length} players · {round.length}{" "}
                  {round.length === 1 ? "match" : "matches"}
                  {allMatchesComplete && totalAdvancers > 0 && (
                    <span className="flex-adv-badge">
                      {" "}
                      → {totalAdvancers} advancing
                    </span>
                  )}
                </span>
              </div>
              {expanded ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </button>

            {/* Round Body */}
            {expanded && (
              <div className="flex-round-body">
                {/* Matches */}
                {round.map((match) => (
                  <FlexMatchCard
                    key={match.id}
                    match={match}
                    entries={entries}
                    editable={editable && !isComplete}
                    saving={saving}
                    onSetAdvancers={(advancerIds) =>
                      submit("flex_set_advancers", {
                        matchId: match.id,
                        advancerIds: advancerIds.join(","),
                      })
                    }
                    onRemove={() =>
                      submit("flex_remove_match", {
                        matchId: match.id,
                      })
                    }
                    onDetails={(date, time, venue) =>
                      submit("details", {
                        matchId: match.id,
                        date,
                        time,
                        venue,
                        scoreA: "",
                        scoreB: "",
                      })
                    }
                  />
                ))}

                {/* No matches placeholder */}
                {round.length === 0 && !isAddingHere && (
                  <p className="flex-no-matches">
                    No matches yet.{" "}
                    {editable && "Click below to add one."}
                  </p>
                )}

                {/* Add Match UI */}
                {editable && !isComplete && (
                  <>
                    {isAddingHere ? (
                      <div className="flex-add-panel">
                        <h4>
                          Select participants ({selectedParticipants.size}{" "}
                          selected)
                        </h4>
                        <p className="flex-add-help">
                          Pick 2–48 players for this match. Only
                          unassigned players are shown.
                        </p>
                        <div className="flex-player-picker">
                          {unassigned.map((id) => {
                            const checked = selectedParticipants.has(id);
                            return (
                              <label
                                key={id}
                                className={`flex-pick-chip${checked ? " picked" : ""}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    setSelectedParticipants((prev) => {
                                      const next = new Set(prev);
                                      next.has(id)
                                        ? next.delete(id)
                                        : next.add(id);
                                      return next;
                                    });
                                  }}
                                />
                                {entries.get(id) ?? id}
                              </label>
                            );
                          })}
                        </div>
                        {unassigned.length === 0 && (
                          <p className="flex-add-help">
                            All players are assigned to matches.
                          </p>
                        )}
                        <div className="flex-add-actions">
                          <button
                            type="button"
                            className="button organizer-primary"
                            disabled={
                              saving || selectedParticipants.size < 2
                            }
                            onClick={() => {
                              submit("flex_add_match", {
                                round: String(roundIndex),
                                participantIds: Array.from(
                                  selectedParticipants
                                ).join(","),
                              });
                            }}
                          >
                            {saving
                              ? "Adding…"
                              : `Add Match (${selectedParticipants.size} players)`}
                          </button>
                          <button
                            type="button"
                            className="button"
                            disabled={saving}
                            onClick={() => {
                              // Select all unassigned
                              setSelectedParticipants(
                                new Set(unassigned)
                              );
                            }}
                          >
                            Select All ({unassigned.length})
                          </button>
                          <button
                            type="button"
                            className="filter"
                            disabled={saving}
                            onClick={() => {
                              setAddingMatchRound(null);
                              setSelectedParticipants(new Set());
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      unassigned.length >= 2 && (
                        <button
                          type="button"
                          className="flex-add-btn"
                          disabled={saving}
                          onClick={() => {
                            setAddingMatchRound(roundIndex);
                            setSelectedParticipants(new Set());
                          }}
                        >
                          <Plus size={16} /> Add Match to{" "}
                          {roundName(
                            roundIndex,
                            bracket.rounds.length,
                            "flexible",
                            bracket.roundConfig
                          )}
                        </button>
                      )
                    )}
                  </>
                )}

                {/* Next Round Button */}
                {editable &&
                  !isComplete &&
                  isLastRound &&
                  allMatchesComplete &&
                  totalAdvancers > 1 && (
                    <button
                      type="button"
                      className="flex-next-round-btn"
                      disabled={saving}
                      onClick={() => submit("flex_add_round", {})}
                    >
                      {saving
                        ? "Creating…"
                        : `Start Next Round (${totalAdvancers} players advancing)`}
                    </button>
                  )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

// ── Individual Match Card ──

function FlexMatchCard({
  match,
  entries,
  editable,
  saving,
  onSetAdvancers,
  onRemove,
  onDetails,
}: {
  match: BracketMatch;
  entries: Map<string, string>;
  editable: boolean;
  saving: boolean;
  onSetAdvancers: (ids: string[]) => void;
  onRemove: () => void;
  onDetails: (date: string, time: string, venue: string) => void;
}) {
  const participants = match.participants ?? [];
  const advancers = new Set(match.advancers ?? []);
  const isComplete = match.completedAt !== null && advancers.size > 0;
  const [localAdvancers, setLocalAdvancers] = useState<Set<string>>(advancers);
  const [showDetails, setShowDetails] = useState(false);
  const [date, setDate] = useState(match.date);
  const [time, setTime] = useState(match.time);
  const [venue, setVenue] = useState(match.venue);

  // Sync with server state
  const advancersChanged =
    localAdvancers.size !== advancers.size ||
    [...localAdvancers].some((id) => !advancers.has(id));

  return (
    <div className={`flex-match${isComplete ? " completed" : ""}`}>
      <div className="flex-match-header">
        <span className="flex-match-title">
          Match {match.position + 1}
          <span className="flex-match-count">
            · {participants.length} players
          </span>
        </span>
        <div className="flex-match-badges">
          {match.date && (
            <span className="flex-match-date">
              {new Date(`${match.date}T12:00:00Z`).toLocaleDateString(
                "en-GB",
                { day: "numeric", month: "short", timeZone: "UTC" }
              )}
              {match.time ? ` · ${formatMatchTime(match.time)}` : ""}
            </span>
          )}
          {match.venue && (
            <span className="flex-match-venue">{match.venue}</span>
          )}
          <span
            className={`flex-match-status${isComplete ? " done" : ""}`}
          >
            {isComplete
              ? `✓ ${advancers.size} advanced`
              : "Pending"}
          </span>
        </div>
      </div>

      {/* Player Grid */}
      <div className="flex-player-grid">
        {participants.map((id) => {
          const name = entries.get(id) ?? id;
          const isAdv = editable ? localAdvancers.has(id) : advancers.has(id);
          const isEliminated = isComplete && !advancers.has(id);

          return editable ? (
            <button
              key={id}
              type="button"
              className={`flex-player${isAdv ? " advanced" : ""}${isEliminated ? " eliminated" : ""}`}
              disabled={saving}
              onClick={() => {
                setLocalAdvancers((prev) => {
                  const next = new Set(prev);
                  next.has(id) ? next.delete(id) : next.add(id);
                  return next;
                });
              }}
              title={
                isAdv
                  ? `${name} — will advance (click to remove)`
                  : `${name} — click to mark as advancing`
              }
            >
              <span className="flex-player-name">{name}</span>
              {isAdv && <span className="flex-player-badge">✓</span>}
              {isEliminated && (
                <span className="flex-player-badge elim">✗</span>
              )}
            </button>
          ) : (
            <div
              key={id}
              className={`flex-player${isAdv ? " advanced" : ""}${isEliminated ? " eliminated" : ""}`}
            >
              <span className="flex-player-name">{name}</span>
              {isAdv && <span className="flex-player-badge">✓</span>}
              {isEliminated && (
                <span className="flex-player-badge elim">✗</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {editable && (
        <div className="flex-match-footer">
          {advancersChanged && localAdvancers.size > 0 && (
            <button
              type="button"
              className="button organizer-primary"
              disabled={saving}
              onClick={() => onSetAdvancers(Array.from(localAdvancers))}
            >
              {saving
                ? "Saving…"
                : `Save Advancers (${localAdvancers.size})`}
            </button>
          )}
          {isComplete && !advancersChanged && (
            <button
              type="button"
              className="filter"
              disabled={saving}
              onClick={() => {
                setLocalAdvancers(new Set());
                onSetAdvancers([]);
              }}
            >
              Reset Result
            </button>
          )}
          <button
            type="button"
            className="filter"
            disabled={saving}
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "Hide Details" : "Details"}
          </button>
          <button
            type="button"
            className="filter flex-danger"
            disabled={saving}
            onClick={onRemove}
          >
            <Trash2 size={14} /> Remove
          </button>
        </div>
      )}

      {/* Details Panel */}
      {showDetails && editable && (
        <div className="flex-details-panel">
          <div className="form-row-2">
            <label>
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label>
              Time
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </label>
          </div>
          <label>
            Venue
            <input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              maxLength={100}
            />
          </label>
          <button
            type="button"
            className="button organizer-primary"
            disabled={saving}
            onClick={() => onDetails(date, time, venue)}
          >
            {saving ? "Saving…" : "Save Details"}
          </button>
        </div>
      )}
    </div>
  );
}
