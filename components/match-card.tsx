import { MapPin, Trophy } from "lucide-react";
import { eventDays, type Match } from "@/lib/data";

export function MatchCard({ match, highlighted = false }: { match: Match; highlighted?: boolean }) {
  const isCompleted = match.status === "completed";
  const hasScores = match.scoreA || match.scoreB;
  return (
    <article id={`match-${match.id}`} className={`mc${isCompleted ? " mc-done" : ""}${highlighted ? " mc-hl" : ""}`} tabIndex={-1}>
      <div className="mc-top">
        <span className="mc-sport">{match.icon} {match.sport}</span>
        <span className="mc-round">{match.category} · {match.round}</span>
      </div>

      <div className="mc-versus">
        <div className={`mc-team${match.winner === match.participantA ? " mc-w" : ""}`}>
          <span className="mc-team-name">{match.participantA}</span>
          {hasScores && <span className="mc-team-score">{match.scoreA}</span>}
        </div>
        <div className={`mc-team${match.winner === match.participantB ? " mc-w" : ""}`}>
          <span className="mc-team-name">{match.participantB}</span>
          {hasScores && <span className="mc-team-score">{match.scoreB}</span>}
        </div>
      </div>

      {match.winner && <div className="mc-winner"><Trophy size={13} strokeWidth={2.5} /> {match.winner}</div>}

      <div className="mc-bottom">
        <span><MapPin size={12} />{match.venue}</span>
        <span>{eventDays[match.day - 1]?.label || match.date || "TBD"}{match.time !== "Time TBD" ? ` · ${match.time}` : ""}</span>
      </div>
    </article>
  );
}
