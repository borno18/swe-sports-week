"use client";

import { useState, useMemo } from "react";
import { SportCard } from "@/components/sport-card";
import { sports } from "@/lib/data";

type Filter = "all" | "indoor" | "outdoor";

export default function SportsPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const indoorCount = sports.filter(s => s.category === "Indoor").length;
  const outdoorCount = sports.filter(s => s.category === "Outdoor").length;

  const filtered = useMemo(() => {
    if (filter === "all") return sports;
    return sports.filter(s => s.category.toLowerCase() === filter);
  }, [filter]);

  return (
    <div className="page-shell">
      <header className="page-hero">
        <span className="eyebrow">{sports.length} sports · 286 competitors</span>
        <h1>Every arena.<br />Every challenger.</h1>
        <p>Follow draws, fixtures, brackets, and results across every Sports Week tournament.</p>
      </header>
      <div className="filter-row">
        <button className={`filter ${filter === "all" ? "active" : ""}`} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All sports</button>
        <button className={`filter ${filter === "indoor" ? "active" : ""}`} aria-pressed={filter === "indoor"} onClick={() => setFilter("indoor")}>Indoor · {indoorCount}</button>
        <button className={`filter ${filter === "outdoor" ? "active" : ""}`} aria-pressed={filter === "outdoor"} onClick={() => setFilter("outdoor")}>Outdoor · {outdoorCount}</button>
      </div>
      <div className="sports-grid sports-directory" key={filter}>
        {filtered.map(sport => <SportCard key={sport.slug} sport={sport} />)}
      </div>
    </div>
  );
}
