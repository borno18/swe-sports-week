"use client";

import { useActionState, useEffect, useRef, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { saveTournament, type ActionResult } from "@/app/admin/tournament-actions";
import { TournamentBracket } from "@/components/tournament-bracket";
import { RoundRobinView } from "@/components/round-robin-view";
import { GameRulesCard } from "@/components/game-rules-card";
import {
  roundName,
  defaultRoundName,
  validateRoundConfiguration,
  isMatchReady,
  getMatchParticipants,
  type BracketMatch,
  type Tournament,
  type TournamentFormat,
  type RoundConfig,
  type GroupStageConfig,
} from "@/lib/bracket";
import type { Sport, GameRule } from "@/lib/data";
import { Plus, Trash2, UserPlus, Users, X, ChevronDown, ChevronUp, Layers, Swords, Hash } from "lucide-react";

const initial: ActionResult = { ok: false, message: "" };
const FlexibleBracketView = dynamic(() => import("@/components/flexible-bracket-view").then(module => module.FlexibleBracketView));
const GroupStageView = dynamic(() => import("@/components/group-stage-view").then(module => module.GroupStageView));

function LineupNames({ names, onCountChange }: { names: string; onCountChange?: (count: number) => void }) {
  const [value, setValue] = useState(names);
  return (
    <textarea
      id="entry-names"
      name="names"
      rows={8}
      maxLength={6000}
      value={value}
      onChange={event => { setValue(event.target.value); onCountChange?.(event.target.value.split(/\r?\n/).filter(line => line.trim()).length); }}
      aria-describedby="lineup-help"
      placeholder={"Player or team 1\nPlayer or team 2\nPlayer or team 3\nPlayer or team 4"}
      required
    />
  );
}

function Feedback({ state }: { state: ActionResult }) {
  return state.message ? (
    <p className={`admin-feedback ${state.ok ? "success" : "error"}`} role={state.ok ? "status" : "alert"}>
      {state.message}
    </p>
  ) : null;
}

/* ── Tournament Builder: configurable rounds, group stage, etc. ── */
function TournamentBuilder({
  initialRounds,
  initialGroupStage,
  initialGroupStageConfig,
  initialLegs,
  entrantCount,
}: {
  initialRounds?: RoundConfig[];
  initialGroupStage?: boolean;
  initialGroupStageConfig?: GroupStageConfig;
  initialLegs?: number;
  entrantCount: number;
}) {
  const [rounds, setRounds] = useState<RoundConfig[]>(
    initialRounds ?? [
      { name: "Round 1", matchCount: 4, playersPerMatch: 2 },
      { name: "Semi-finals", matchCount: 2, playersPerMatch: 2 },
      { name: "Final", matchCount: 1, playersPerMatch: 2 },
    ]
  );
  const [hasGroupStage, setHasGroupStage] = useState(initialGroupStage ?? false);
  const [groupConfig, setGroupConfig] = useState<GroupStageConfig>(
    initialGroupStageConfig ?? { groupCount: 4, playersPerGroup: 4, advancePerGroup: 2 }
  );
  const [legs, setLegs] = useState(initialLegs ?? 1);

  const updateRound = useCallback((index: number, field: keyof RoundConfig, value: string | number) => {
    setRounds(prev => prev.map((r, i) =>
      i === index ? { ...r, [field]: field === "name" ? value : Number(value) || 1 } : r
    ));
  }, []);

  const addRound = useCallback(() => {
    setRounds(prev => {
      return [{ name: "Opening round", matchCount: Math.min(100, (prev[0]?.matchCount ?? 1) * 2), playersPerMatch: 2 }, ...prev];
    });
  }, []);

  const removeRound = useCallback((index: number) => {
    setRounds(prev => prev.length <= 1 ? prev : prev.filter((_, i) => i !== index));
  }, []);

  const totalMatches = rounds.reduce((sum, r) => sum + r.matchCount, 0);
  const firstRoundPlayers = rounds[0] ? rounds[0].matchCount * rounds[0].playersPerMatch : 0;
  let configurationError = "";
  try { validateRoundConfiguration(rounds, entrantCount || (hasGroupStage ? groupConfig.groupCount * groupConfig.playersPerGroup : rounds[0]?.playerCount ?? firstRoundPlayers), hasGroupStage, groupConfig); }
  catch (error) { configurationError = error instanceof Error ? error.message : "Check your round configuration."; }

  return (
    <div className="tournament-builder">
      {/* Hidden fields to serialize config */}
      <input type="hidden" name="roundConfig" value={JSON.stringify(rounds)} />
      <input type="hidden" name="hasGroupStage" value={String(hasGroupStage)} />
      {hasGroupStage && (
        <input type="hidden" name="groupStageConfig" value={JSON.stringify(groupConfig)} />
      )}
      <input type="hidden" name="legs" value={String(legs)} />
      <input type="hidden" name="format" value="knockout" />
      <input type="hidden" name="playersPerGame" value={String(rounds[0]?.playersPerMatch ?? 2)} />

      {/* ── Group Stage Toggle ── */}
      <div className="tb-section">
        <div className="tb-toggle-row">
          <div className="tb-toggle-label">
            <Layers size={16} />
            <div>
              <strong>Group Stage</strong>
              <span>Add a round-robin pool phase before knockouts</span>
            </div>
          </div>
          <button
            type="button"
            className={`tb-switch ${hasGroupStage ? "on" : ""}`}
            onClick={() => setHasGroupStage(prev => !prev)}
            aria-pressed={hasGroupStage}
            aria-label="Include group stage"
          >
            <span className="tb-switch-thumb" />
          </button>
        </div>

        {hasGroupStage && (
          <div className="tb-group-config">
            <div className="tb-config-grid">
              <label className="tb-field">
                <span className="tb-field-label">Number of Groups</span>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={groupConfig.groupCount}
                  onChange={e => setGroupConfig(prev => ({ ...prev, groupCount: Number(e.target.value) || 1 }))}
                />
              </label>
              <label className="tb-field">
                <span className="tb-field-label">Players per Group</span>
                <input
                  type="number"
                  min={2}
                  max={20}
                  value={groupConfig.playersPerGroup}
                  onChange={e => setGroupConfig(prev => ({ ...prev, playersPerGroup: Number(e.target.value) || 2 }))}
                />
              </label>
              <label className="tb-field">
                <span className="tb-field-label">Advance per Group</span>
                <input
                  type="number"
                  min={1}
                  max={groupConfig.playersPerGroup - 1}
                  value={groupConfig.advancePerGroup}
                  onChange={e => setGroupConfig(prev => ({ ...prev, advancePerGroup: Number(e.target.value) || 1 }))}
                />
              </label>
            </div>
            <p className="tb-hint">
              {groupConfig.groupCount} groups × {groupConfig.playersPerGroup} players = {groupConfig.groupCount * groupConfig.playersPerGroup} total group players.
              Top {groupConfig.advancePerGroup} per group → {groupConfig.groupCount * groupConfig.advancePerGroup} advance to knockouts.
            </p>
          </div>
        )}
      </div>

      {/* ── Rounds Configuration ── */}
      <div className="tb-section">
        <div className="tb-section-header">
          <div className="tb-section-title">
            <Swords size={16} />
            <strong>Knockout Rounds</strong>
          </div>
          <button type="button" className="tb-add-round-btn" onClick={addRound} disabled={rounds.length >= 10}>
            <Plus size={14} /> Add Round
          </button>
        </div>
        <label className="tb-field">Number of knockout rounds
          <input type="number" min={1} max={10} value={rounds.length} onChange={event => {
            const count = Number(event.target.value);
            if (!Number.isInteger(count) || count < 1 || count > 10) return;
            setRounds(Array.from({ length: count }, (_, i) => ({ name: defaultRoundName(i, count), matchCount: Math.min(100, 2 ** (count - i - 1)), playersPerMatch: 2 })));
          }} />
        </label>
        <p className="tb-hint">Changing the round count suggests a standard draw. Customize each round below. One winner advances from every match; unused slots become byes.</p>

        <div className="tb-rounds-list">
          {rounds.map((round, index) => (
            <div key={index} className="tb-round-card">
              <div className="tb-round-card-head">
                <span className="tb-round-number">R{index + 1}</span>
                <input
                  type="text"
                  className="tb-round-name-input"
                  value={round.name}
                  onChange={e => updateRound(index, "name", e.target.value)}
                  placeholder={`Round ${index + 1}`}
                  maxLength={40}
                  required
                  aria-label={`Round ${index + 1} name`}
                />
                {rounds.length > 1 && (
                  <button
                    type="button"
                    className="tb-remove-round"
                    onClick={() => removeRound(index)}
                    title="Remove round"
                    aria-label={`Remove round ${index + 1}`}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="tb-round-card-body">
                <label className="tb-field">
                  <span className="tb-field-label">
                    <Hash size={12} /> Matches
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    aria-label={`Round ${index + 1} matches`}
                    value={round.matchCount}
                    onChange={e => updateRound(index, "matchCount", e.target.value)}
                  />
                </label>
                <label className="tb-field">
                  <span className="tb-field-label">
                    <Users size={12} /> Players per Match
                  </span>
                  <input type="number" min={2} max={48}
                    aria-label={`Round ${index + 1} players per match`}
                    value={round.playersPerMatch}
                    onChange={e => updateRound(index, "playersPerMatch", e.target.value)}
                  />
                </label>
                <label className="tb-field"><span className="tb-field-label">Players / teams in round</span><input type="number" min={2} max={200} aria-label={`Round ${index + 1} total players`} value={round.playerCount ?? (index ? rounds[index - 1].matchCount : hasGroupStage ? groupConfig.groupCount * groupConfig.advancePerGroup : entrantCount || firstRoundPlayers)} onChange={e => updateRound(index, "playerCount", e.target.value)} /></label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Match Format ── */}
      <div className="tb-section">
        <label className="tb-field">
          <span className="tb-field-label">Matches per Tie</span>
          <select value={legs} onChange={e => setLegs(Number(e.target.value))}>
            <option value={1}>1 Match per tie</option>
            <option value={2}>2 Legs (Home &amp; Away / Aggregate)</option>
          </select>
        </label>
      </div>

      {/* ── Summary Bar ── */}
      {configurationError && <p className="admin-feedback error" role="alert">{configurationError}</p>}
      <div className="tb-summary">
        <div className="tb-summary-item">
          <span className="tb-summary-value">{rounds.length}</span>
          <span className="tb-summary-label">{rounds.length === 1 ? "Round" : "Rounds"}</span>
        </div>
        <div className="tb-summary-item">
          <span className="tb-summary-value">{totalMatches}</span>
          <span className="tb-summary-label">Total Matches</span>
        </div>
        <div className="tb-summary-item">
          <span className="tb-summary-value">{firstRoundPlayers}</span>
          <span className="tb-summary-label">R1 Players Needed</span>
        </div>
        {hasGroupStage && (
          <div className="tb-summary-item">
            <span className="tb-summary-value">{groupConfig.groupCount * groupConfig.advancePerGroup}</span>
            <span className="tb-summary-label">From Groups</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function NewSectionForm({ sports }: { sports: Sport[] }) {
  const [state, action, pending] = useActionState(saveTournament, initial);
  const router = useRouter();

  useEffect(() => {
    if (state.ok && state.id) router.push(`/admin?section=${state.id}`);
  }, [state, router]);

  return (
    <details className="new-section">
      <summary>Add another section</summary>
      <p>Create a separate draw for singles, doubles, batches, leagues, or another division.</p>
      <form action={action} className="organizer-form">
        <input type="hidden" name="kind" value="create" />
        <label>
          Sport / Segment
          <select name="sport">
            {sports.map(sport => (
              <option key={sport.slug} value={sport.slug}>
                {sport.icon} {sport.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Section name
          <input name="title" placeholder="e.g. Badminton — Women's Doubles" required maxLength={80} />
        </label>
        <label>
          Entry type
          <select name="entryKind">
            <option value="player">Players</option>
            <option value="team">Teams / doubles pairs</option>
          </select>
        </label>
        <button className="button organizer-primary" disabled={pending}>
          {pending ? "Creating…" : "Create section"}
        </button>
        <Feedback state={state} />
      </form>
    </details>
  );
}

export function TournamentEditor({
  tournament,
  canEditLineup,
  rule,
}: {
  tournament: Tournament;
  canEditLineup: boolean;
  rule?: GameRule | null;
}) {
  const [state, action, pending] = useActionState(saveTournament, initial);
  const [result, setResult] = useState<ActionResult>(initial);
  const [saving, startTransition] = useTransition();
  const [details, setDetails] = useState<BracketMatch | null>(null);
  const [undo, setUndo] = useState<BracketMatch | null>(null);
  const [entrantCount, setEntrantCount] = useState(tournament.bracket.entries.length);

  const [showAddMatch, setShowAddMatch] = useState<boolean>(false);
  const [addMatchRound, setAddMatchRound] = useState<number>(1);
  const [selectedEntryToAdd, setSelectedEntryToAdd] = useState<string>("");

  const dialogRef = useRef<HTMLDialogElement>(null);
  const addMatchDialogRef = useRef<HTMLDialogElement>(null);
  const published = tournament.bracket.rounds.length > 0;
  const busy = pending || saving;
  const canChangeMatches = canEditLineup && !tournament.bracket.roundConfig?.length;
  const router = useRouter();

  useEffect(() => {
    if (details || undo) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [details, undo]);

  useEffect(() => {
    if (showAddMatch) addMatchDialogRef.current?.showModal();
    else addMatchDialogRef.current?.close();
  }, [showAddMatch]);

  useEffect(() => {
    setResult(initial);
    if (state.ok) {
      setDetails(null);
      setUndo(null);
      setShowAddMatch(false);
      setSelectedEntryToAdd("");
      if (state.message?.includes("permanently deleted")) {
        router.push("/admin");
      }
    }
  }, [state, router]);

  function fields(kind: string) {
    const form = new FormData();
    form.set("id", tournament.id);
    form.set("version", String(tournament.version));
    form.set("kind", kind);
    return form;
  }

  function record(match: BracketMatch, entry: string | null) {
    if (!entry) {
      setUndo(match);
      return;
    }
    const form = fields("winner");
    form.set("matchId", match.id);
    form.set("entryId", entry);
    startTransition(async () => {
      try {
        setResult(await saveTournament(initial, form));
      } catch {
        setResult({
          ok: false,
          message: "Connection interrupted. Refresh to check whether the result was saved before retrying.",
        });
      }
    });
  }

  const hidden = (
    <>
      <input type="hidden" name="id" value={tournament.id} />
      <input type="hidden" name="version" value={tournament.version} />
    </>
  );

  const is2LegMatch = (details?.legs ?? tournament.bracket.legs) === 2;

  return (
    <div className="tournament-editor">
      <div className="editor-heading">
        <div>
          <span className="eyebrow">
            {tournament.entryKind === "team" ? "Team" : "Player"} ·{" "}
            {tournament.bracket.hasGroupStage ? "Groups + Knockout" : tournament.bracket.format === "round_robin" ? "Round robin league" : tournament.bracket.format === "flexible" ? "Flexible Knockout" : "Knockout"}
            {tournament.bracket.legs === 2 ? " (2 Legs)" : ""}
          </span>
          <h2>{tournament.title}</h2>
        </div>
        <a
          className="filter"
          href={`/sports/${tournament.sportSlug}#section-${tournament.id}`}
          target="_blank"
          rel="noreferrer"
        >
          View public page ↗
        </a>
      </div>

      <Feedback state={result.message ? result : state} />
      {((!result.ok && result.message) || (!state.ok && state.message)) && (
        <button type="button" className="filter" onClick={() => router.refresh()}>
          Refresh saved data
        </button>
      )}

      {/* Official Rules & Match Format Editor */}
      <GameRulesCard
        sportSlug={tournament.sportSlug}
        initialRule={rule}
        editable={canEditLineup}
      />

      {canEditLineup && (
        <details className="lineup-panel" open={!published} key={`lineup-${published}`}>
          <summary>{published ? "Edit player / team names" : "1. Configure Tournament & Lineup"}</summary>
          <form action={action} onSubmit={() => setResult(initial)} className="organizer-form">
            {hidden}
            <input type="hidden" name="kind" value={published ? "rename" : "lineup"} />

            {!published && (
              <TournamentBuilder
                initialRounds={tournament.bracket.roundConfig}
                initialGroupStage={tournament.bracket.hasGroupStage}
                initialGroupStageConfig={tournament.bracket.groupStageConfig}
                initialLegs={tournament.bracket.legs}
                entrantCount={entrantCount}
              />
            )}

            <label htmlFor="entry-names">One player or team per line</label>
            <p id="lineup-help">
              {published
                ? "Keep the same order and number of entries. Name corrections update every match without resetting scores."
                : "Enter every player or team once, in draw order. Group entries are assigned in order (Group A first). Round capacity is checked before publishing; single-player matches advance as byes."}
            </p>
            <LineupNames
              key={tournament.version}
              names={tournament.bracket.entries.map(entry => entry.name).join("\n")}
              onCountChange={setEntrantCount}
            />
            <button className="button organizer-primary" disabled={busy}>
              {pending ? "Saving…" : published ? "Save name changes" : "Publish Tournament"}
            </button>
          </form>
        </details>
      )}

      {published && (
        <>
          {canChangeMatches && (
            <div className="bracket-admin-toolbar">
              <div className="bracket-admin-info">
                <span className="badge">
                  <Users size={14} /> {tournament.bracket.playersPerGame || 2} players/teams per game
                </span>
                {Boolean(tournament.bracket.totalGames) && (
                  <span className="badge">
                    🎯 {tournament.bracket.totalGames} total games configured
                  </span>
                )}
              </div>
              <button
                type="button"
                className="button button-sm add-game-btn"
                onClick={() => setShowAddMatch(true)}
              >
                <Plus size={14} /> Add Game / Match
              </button>
            </div>
          )}

          <p className="editor-instruction">
            {tournament.bracket.format === "round_robin" ? (
              <>
                <b>Round Robin League:</b> Click <i>Score / Details</i> to record fixture dates, venues, and scores. Standings and goal difference update automatically.
              </>
            ) : tournament.bracket.format === "flexible" ? (
              <>
                <b>Flexible Knockout:</b> Select the players who advance, then click <i>Save Advancers</i> to publish the result. Use <i>Details</i> for dates, venues, and scores.
              </>
            ) : (
              <>
                <b>Choose a winner:</b> click their name in a ready match. They appear in the next round immediately. Use <i>Details</i> for dates, venues, and optional scores.
              </>
            )}
          </p>

          {tournament.bracket.hasGroupStage && <GroupStageView tournament={tournament} onWinner={record} onDetails={setDetails} busy={busy} onQualifiers={(groupId, entryIds) => {
            const form = fields("qualifiers"); form.set("groupId", groupId); entryIds.forEach(id => form.append("qualifierId", id));
            startTransition(async () => {
              try { setResult(await saveTournament(initial, form)); }
              catch { setResult({ ok: false, message: "Connection interrupted. Refresh to check the saved qualifiers." }); }
            });
          }} />}
          {tournament.bracket.format === "round_robin" ? (
            <RoundRobinView
              tournament={tournament}
              onWinner={record}
              onDetails={setDetails}
              busy={busy}
            />
          ) : tournament.bracket.format === "flexible" ? (
            <FlexibleBracketView
              tournament={tournament}
              editable={true}
            />
          ) : (
            <TournamentBracket
              tournament={tournament}
              onWinner={record}
              onDetails={setDetails}
              busy={busy}
            />
          )}
        </>
      )}

      {!published && !canEditLineup && <p>The organizer has not published this lineup yet.</p>}

      {/* Danger Zone: Reset and Delete */}
      {canEditLineup && (
        <div className="section-danger-zone">
          {published && (
            <details className="reset-panel">
              <summary>Reset this section</summary>
              <p>This removes all names and results from this section and the public website. Other sections are unaffected.</p>
              <form action={action} className="organizer-form">
                {hidden}
                <input type="hidden" name="kind" value="reset" />
                <label>
                  Type RESET to confirm
                  <input name="confirmation" required pattern="RESET" autoComplete="off" />
                </label>
                <button className="button danger-button" disabled={busy}>
                  Reset bracket
                </button>
              </form>
            </details>
          )}

          <details className="reset-panel delete-section-panel">
            <summary>Delete this section completely</summary>
            <p>
              Permanently removes <strong>{tournament.title}</strong>, its bracket, and all history from the database.
            </p>
            <form action={action} className="organizer-form">
              {hidden}
              <input type="hidden" name="kind" value="delete" />
              <label>
                Type DELETE to confirm
                <input name="confirmation" required pattern="DELETE" autoComplete="off" />
              </label>
              <button className="button danger-button" disabled={busy}>
                Permanently Delete Section
              </button>
            </form>
          </details>
        </div>
      )}

      {/* Details & Undo Dialog */}
      <dialog
        className="editor-dialog"
        ref={dialogRef}
        onCancel={() => {
          setDetails(null);
          setUndo(null);
        }}
        onClose={() => {
          setDetails(null);
          setUndo(null);
        }}
      >
        <div className="dialog-heading">
          <h3>{undo ? "Undo this result?" : "Match details"}</h3>
          <button
            type="button"
            className="filter"
            disabled={busy}
            onClick={() => {
              setDetails(null);
              setUndo(null);
            }}
          >
            Close
          </button>
        </div>
        {!state.ok && <Feedback state={state} />}

        {undo ? (
          <form action={action} className="organizer-form">
            {hidden}
            <input type="hidden" name="kind" value="winner" />
            <input type="hidden" name="matchId" value={undo.id} />
            <input type="hidden" name="entryId" value="" />
            <p>
              The winner will be removed from the next round. Any later results depending on this match will also be cleared.
            </p>
            <button className="button danger-button" disabled={busy}>
              {pending ? "Undoing…" : "Undo result"}
            </button>
          </form>
        ) : (
          details && (
            (() => {
              const participants = getMatchParticipants(details);
              return (
                <form action={action} className="organizer-form">
                  {hidden}
                  <input type="hidden" name="kind" value="details" />
                  <input type="hidden" name="matchId" value={details.id} />

                  <div className="match-participants-section">
                    <span className="leg-kicker">Participants &amp; Scores ({participants.length} Players/Teams)</span>
                    <div className="participants-score-list">
                      {participants.map((pId, idx) => {
                        const entry = tournament.bracket.entries.find(e => e.id === pId);
                        const name = entry?.name || (pId ? "Unknown" : "TBD");
                        const currentScore = details.scores?.[pId] ?? (idx === 0 ? details.scoreA : idx === 1 ? details.scoreB : "");
                        return (
                          <div key={pId || idx} className="participant-score-row">
                            <div className="participant-badge-name">
                              <span className="participant-idx">#{idx + 1}</span>
                              <span className="participant-name">{name}</span>
                            </div>
                            <div className="participant-score-input-wrap">
                              <input
                                name={`score_${pId}`}
                                type="number"
                                min={0}
                                max={999}
                                aria-label={`${name} score`}
                                disabled={!isMatchReady(details)}
                                step={1}
                                placeholder="Score"
                                defaultValue={currentScore}
                                className="participant-score-input"
                              />
                              {canChangeMatches && pId && (
                                <button
                                  type="button"
                                  className="remove-participant-btn"
                                  title="Remove from game"
                                  onClick={() => {
                                    const form = fields("remove_participant");
                                    form.set("matchId", details.id);
                                    form.set("entryId", pId);
                                    startTransition(async () => {
                                      const res = await saveTournament(initial, form);
                                      setResult(res);
                                      if (res.ok) setDetails(null);
                                    });
                                  }}
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {canChangeMatches && (
                      <div className="add-participant-to-match">
                        <select
                          value={selectedEntryToAdd}
                          onChange={e => setSelectedEntryToAdd(e.target.value)}
                          className="add-participant-select"
                        >
                          <option value="">-- Add player/team to this game --</option>
                          {tournament.bracket.entries
                            .filter(e => !participants.includes(e.id))
                            .map(e => (
                              <option key={e.id} value={e.id}>
                                {e.name}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          className="button button-sm"
                          disabled={!selectedEntryToAdd || busy}
                          onClick={() => {
                            if (!selectedEntryToAdd) return;
                            const form = fields("add_participant");
                            form.set("matchId", details.id);
                            form.set("entryId", selectedEntryToAdd);
                            startTransition(async () => {
                              const res = await saveTournament(initial, form);
                              setResult(res);
                              setSelectedEntryToAdd("");
                              if (res.ok) setDetails(null);
                            });
                          }}
                        >
                          <UserPlus size={14} /> Add
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Leg 1 Timing & Venue */}
                  <div className="match-leg-section">
                    {is2LegMatch && <span className="leg-kicker">Leg 1 Timing &amp; Venue</span>}
                    <div className="form-row-2">
                      <label>
                        Date
                        <input type="date" name="date" defaultValue={details.date} />
                      </label>
                      <label>
                        Time (Bangladesh)
                        <input type="time" name="time" defaultValue={details.time} />
                      </label>
                    </div>
                    <label>
                      Venue
                      <input name="venue" defaultValue={details.venue} maxLength={100} />
                    </label>
                  </div>

                  {/* Leg 2 if configured */}
                  {is2LegMatch && (
                    <div className="match-leg-section leg-2">
                      <span className="leg-kicker">Leg 2 Details (Return Leg)</span>
                      <div className="form-row-2">
                        <label>
                          Leg 2 Date
                          <input type="date" name="date2" defaultValue={details.date2} />
                        </label>
                        <label>
                          Leg 2 Time
                          <input type="time" name="time2" defaultValue={details.time2} />
                        </label>
                      </div>
                      <label>
                        Leg 2 Venue
                        <input name="venue2" defaultValue={details.venue2} maxLength={100} />
                      </label>
                      <div className="form-row-2">
                        {(["a", "b"] as const).map(side => (
                          <label key={side}>
                            {tournament.bracket.entries.find(entry => entry.id === details[side])?.name ?? "Opponent"} (Leg 2 score)
                            <input
                              name={side === "a" ? "scoreA2" : "scoreB2"}
                              type="number"
                              min={0}
                              max={999}
                              step={1}
                              disabled={!details.a || !details.b}
                              defaultValue={side === "a" ? details.scoreA2 : details.scoreB2}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="match-dialog-footer">
                    <button className="button organizer-primary" disabled={busy}>
                      {pending ? "Saving…" : "Save details"}
                    </button>
                    {canChangeMatches && (
                      <button
                        type="button"
                        className="button danger-button button-sm"
                        disabled={busy}
                        onClick={() => {
                          if (!confirm("Are you sure you want to delete this game?")) return;
                          const form = fields("delete_match");
                          form.set("matchId", details.id);
                          startTransition(async () => {
                            const res = await saveTournament(initial, form);
                            setResult(res);
                            if (res.ok) setDetails(null);
                          });
                        }}
                      >
                        <Trash2 size={14} /> Delete Game
                      </button>
                    )}
                  </div>
                </form>
              );
            })()
          )
        )}
      </dialog>

      {/* Add New Game / Match Dialog */}
      <dialog
        className="editor-dialog add-match-dialog"
        ref={addMatchDialogRef}
        onCancel={() => setShowAddMatch(false)}
        onClose={() => setShowAddMatch(false)}
      >
        <div className="dialog-heading">
          <h3>Add New Game / Match</h3>
          <button
            type="button"
            className="filter"
            disabled={busy}
            onClick={() => setShowAddMatch(false)}
          >
            Close
          </button>
        </div>
        <form action={action} className="organizer-form" onSubmit={() => setShowAddMatch(false)}>
          {hidden}
          <input type="hidden" name="kind" value="add_match" />
          <label>
            Round
            <select
              name="round"
              value={addMatchRound}
              onChange={e => setAddMatchRound(Number(e.target.value))}
            >
              {tournament.bracket.rounds.map((_, roundIdx) => (
                <option key={roundIdx + 1} value={roundIdx + 1}>
                  Round {roundIdx + 1} ({roundName(roundIdx, tournament.bracket.rounds.length, tournament.bracket.format || "knockout", tournament.bracket.roundConfig)})
                </option>
              ))}
              <option value={tournament.bracket.rounds.length + 1}>
                New Round {tournament.bracket.rounds.length + 1}
              </option>
            </select>
          </label>
          <div className="add-match-participants-picker">
            <label>Select Players / Teams for this Game (optional, can be TBD)</label>
            <div className="participants-checkbox-list">
              {tournament.bracket.entries.map(entry => (
                <label key={entry.id} className="checkbox-item">
                  <input type="checkbox" name="participantIds" value={entry.id} />
                  <span>{entry.name}</span>
                </label>
              ))}
            </div>
          </div>
          <button className="button organizer-primary" disabled={busy}>
            <Plus size={14} /> Create Game
          </button>
        </form>
      </dialog>
    </div>
  );
}
