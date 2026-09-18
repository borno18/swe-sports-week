"use client";

import { useState, useMemo } from "react";
import { MatchCard } from "@/components/match-card";
import { type Champion, type Match } from "@/lib/data";
import { Medal, Trophy } from "lucide-react";
import { useEffect } from "react";

type Filter = "recent" | "today" | "by-sport";

export function Results({ matches, champions }: { matches: Match[]; champions: Champion[] }) {
  const [today, setToday] = useState("");
  useEffect(() => {
    const update = () => setToday(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date()));
    update(); const timer = setInterval(update, 60_000); return () => clearInterval(timer);
  }, []);
  const completed = useMemo(() => matches.filter(m => m.status === "completed").sort((a,b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)), [matches]);
  const completedSports = [...new Set(completed.map(m => m.sport))];
  const [filter, setFilter] = useState<Filter>("recent");
  const [selectedSport, setSelectedSport] = useState<string | null>(null);

  const displayed = useMemo(() => {
    if (filter === "today") return completed.filter(m => m.completedAt && new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date(m.completedAt)) === today);
    if (filter === "by-sport" && selectedSport) {
      return completed.filter(m => m.sport === selectedSport);
    }
    return completed;
  }, [filter, selectedSport, today, completed]);

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
          {champions.length === 0 && <div className="empty-state"><h3>Champions to be decided</h3><p>Final winners will appear here automatically.</p></div>}
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
