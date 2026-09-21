"use client";

import { useState } from "react";
import { tournamentGroups, type BracketMatch, type Tournament } from "@/lib/bracket";
import { RoundRobinView } from "./round-robin-view";

export function GroupStageView({ tournament, onWinner, onDetails, onQualifiers, busy = false }: {
  tournament: Tournament;
  onWinner?: (match: BracketMatch, entry: string | null) => void;
  onDetails?: (match: BracketMatch) => void;
  onQualifiers?: (groupId: string, entries: string[]) => void;
  busy?: boolean;
}) {
  const groups = tournamentGroups(tournament.bracket);
  const [active, setActive] = useState(0);
  const group = groups[Math.min(active, groups.length - 1)];
  if (!group) return null;
  const count = tournament.bracket.groupStageConfig!.advancePerGroup;
  return <section className="group-stage-view" aria-label={`${tournament.title} group stage`}>
    <div className="editor-heading"><div><span className="eyebrow">Stage 1</span><h2>Group stage</h2></div><span className="result-count">Top {count} from each group qualify</span></div>
    <div className="filter-row" role="group" aria-label="Select group">
      {groups.map((item, index) => <button key={item.id} type="button" className={`filter${index === active ? " active" : ""}`} aria-pressed={index === active} onClick={() => setActive(index)}>{item.name}</button>)}
    </div>
    <p className="editor-instruction">{group.qualifiers.length ? <>Qualified: <strong>{group.qualifiers.map(id => group.bracket.entries.find(e => e.id === id)?.name).join(", ")}</strong></> : group.complete ? "A tie affects qualification or seeding. The organizer must confirm the tied players’ finishing order." : "Finish all matches in this group to qualify players for the knockout rounds."}</p>
    {group.complete && group.tied && onQualifiers && <form key={`${group.id}-${group.qualifiers.join()}`} className="organizer-form group-qualifiers" onSubmit={event => {
      event.preventDefault();
      onQualifiers(group.id, new FormData(event.currentTarget).getAll("qualifier").map(String));
    }}>
      <p>Ranking: points, goal/score difference, then goals/scores for. Resolve remaining ties using your event’s tie-break rule.</p>
      {Array.from({ length: count }, (_, rank) => <label key={rank}>Qualifier {rank + 1}<select name="qualifier" required defaultValue={group.qualifiers[rank] ?? ""} disabled={busy}><option value="">Choose player / team</option>{group.standings.map(row => <option key={row.id} value={row.id}>{row.name} · {row.points} pts · GD {row.gd}</option>)}</select></label>)}
      <button className="button organizer-primary" disabled={busy}>{busy ? "Saving…" : "Confirm qualifiers"}</button>
    </form>}
    <RoundRobinView key={group.id} tournament={{ ...tournament, title: `${tournament.title} · ${group.name}`, bracket: group.bracket }} onWinner={onWinner} onDetails={onDetails} busy={busy} groupStage />
    <div className="editor-heading group-knockout-heading"><div><span className="eyebrow">Stage 2</span><h2>Knockout rounds</h2></div></div>
  </section>;
}
