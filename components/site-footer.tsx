import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-shell">
        <div className="footer-top">
          <div className="footer-org-showcase">
            {/* Prioritized SWE Society */}
            <div className="footer-society-block">
              <img
                src="/logos/swe-society-logo-white.png"
                alt="SWE Society"
                className="footer-society-logo"
              />
              <div className="footer-society-desc">
                <strong>Software Engineering Society</strong>
                <p>Department of Software Engineering</p>
                <small>Official Organizing Body · Intra SWE Sports Week 2026</small>
              </div>
            </div>

            <div className="footer-v-line" aria-hidden="true" />

            {/* University Affiliation */}
            <div className="footer-sust-block">
              <div className="footer-sust-crest">
                <img
                  src="/logos/sust-logo.png"
                  alt="SUST Crest"
                  className="footer-sust-logo"
                />
              </div>
              <div className="footer-sust-desc">
                <strong>Shahjalal University of Science and Technology</strong>
                <small>Kumargaon, Sylhet-3114, Bangladesh</small>
              </div>
            </div>
          </div>

          <div className="footer-nav-section">
            <span className="footer-heading">Tournament Hub</span>
            <div className="footer-links-grid">
              <Link href="/schedule">Schedule & Fixtures</Link>
              <Link href="/sports">Sports & Brackets</Link>
              <Link href="/results">Results & Outcomes</Link>
              <Link href="/champions">Hall of Champions</Link>
              <Link href="/announcements">Notices & Bulletins</Link>
              <Link href="/admin">Admin Portal</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p>© 2026 SWE Society, SUST. Official tournament brackets & live results hub.</p>
          <div className="footer-badges">
            <span>Fair Play</span>
            <span aria-hidden="true">•</span>
            <span>Sportsmanship</span>
            <span aria-hidden="true">•</span>
            <span>Batch Unity</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
