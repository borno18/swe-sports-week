import { announcements } from "@/lib/data";
import { Bell, Megaphone } from "lucide-react";

export default function AnnouncementsPage() {
  return <div className="page-shell"><header className="page-hero"><span className="eyebrow">From the organizers</span><h1>Announcements</h1><p>Official schedule changes, check-in reminders, and tournament notices.</p></header><div className="notice-grid wide">{announcements.map((item) => <article className={`notice-card ${item.level}`} key={item.title}><div className="notice-icon"><Megaphone /></div><div><span>{item.level} · {item.time}</span><h3>{item.title}</h3><p>{item.body}</p></div></article>)}<article className="notice-card"><div className="notice-icon"><Bell /></div><div><span>Normal · Yesterday</span><h3>Sports Week registration is now closed</h3><p>Fixtures and first-round reporting times are now available on each tournament page.</p></div></article></div></div>;
}
