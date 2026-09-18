import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand"><span className="brand-mark">SW</span><div><b>Intra SWE Sports Week</b><small>Built for the SWE community, SUST.</small></div></div>
      <div className="footer-links"><Link href="/schedule">Schedule</Link><Link href="/sports">Sports</Link><Link href="/announcements">Announcements</Link></div>
      <p>© 2026 SWE Society · Official tournament brackets</p>
    </footer>
  );
}
