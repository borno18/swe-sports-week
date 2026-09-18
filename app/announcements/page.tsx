import { announcements } from "@/lib/data";
import { Megaphone } from "lucide-react";

export default function AnnouncementsPage() {
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
        {announcements.map(item => (
          <article className={`notice-card ${item.level}`} key={item.title}>
            <div className="notice-icon"><Megaphone /></div>
            <div>
              <span>{item.level} · {item.time}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          </article>
        ))}
        {!announcements.length && (
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
