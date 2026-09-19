import { Megaphone, AlertTriangle, AlertCircle, Sparkles, Clock } from "lucide-react";
import { getAnnouncements } from "@/lib/announcements";
import { announcements as fallbackAnnouncements } from "@/lib/data";
import { AnnouncementBody } from "@/components/announcement-body";

export const dynamic = "force-dynamic";

const LEVEL_LABELS: Record<string, string> = {
  urgent: "Urgent Alert",
  important: "Important",
  update: "Score / Update",
  general: "General Notice",
};

export default async function AnnouncementsPage() {
  const dbAnnouncements = await getAnnouncements();
  const items = dbAnnouncements.length > 0 ? dbAnnouncements : fallbackAnnouncements;

  return (
    <div className="page-shell">
      <header className="page-hero">
        <div className="page-hero-organizer">
          <img src="/logos/swe-society-logo.png" alt="SWE Society" className="organizer-badge-logo" />
          <span>Official Communications · SWE Society</span>
        </div>
        <h1>Announcements</h1>
        <p>Official schedule changes, check-in reminders, registration links, and tournament notices.</p>
      </header>
      <div className="notice-grid wide">
        {items.map((item, index) => {
          const levelClass = item.level ? item.level.toLowerCase() : "general";
          const key = "id" in item && item.id ? String(item.id) : `${item.title}-${index}`;
          const author = "authorName" in item && typeof item.authorName === "string" ? item.authorName : null;
          const levelLabel = LEVEL_LABELS[levelClass] || "Notice";

          return (
            <article className={`notice-card ${levelClass}`} key={key}>
              <div className="notice-icon" aria-hidden="true">
                {levelClass === "urgent" ? (
                  <AlertTriangle />
                ) : levelClass === "important" ? (
                  <AlertCircle />
                ) : levelClass === "update" ? (
                  <Sparkles />
                ) : (
                  <Megaphone />
                )}
              </div>
              <div className="notice-card-content">
                <div className="notice-card-meta">
                  <span className={`announcement-pill ${levelClass}`}>
                    {levelLabel}
                  </span>
                  <span className="notice-time-badge">
                    <Clock size={12} aria-hidden="true" /> {item.time}
                  </span>
                </div>
                <h2 className="notice-card-title">{item.title}</h2>
                <div className="notice-card-body">
                  <AnnouncementBody content={item.body} />
                </div>
                {author && (
                  <footer className="notice-card-footer">
                    <span>Posted by:</span> <strong>{author}</strong>
                  </footer>
                )}
              </div>
            </article>
          );
        })}
        {!items.length && (
          <div className="empty-state">
            <Megaphone />
            <h3>No announcements yet</h3>
            <p>Check the schedule and brackets for the latest tournament updates.</p>
          </div>
        )}
      </div>
    </div>
  );
}
