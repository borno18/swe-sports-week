import { Megaphone, AlertTriangle, AlertCircle } from "lucide-react";
import { getAnnouncements } from "@/lib/announcements";
import { announcements as fallbackAnnouncements } from "@/lib/data";

export const dynamic = "force-dynamic";

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
        <p>Official schedule changes, check-in reminders, and tournament notices.</p>
      </header>
      <div className="notice-grid wide">
        {items.map((item, index) => {
          const levelClass = item.level ? item.level.toLowerCase() : "general";
          const key = "id" in item && item.id ? String(item.id) : `${item.title}-${index}`;
          const author = "authorName" in item && typeof item.authorName === "string" ? item.authorName : null;

          return (
            <article className={`notice-card ${levelClass}`} key={key}>
              <div className="notice-icon">
                {levelClass === "urgent" ? (
                  <AlertTriangle />
                ) : levelClass === "important" ? (
                  <AlertCircle />
                ) : (
                  <Megaphone />
                )}
              </div>
              <div>
                <span>{item.level.toUpperCase()} · {item.time}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                {author && (
                  <small className="notice-card-author">Posted by {author}</small>
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
