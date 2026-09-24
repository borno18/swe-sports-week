import type { Metadata } from "next";
import Link from "next/link";
import { UserCheck, ArrowUpRight, Shield } from "lucide-react";
import {
  outdoorVolunteerAssignments,
  indoorVolunteerAssignments,
} from "@/lib/volunteers-data";

export const metadata: Metadata = {
  title: "Assigned Volunteers | Intra SWE Sports Week 2026",
  description:
    "Official list of sports and their assigned student coordinators for Intra SWE Sports Week 2026.",
};

export default function VolunteersPage() {
  let counter = 1;

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
        <span className="hero-eyebrow-accent">
          <Shield size={14} /> FIELD &amp; ARENA OPERATIONS
        </span>
        <h1>
          Assigned<br />
          <em>Volunteers</em>
        </h1>
        <p>Official list of games and assigned tournament coordinators for Sports Week.</p>
      </header>

      <section className="champions-list">
        {/* OUTDOOR */}
        <div className="volunteer-group-heading">
          <span>Outdoor Sports</span>
        </div>
        {outdoorVolunteerAssignments.map((item) => {
          const rank = String(counter++).padStart(2, "0");
          return (
            <article className="champion-row volunteer-row-card" key={item.id}>
              <span className="rank">{rank}</span>

              <div className="champion-sport">
                <i>{item.icon}</i>
                <span>
                  {item.sport}
                  <small>{item.category} · {item.venue}</small>
                </span>
              </div>

              <div className="champion-person volunteer-highlight">
                <UserCheck size={18} />
                <span>
                  <small>
                    {item.volunteers.length > 1
                      ? "Assigned Volunteers"
                      : "Assigned Volunteer"}
                  </small>
                  <strong>{item.volunteers.join(", ")}</strong>
                </span>
              </div>

              <div className="volunteer-extra-col">
                <span>
                  <small>Role</small>
                  <strong>{item.role}</strong>
                </span>
                {item.sportSlug && (
                  <Link
                    href={`/sports/${item.sportSlug}`}
                    className="volunteer-arrow-link"
                    title={`View ${item.sport} arena`}
                    aria-label={`View ${item.sport} arena`}
                  >
                    <ArrowUpRight size={17} />
                  </Link>
                )}
              </div>
            </article>
          );
        })}

        {/* INDOOR */}
        <div className="volunteer-group-heading indoor">
          <span>Indoor Sports</span>
        </div>
        {indoorVolunteerAssignments.map((item) => {
          const rank = String(counter++).padStart(2, "0");
          return (
            <article className="champion-row volunteer-row-card" key={item.id}>
              <span className="rank">{rank}</span>

              <div className="champion-sport">
                <i>{item.icon}</i>
                <span>
                  {item.sport}
                  <small>{item.category} · {item.venue}</small>
                </span>
              </div>

              <div className="champion-person volunteer-highlight">
                <UserCheck size={18} />
                <span>
                  <small>
                    {item.volunteers.length > 1
                      ? "Assigned Volunteers"
                      : "Assigned Volunteer"}
                  </small>
                  <strong>{item.volunteers.join(", ")}</strong>
                </span>
              </div>

              <div className="volunteer-extra-col">
                <span>
                  <small>Role</small>
                  <strong>{item.role}</strong>
                </span>
                {item.sportSlug && (
                  <Link
                    href={`/sports/${item.sportSlug}`}
                    className="volunteer-arrow-link"
                    title={`View ${item.sport} arena`}
                    aria-label={`View ${item.sport} arena`}
                  >
                    <ArrowUpRight size={17} />
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
