"use client";

import { useState, useMemo } from "react";
import { MatchCard } from "@/components/match-card";
import { champions, matches } from "@/lib/data";
import { Medal, Trophy } from "lucide-react";
import { useEventDay } from "@/components/use-event-day";

const minutes = (time: string) => {
  const [hour, minute, period] = time.split(/[: ]/);
  return (Number(hour) % 12 + (period === "PM" ? 12 : 0)) * 60 + Number(minute);
};
const completed = matches.filter(m => m.status === "completed").sort((a, b) => b.day - a.day || minutes(b.time) - minutes(a.time));
const completedSports = [...new Set(completed.map(m => m.sport))];

type Filter = "recent" | "today" | "by-sport";

export default function ResultsPage() {
  const today = useEventDay();
  const [filter, setFilter] = useState<Filter>("recent");
  const [selectedSport, setSelectedSport] = useState<string | null>(null);

  const displayed = useMemo(() => {
    if (filter === "today") return completed.filter(m => m.day === today);
    if (filter === "by-sport" && selectedSport) {
      return completed.filter(m => m.sport === selectedSport);
    }
    return completed;
  }, [filter, selectedSport, today]);

  return (
    <div className="page-shell">
      <header className="page-hero">
        <span className="eyebrow">Latest outcomes</span>
        <h1>Results</h1>
        <p>Final scores, winning moments, and everyone moving on.</p>
      </header>
      <div className="filter-row">
        <button className={`filter ${filter === "recent" ? "active" : ""}`} aria-pressed={filter === "recent"} onClick={() => { setFilter("recent"); setSelectedSport(null); }}>Recent</button>
        <button className={`filter ${filter === "today" ? "active" : ""}`} aria-pressed={filter === "today"} onClick={() => { setFilter("today"); setSelectedSport(null); }}>Today</button>
        <button className={`filter ${filter === "by-sport" ? "active" : ""}`} aria-pressed={filter === "by-sport"} onClick={() => setFilter("by-sport")}>By sport</button>
      </div>

      {filter === "by-sport" && (
        <div className="filter-row sub-filter">
          <button className={`filter ${selectedSport === null ? "active" : ""}`} aria-pressed={selectedSport === null} onClick={() => setSelectedSport(null)}>All sports</button>
          {completedSports.map(sport => (
            <button
              key={sport}
              className={`filter ${selectedSport === sport ? "active" : ""}`}
              aria-pressed={selectedSport === sport}
              onClick={() => setSelectedSport(s => s === sport ? null : sport)}
            >
              {matches.find(m => m.sport === sport)?.icon} {sport}
            </button>
          ))}
        </div>
      )}

      <section className="content-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Final whistle</span>
            <h2>{filter === "today" ? "Today's results" : selectedSport ? `${selectedSport} results` : "Recently completed"}</h2>
          </div>
        </div>
        <p className="result-count" role="status">{displayed.length} {displayed.length === 1 ? "result" : "results"}{filter === "today" ? " · Bangladesh time" : ""}</p>
        <div className="match-grid" key={`${filter}-${selectedSport}`}>
          {displayed.map(match => <MatchCard key={match.id} match={match} />)}
          {displayed.length === 0 && <div className="empty-state"><h3>No results yet{filter === "today" ? " today" : ""}</h3><p>Completed matches will appear here once published.</p><button className="filter" onClick={() => { setFilter("recent"); setSelectedSport(null); }}>View recent results</button></div>}
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow"><Trophy size={14} /> Winners crowned</span>
            <h2>Completed tournaments</h2>
          </div>
        </div>
        <div className="winner-grid">
          {champions.map(item => (
            <article className="winner-card" key={item.sport}>
              <span className="winner-sport">{item.icon} {item.sport}</span>
              <Trophy /><small>Champion</small>
              <h3>{item.winner}</h3>
              <p><Medal size={14} /> Runner-up · {item.runnerUp}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
