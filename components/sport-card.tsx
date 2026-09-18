import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Sport } from "@/lib/data";

export function SportCard({ sport }: { sport: Sport }) {
  return (
    <Link href={`/sports/${sport.slug}`} className="sport-card" style={{ "--sport-color": sport.color } as React.CSSProperties}>
      <div className="sport-icon">{sport.icon}</div>
      <span className="eyebrow">{sport.category}</span>
      <h3>{sport.name}</h3>
      <p>{sport.detail}</p>
      <div className="sport-stats"><span><b>{sport.participants}</b> Players</span><span><b>{sport.matches}</b> Matches</span></div>
      <div className="sport-card-footer"><span>{sport.stage}</span><ArrowUpRight size={19} /></div>
    </Link>
  );
}
