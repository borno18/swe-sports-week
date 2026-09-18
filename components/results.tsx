"use client";

import { useState, useMemo } from "react";
import { MatchCard } from "@/components/match-card";
import { type Champion, type Match } from "@/lib/data";
import { Medal, Trophy, Crown } from "lucide-react";
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
    if (filter === "by-sport" && selectedSport) return completed.filter(m => m.sport === selectedSport);
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
          <button className={`filter ${selectedSport === null ? "active" : ""}`} aria-pressed={selectedSport === null} onClick={() => setSelectedSport(null)}>All</button>
          {completedSports.map(sport => (
            <button key={sport} className={`filter ${selectedSport === sport ? "active" : ""}`} aria-pressed={selectedSport === sport} onClick={() => setSelectedSport(s => s === sport ? null : sport)}>
              {matches.find(m => m.sport === sport)?.icon} {sport}
            </button>
          ))}
        </div>
      )}

      <section className="content-section">
        <p className="results-meta">{displayed.length} {displayed.length === 1 ? "result" : "results"}{filter === "today" ? " today" : ""}</p>
        <div className="mc-grid" key={`${filter}-${selectedSport}`}>
          {displayed.map(match => <MatchCard key={match.id} match={match} />)}
          {displayed.length === 0 && <div className="empty-state"><h3>No results yet{filter === "today" ? " today" : ""}</h3><p>Completed matches will appear here.</p><button className="filter" onClick={() => { setFilter("recent"); setSelectedSport(null); }}>View recent</button></div>}
        </div>
      </section>

      {champions.length > 0 && <section className="content-section champ-section">
        <h2><Crown size={20} strokeWidth={2} /> Champions</h2>
        <div className="champ-grid">
          {champions.map(item => (
            <article className="champ-card" key={item.sport}>
              <div className="champ-head">
                <span>{item.icon}</span>
                <small>{item.sport}</small>
              </div>
              <div className="champ-winner"><Trophy size={16} strokeWidth={2} /><strong>{item.winner}</strong></div>
              <div className="champ-runner"><Medal size={14} /> {item.runnerUp}</div>
            </article>
          ))}
        </div>
      </section>}

      {champions.length === 0 && <section className="content-section">
        <div className="empty-state"><h3>Champions to be decided</h3><p>Winners will appear here automatically.</p></div>
      </section>}
    </div>
  );
}
