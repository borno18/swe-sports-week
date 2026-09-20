"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveTournament, type ActionResult } from "@/app/admin/tournament-actions";
import { TournamentBracket } from "@/components/tournament-bracket";
import { RoundRobinView } from "@/components/round-robin-view";
import type { BracketMatch, Tournament, TournamentFormat } from "@/lib/bracket";
import type { Sport } from "@/lib/data";

const initial: ActionResult = { ok: false, message: "" };

function LineupNames({ names }: { names: string }) {
  const [value, setValue] = useState(names);
  return (
    <textarea
      id="entry-names"
      name="names"
      rows={8}
      maxLength={6000}
      value={value}
      onChange={event => setValue(event.target.value)}
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

export function NewSectionForm({ sports }: { sports: Sport[] }) {
  const [state, action, pending] = useActionState(saveTournament, initial);
  const [format, setFormat] = useState<TournamentFormat>("knockout");
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
        <label>
          Tournament Format
          <select
            name="format"
            value={format}
            onChange={e => setFormat(e.target.value as TournamentFormat)}
          >
            <option value="knockout">Single Elimination Knockout</option>
            <option value="round_robin">Round Robin / Group Stage (Everyone plays everyone)</option>
            <option value="flexible">Flexible Knockout (2–50 players, dynamic rounds)</option>
          </select>
        </label>
        <label>
          Matches per Tie
          <select name="legs">
            <option value="1">1 Match per round</option>
            <option value="2">2 Legs (Home &amp; Away / Aggregate)</option>
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
}: {
  tournament: Tournament;
  canEditLineup: boolean;
}) {
  const [state, action, pending] = useActionState(saveTournament, initial);
  const [result, setResult] = useState<ActionResult>(initial);
  const [saving, startTransition] = useTransition();
  const [details, setDetails] = useState<BracketMatch | null>(null);
  const [undo, setUndo] = useState<BracketMatch | null>(null);
  const [lineupFormat, setLineupFormat] = useState<TournamentFormat>(tournament.bracket.format || "knockout");
  const [lineupLegs, setLineupLegs] = useState<number>(tournament.bracket.legs || 1);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const published = tournament.bracket.rounds.length > 0;
  const busy = pending || saving;
  const router = useRouter();

  useEffect(() => {
    if (details || undo) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [details, undo]);

  useEffect(() => {
    setResult(initial);
    if (state.ok) {
      setDetails(null);
      setUndo(null);
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

  const is2LegMatch = details?.legs === 2 || tournament.bracket.legs === 2;

  return (
    <div className="tournament-editor">
      <div className="editor-heading">
        <div>
          <span className="eyebrow">
            {tournament.entryKind === "team" ? "Team" : "Player"} ·{" "}
            {tournament.bracket.format === "round_robin" ? "Group Stage" : tournament.bracket.format === "flexible" ? "Flexible Knockout" : "Knockout"}
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

      {canEditLineup && (
        <details className="lineup-panel" open={!published} key={`lineup-${published}`}>
          <summary>{published ? "Edit player / team names" : "1. Setup Format & Lineup"}</summary>
          <form action={action} onSubmit={() => setResult(initial)} className="organizer-form">
            {hidden}
            <input type="hidden" name="kind" value={published ? "rename" : "lineup"} />

            {!published && (
              <div className="format-selection-box">
                <label>
                  Tournament Format
                  <select
                    name="format"
                    value={lineupFormat}
                    onChange={e => setLineupFormat(e.target.value as TournamentFormat)}
                  >
                    <option value="knockout">Single Elimination Knockout (Odd teams get byes)</option>
                    <option value="round_robin">Round Robin / Group Stage (Every team plays each other)</option>
                    <option value="flexible">Flexible Knockout (2–50 players, dynamic rounds)</option>
                  </select>
                </label>
                <label>
                  Match Format / Legs
                  <select
                    name="legs"
                    value={lineupLegs}
                    onChange={e => setLineupLegs(Number(e.target.value))}
                  >
                    <option value={1}>1 Match per tie</option>
                    <option value={2}>2 Legs (Home &amp; Away / Aggregate)</option>
                  </select>
                </label>
              </div>
            )}

            <label htmlFor="entry-names">One player or team per line</label>
            <p id="lineup-help">
              {published
                ? "Keep the same order and number of entries. Name corrections update every match without resetting scores."
                : lineupFormat === "round_robin"
                  ? "Enter 2–64 names. A complete round-robin fixture list will be generated automatically for any number of teams."
                  : lineupFormat === "flexible"
                    ? "Enter 2–50 names. Rounds are computed dynamically — e.g. 9–16 players → 4 rounds. Preliminary matches pair extra players; the rest get byes."
                    : "Enter 2–64 names. Paired from top to bottom; extra places receive byes and advance automatically."}
            </p>
            <LineupNames
              key={tournament.version}
              names={tournament.bracket.entries.map(entry => entry.name).join("\n")}
            />
            <button className="button organizer-primary" disabled={busy}>
              {pending ? "Saving…" : published ? "Save name changes" : "Publish Tournament"}
            </button>
          </form>
        </details>
      )}

      {published && (
        <>
          <p className="editor-instruction">
            {tournament.bracket.format === "round_robin" ? (
              <>
                <b>Round Robin League:</b> Click <i>Score / Details</i> to record fixture dates, venues, and scores. Standings and goal difference update automatically.
              </>
            ) : tournament.bracket.format === "flexible" ? (
              <>
                <b>Flexible Knockout:</b> Click a player&apos;s name to choose the winner. Winners advance to the next round automatically. Use <i>Details</i> for dates, venues, and scores.
              </>
            ) : (
              <>
                <b>Choose a winner:</b> click their name in a ready match. They appear in the next round immediately. Use <i>Details</i> for dates, venues, and optional scores.
              </>
            )}
          </p>

          {tournament.bracket.format === "round_robin" ? (
            <RoundRobinView
              tournament={tournament}
              onWinner={record}
              onDetails={setDetails}
              busy={busy}
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
            <form action={action} className="organizer-form">
              {hidden}
              <input type="hidden" name="kind" value="details" />
              <input type="hidden" name="matchId" value={details.id} />

              {/* Leg 1 */}
              <div className="match-leg-section">
                {is2LegMatch && <span className="leg-kicker">Leg 1 Details</span>}
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

                <div className="form-row-2">
                  {(["a", "b"] as const).map(side => (
                    <label key={side}>
                      {tournament.bracket.entries.find(entry => entry.id === details[side])?.name ?? "Opponent"} {is2LegMatch ? "(Leg 1 score)" : "score"}
                      <input
                        name={side === "a" ? "scoreA" : "scoreB"}
                        type="number"
                        min={0}
                        max={999}
                        step={1}
                        disabled={!details.a || !details.b}
                        defaultValue={side === "a" ? details.scoreA : details.scoreB}
                      />
                    </label>
                  ))}
                </div>
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

              <button className="button organizer-primary" disabled={busy}>
                {pending ? "Saving…" : "Save details"}
              </button>
            </form>
          )
        )}
      </dialog>
    </div>
  );
}
