import { getTournamentData } from "@/lib/tournaments";
import { Medal, Trophy } from "lucide-react";

export default async function ChampionsPage() {
  const { champions } = await getTournamentData();
  return (
    <div className="champions-page">
      <header className="champions-hero">
        <div className="champions-presenter-badge">
          <img
            src="/logos/swe-society-logo-white.png"
            alt="SWE Society"
            className="champions-badge-logo"
          />
          <span className="presenter-bullet" aria-hidden="true">•</span>
          <span>Software Engineering Society · SUST</span>
        </div>
        <h1>Hall of<br /><em>Champions</em></h1>
        <p>The names, teams, and moments that defined the week.</p>
      </header>
      <section className="champions-list">
        {!champions.length && (
          <div className="champions-empty">
            <Trophy />
            <h2>The titles are still up for grabs.</h2>
            <p>Winners and runners-up appear here as soon as the finals are decided.</p>
          </div>
        )}
        {champions.map((item, index) => (
          <article className="champion-row" key={item.sport}>
            <span className="rank">0{index + 1}</span>
            <div className="champion-sport">
              <i>{item.icon}</i>
              <span>{item.sport}<small>{item.batch}</small></span>
            </div>
            <div className="champion-person">
              <Trophy />
              <span><small>Champion</small><strong>{item.winner}</strong></span>
            </div>
            <div className="runner-person">
              <Medal />
              <span><small>Runner-up</small><strong>{item.runnerUp}</strong></span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
