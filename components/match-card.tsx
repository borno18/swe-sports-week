import { MapPin, Radio, Trophy } from "lucide-react";
import { eventDays, type Match } from "@/lib/data";

export function MatchCard({ match, highlighted = false }: { match: Match; highlighted?: boolean }) {
  return (
    <article id={`match-${match.id}`} className={`match-card ${match.status}${highlighted ? " highlighted" : ""}`} tabIndex={-1}>
      <div className="match-topline">
        <span className="sport-label"><b>{match.icon}</b>{match.sport}</span>
        <span className={`status-pill ${match.status}`}>{match.status === "live" && <Radio size={12} />} {match.status}</span>
      </div>
      <p className="match-meta">{match.category} · {match.round}</p>
      <p className="match-date">{eventDays[match.day - 1]?.label}</p>
      <div className="score-row"><strong>{match.participantA}</strong>{match.scoreA && <b>{match.scoreA}</b>}</div>
      <div className="score-row"><strong>{match.participantB}</strong>{match.scoreB && <b>{match.scoreB}</b>}</div>
      <div className="match-footer"><span><MapPin size={14} />{match.venue}</span><span>{match.status === "completed" ? <Trophy size={14} /> : null}{match.time}</span></div>
    </article>
  );
}
