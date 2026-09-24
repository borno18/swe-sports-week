"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  MapPin,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  Trophy,
  Compass,
  CheckCircle2,
} from "lucide-react";
import {
  volunteerAssignments,
  getUniqueVolunteers,
  type VolunteerAssignment,
  type VolunteerPerson,
} from "@/lib/volunteers-data";

type FilterTab = "all" | "outdoor" | "indoor";
type ViewMode = "sport" | "volunteer";

interface VolunteersSectionProps {
  id?: string;
  className?: string;
  isStandalonePage?: boolean;
}

export function VolunteersSection({
  id = "volunteers",
  className = "",
  isStandalonePage = false,
}: VolunteersSectionProps) {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("sport");
  const [searchQuery, setSearchQuery] = useState("");

  const uniqueVolunteers = useMemo(() => getUniqueVolunteers(), []);

  // Filtered by sport
  const filteredAssignments = useMemo(() => {
    return volunteerAssignments.filter((item) => {
      // Category tab
      if (filter === "outdoor" && item.category !== "Outdoor") return false;
      if (filter === "indoor" && item.category !== "Indoor") return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesSport = item.sport.toLowerCase().includes(q);
        const matchesVolunteers = item.volunteers.some((v) =>
          v.toLowerCase().includes(q)
        );
        const matchesRole = item.role.toLowerCase().includes(q);
        const matchesVenue = item.venue.toLowerCase().includes(q);
        return matchesSport || matchesVolunteers || matchesRole || matchesVenue;
      }
      return true;
    });
  }, [filter, searchQuery]);

  // Filtered by volunteer
  const filteredVolunteers = useMemo(() => {
    return uniqueVolunteers.filter((person) => {
      // Category tab check (has at least one sport in this category)
      if (filter === "outdoor") {
        if (!person.sports.some((s) => s.category === "Outdoor")) return false;
      }
      if (filter === "indoor") {
        if (!person.sports.some((s) => s.category === "Indoor")) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = person.name.toLowerCase().includes(q);
        const matchesSport = person.sports.some((s) =>
          s.sport.toLowerCase().includes(q)
        );
        return matchesName || matchesSport;
      }
      return true;
    });
  }, [uniqueVolunteers, filter, searchQuery]);

  const outdoorCount = volunteerAssignments.filter(
    (a) => a.category === "Outdoor"
  ).length;
  const indoorCount = volunteerAssignments.filter(
    (a) => a.category === "Indoor"
  ).length;

  return (
    <section id={id} className={`section volunteers-section ${className}`}>
      {/* Section Header */}
      <div className="section-heading volunteers-heading">
        <div>
          <span className="eyebrow">
            <Users size={15} /> Event Operations & Arena Leads
          </span>
          <h2>Assigned Volunteers</h2>
          <p className="volunteers-subtitle">
            The dedicated coordinators ensuring smooth gameplay, fair rules, verified results, and energetic arenas across all outdoor and indoor disciplines.
          </p>
        </div>
        {!isStandalonePage && (
          <Link href="/volunteers" className="volunteers-view-all">
            Full volunteer directory <ArrowUpRight size={17} />
          </Link>
        )}
      </div>

      {/* Highlights Bar */}
      <div className="volunteers-stats-strip">
        <div className="v-stat-item">
          <div className="v-stat-icon">
            <Trophy size={18} />
          </div>
          <div>
            <strong>15 Arenas</strong>
            <small>Total Sports Covered</small>
          </div>
        </div>
        <div className="v-stat-divider" />
        <div className="v-stat-item">
          <div className="v-stat-icon outdoor">
            <Compass size={18} />
          </div>
          <div>
            <strong>2 Outdoor</strong>
            <small>Football & Cricket Fields</small>
          </div>
        </div>
        <div className="v-stat-divider" />
        <div className="v-stat-item">
          <div className="v-stat-icon indoor">
            <ShieldCheck size={18} />
          </div>
          <div>
            <strong>13 Indoor</strong>
            <small>Board, Digital & Fun Arenas</small>
          </div>
        </div>
        <div className="v-stat-divider" />
        <div className="v-stat-item">
          <div className="v-stat-icon ready">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <strong>100% Assigned</strong>
            <small>SWE Society Volunteers</small>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, View Toggle & Search */}
      <div className="volunteers-toolbar">
        <div className="filter-group">
          <button
            type="button"
            className={`filter ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
            aria-pressed={filter === "all"}
          >
            All Arenas · {volunteerAssignments.length}
          </button>
          <button
            type="button"
            className={`filter ${filter === "outdoor" ? "active" : ""}`}
            onClick={() => setFilter("outdoor")}
            aria-pressed={filter === "outdoor"}
          >
            Outdoor · {outdoorCount}
          </button>
          <button
            type="button"
            className={`filter ${filter === "indoor" ? "active" : ""}`}
            onClick={() => setFilter("indoor")}
            aria-pressed={filter === "indoor"}
          >
            Indoor · {indoorCount}
          </button>
        </div>

        <div className="toolbar-right">
          {/* Search Box */}
          <div className="volunteers-search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by volunteer or sport…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search volunteer assignments"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="view-mode-toggle" role="tablist" aria-label="View format">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === "sport" ? "active" : ""}`}
              onClick={() => setViewMode("sport")}
              role="tab"
              aria-selected={viewMode === "sport"}
            >
              By Sport
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === "volunteer" ? "active" : ""}`}
              onClick={() => setViewMode("volunteer")}
              role="tab"
              aria-selected={viewMode === "volunteer"}
            >
              By Volunteer
            </button>
          </div>
        </div>
      </div>

      {/* Content Grid: View by Sport */}
      {viewMode === "sport" && (
        <>
          {filteredAssignments.length === 0 ? (
            <div className="empty-state">
              <span>🔍</span>
              <h3>No volunteer assignments found</h3>
              <p>Try refining your search keyword or clearing the filters.</p>
              <button
                type="button"
                className="button primary"
                onClick={() => {
                  setFilter("all");
                  setSearchQuery("");
                }}
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="volunteers-grid">
              {filteredAssignments.map((item) => (
                <VolunteerCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Content Grid: View by Volunteer */}
      {viewMode === "volunteer" && (
        <>
          {filteredVolunteers.length === 0 ? (
            <div className="empty-state">
              <span>👤</span>
              <h3>No volunteers found</h3>
              <p>No volunteer matching &quot;{searchQuery}&quot; in this category.</p>
              <button
                type="button"
                className="button primary"
                onClick={() => {
                  setFilter("all");
                  setSearchQuery("");
                }}
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="volunteers-person-grid">
              {filteredVolunteers.map((person) => (
                <VolunteerPersonCard key={person.name} person={person} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Bottom Information Callout */}
      <div className="volunteers-footer-callout">
        <div className="callout-icon">
          <ShieldCheck size={22} />
        </div>
        <div className="callout-text">
          <h4>Have a query regarding your match or tournament schedule?</h4>
          <p>
            Please reach out directly to the assigned sport coordinator at the venue or find SWE Society tournament executives before your match begins.
          </p>
        </div>
      </div>
    </section>
  );
}

function VolunteerCard({ item }: { item: VolunteerAssignment }) {
  const isOutdoor = item.category === "Outdoor";

  return (
    <article
      className="v-card"
      style={{ "--v-sport-color": item.color } as React.CSSProperties}
    >
      <div className="v-card-top">
        <div className="v-card-icon-frame">
          <span className="v-card-icon">{item.icon}</span>
        </div>
        <div className="v-card-meta">
          <span
            className={`v-category-badge ${
              isOutdoor ? "badge-outdoor" : "badge-indoor"
            }`}
          >
            {item.category}
          </span>
          <span className="v-role-label">{item.role}</span>
        </div>
      </div>

      <div className="v-card-content">
        <h3 className="v-card-sport">{item.sport}</h3>
        <p className="v-card-detail">{item.detail}</p>
        <div className="v-card-venue">
          <MapPin size={13} />
          <span>{item.venue}</span>
        </div>
      </div>

      {/* Assigned Volunteers Section */}
      <div className="v-card-assigned">
        <span className="v-assigned-kicker">Assigned Lead / Volunteer</span>
        <div className="v-people-list">
          {item.volunteers.map((name) => {
            const isAllGirls = name.toLowerCase().includes("all girls");
            const initial = isAllGirls ? "★" : name.trim().charAt(0).toUpperCase();

            return (
              <div
                key={name}
                className={`v-person-chip ${isAllGirls ? "special-team" : ""}`}
              >
                <div className="v-avatar">
                  {isAllGirls ? <Sparkles size={14} /> : initial}
                </div>
                <div className="v-person-info">
                  <span className="v-person-name">{name}</span>
                  <small className="v-person-title">
                    {isAllGirls ? "Volunteer Committee" : "Tournament Lead"}
                  </small>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card Action */}
      {item.sportSlug && (
        <div className="v-card-footer">
          <Link href={`/sports/${item.sportSlug}`} className="v-bracket-link">
            <span>Explore arena &amp; fixtures</span>
            <ArrowUpRight size={15} />
          </Link>
        </div>
      )}
    </article>
  );
}

function VolunteerPersonCard({ person }: { person: VolunteerPerson }) {
  const isSpecial = person.isSpecialGroup;
  const initial = isSpecial ? "★" : person.name.trim().charAt(0).toUpperCase();

  return (
    <article className={`v-person-card ${isSpecial ? "special-card" : ""}`}>
      <div className="v-person-header">
        <div className="v-person-avatar-large">
          {isSpecial ? <Sparkles size={20} /> : initial}
        </div>
        <div>
          <h3 className="v-person-card-name">{person.name}</h3>
          <span className="v-person-card-badge">
            {isSpecial
              ? "All Girls Event Committee"
              : `${person.sports.length} Assigned ${
                  person.sports.length === 1 ? "Sport" : "Sports"
                }`}
          </span>
        </div>
      </div>

      <div className="v-person-sports-list">
        {person.sports.map((s, idx) => (
          <div key={idx} className="v-person-sport-row">
            <span className="v-sport-row-icon">{s.icon}</span>
            <div className="v-sport-row-text">
              <strong>{s.sport}</strong>
              <small>
                {s.category} · {s.role}
              </small>
            </div>
            {s.sportSlug && (
              <Link
                href={`/sports/${s.sportSlug}`}
                className="v-sport-row-link"
                title={`View ${s.sport}`}
              >
                <ArrowUpRight size={15} />
              </Link>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}
