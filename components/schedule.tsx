"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { MatchCard } from "@/components/match-card";
import { matches, eventDays } from "@/lib/data";
import { useEventDay } from "@/components/use-event-day";

const indoorSports = new Set(["Badminton", "Chess", "Table Tennis", "FIFA", "Carrom", "Ludo", "Mini Militia", "Pen Fight", "UNO"]);

type CategoryFilter = "all" | "indoor" | "outdoor";

export function Schedule({ initialDay, highlightedMatch }: { initialDay: number; highlightedMatch?: string }) {
  const dayIndex = initialDay - 1;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function changeDay(day: number) {
    startTransition(() => router.push(`/schedule?day=${day}`, { scroll: false }));
  }
  const today = useEventDay();
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [showMore, setShowMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const day = eventDays[dayIndex];

  const filtered = useMemo(() => {
    let result = matches.filter(m => m.day === dayIndex + 1);
    if (category !== "all") {
      result = result.filter(m =>
        category === "indoor" ? indoorSports.has(m.sport) : !indoorSports.has(m.sport)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter(m => m.status === statusFilter);
    }
    return result;
  }, [dayIndex, category, statusFilter]);

  return (
    <div className="page-shell">
      <header className="page-hero">
        <span className="eyebrow">Never miss your match</span>
        <h1>Schedule</h1>
        <p>Times, venues, opponents, and live status — all in one place.</p>
      </header>

      <div className="date-switcher" aria-busy={pending}>
        <button
          aria-label="Previous day"
          onClick={() => changeDay(initialDay - 1)}
          disabled={pending || dayIndex === 0}
        >
          <ChevronLeft />
        </button>
        <div>
          <small>{dayIndex + 1 === today ? "Today · " : ""}{day.short}</small>
          <strong>{day.label}</strong>
        </div>
        <button
          aria-label="Next day"
          onClick={() => changeDay(initialDay + 1)}
          disabled={pending || dayIndex === eventDays.length - 1}
        >
          <ChevronRight />
        </button>
      </div>

      <div className="filter-row">
        <button className={`filter ${category === "all" ? "active" : ""}`} aria-pressed={category === "all"} onClick={() => setCategory("all")}>All sports</button>
        <button className={`filter ${category === "indoor" ? "active" : ""}`} aria-pressed={category === "indoor"} onClick={() => setCategory("indoor")}>Indoor</button>
        <button className={`filter ${category === "outdoor" ? "active" : ""}`} aria-pressed={category === "outdoor"} onClick={() => setCategory("outdoor")}>Outdoor</button>
        <button className={`filter ${showMore || statusFilter !== "all" ? "active" : ""}`} aria-expanded={showMore} aria-controls="status-filters" onClick={() => setShowMore(v => !v)}>
          <SlidersHorizontal size={15} /> {showMore ? "Fewer filters" : "More filters"}{statusFilter !== "all" ? ` · ${statusFilter}` : ""}
        </button>
        {(category !== "all" || statusFilter !== "all") && <button className="filter" onClick={() => { setCategory("all"); setStatusFilter("all"); }}>Clear filters</button>}
      </div>

      {showMore && (
        <div id="status-filters" className="status-filters">
          {["all", "live", "upcoming", "completed", "postponed"].map(s => (
            <button
              key={s}
              className={`status-filter ${statusFilter === s ? "active" : ""}`}
              aria-pressed={statusFilter === s}
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      )}

      <section className="schedule-block">
        <div className="schedule-block-title">
          <CalendarDays />
          <div>
            <span>{dayIndex + 1 === today ? "Today · " : ""}{day.short}</span>
            <h2>{day.label.split(", ")[1]}</h2>
          </div>
          <b role="status">{filtered.length} {filtered.length === 1 ? "match" : "matches"}</b>
        </div>
        {filtered.length > 0 ? (
          <div className="match-grid" key={`${dayIndex}-${category}-${statusFilter}`}>
            {filtered.map(match => <MatchCard key={match.id} match={match} highlighted={match.id === highlightedMatch} />)}
          </div>
        ) : (
          <div className="empty-state">
            <span>📅</span>
            <h3>{category !== "all" || statusFilter !== "all" ? "No matches found" : "No matches scheduled yet"}</h3>
            <p>
              {category !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters."
                : "The schedule for this day will appear once published."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
