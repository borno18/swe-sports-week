import Link from "next/link";
import { ArrowLeft, LogOut, ShieldCheck, Trophy, Users, CheckCircle2, GitBranch, Megaphone, Layers } from "lucide-react";
import { loginAction, logoutAction } from "@/app/admin/actions";
import { getCurrentAdmin } from "@/lib/auth";
import { SubmitButton } from "@/components/submit-button";
import { TournamentEditor, NewSectionForm } from "@/components/tournament-editor";
import { AnnouncementManager } from "@/components/announcement-manager";
import { SportManager } from "@/components/sport-manager";
import { getTournamentData } from "@/lib/tournaments";
import { getAnnouncements } from "@/lib/announcements";
import { championOf } from "@/lib/bracket";

type AdminPageProps = {
  searchParams: Promise<{ error?: string; section?: string; tab?: string }>;
};

function LoginForm({ error }: { error?: string }) {
  const message = error === "locked"
    ? "Too many unsuccessful attempts. Try again in 15 minutes."
    : error
      ? "The email or password is incorrect."
      : null;

  return (
    <div className="admin-page">
      <Link href="/" className="back-link"><ArrowLeft size={16} /> Back to public site</Link>
      <section className="admin-card">
        <div className="admin-icon"><ShieldCheck /></div>
        <span className="eyebrow">Authorized organizers only</span>
        <h1>Sports Week<br />Control Center</h1>
        <p>Sign in to add players and teams, configure tournament formats, publish brackets, advance match winners, and broadcast notices.</p>
        {message && <div className="login-error" role="alert">{message}</div>}
        <form action={loginAction}>
          <label htmlFor="email">Email address<input id="email" name="email" type="email" autoComplete="username" placeholder="admin@example.com" required /></label>
          <label htmlFor="password">Password<input id="password" name="password" type="password" autoComplete="current-password" placeholder="Password" minLength={8} maxLength={200} required /></label>
          <SubmitButton />
        </form>
        <small>Sessions expire after 12 hours. Failed sign-ins are rate limited and recorded.</small>
      </section>
    </div>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [user, params, tournamentData, announcements] = await Promise.all([
    getCurrentAdmin(),
    searchParams,
    getTournamentData(),
    getAnnouncements(),
  ]);
  if (!user) return <LoginForm error={params.error} />;

  const { tournaments, sports, matches } = tournamentData;
  const selected = tournaments.find(t => t.id === params.section) ?? tournaments[0];
  const published = tournaments.filter(t => t.bracket.rounds.length);
  const canEditLineup = user.role !== "RESULT_MANAGER";

  const activeTab =
    params.tab === "announcements"
      ? "announcements"
      : params.tab === "segments"
        ? "segments"
        : "tournaments";

  return (
    <div className="organizer-page">
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">Sports Week Control Center</span>
          <h1>Welcome, {user.name.split(" ")[0]}.</h1>
          <p>{user.email} · Your changes are published live to the website.</p>
        </div>
        <form action={logoutAction}>
          <button className="dashboard-logout"><LogOut size={16} /> Sign out</button>
        </form>
      </header>

      <section className="dashboard-stats" aria-label="Tournament overview">
        <article>
          <span><GitBranch /></span>
          <div><b>{published.length}</b><small>Published draws</small></div>
        </article>
        <article>
          <span><Users /></span>
          <div><b>{tournaments.reduce((sum, t) => sum + t.bracket.entries.length, 0)}</b><small>Players / teams</small></div>
        </article>
        <Link href="/admin?tab=segments" className="stat-card-link">
          <article className={activeTab === "segments" ? "stat-active" : ""}>
            <span><Layers /></span>
            <div><b>{sports.length}</b><small>Game segments</small></div>
          </article>
        </Link>
        <article>
          <span><CheckCircle2 /></span>
          <div><b>{matches.filter(m => m.status === "completed").length}</b><small>Decided matches</small></div>
        </article>
        <Link href="/admin?tab=announcements" className="stat-card-link">
          <article className={activeTab === "announcements" ? "stat-active" : ""}>
            <span><Megaphone /></span>
            <div><b>{announcements.length}</b><small>Active notices</small></div>
          </article>
        </Link>
      </section>

      <nav className="admin-nav-tabs" aria-label="Admin sections">
        <Link
          href={`/admin?tab=tournaments${selected ? `&section=${selected.id}` : ""}`}
          className={`admin-tab-button ${activeTab === "tournaments" ? "active" : ""}`}
          aria-current={activeTab === "tournaments" ? "page" : undefined}
        >
          <GitBranch size={16} /> Tournaments &amp; Brackets
        </Link>
        <Link
          href="/admin?tab=segments"
          className={`admin-tab-button ${activeTab === "segments" ? "active" : ""}`}
          aria-current={activeTab === "segments" ? "page" : undefined}
        >
          <Layers size={16} /> Game Segments
          <span className="admin-tab-badge">{sports.length}</span>
        </Link>
        <Link
          href="/admin?tab=announcements"
          className={`admin-tab-button ${activeTab === "announcements" ? "active" : ""}`}
          aria-current={activeTab === "announcements" ? "page" : undefined}
        >
          <Megaphone size={16} /> Announcements &amp; Bulletins
          <span className="admin-tab-badge">{announcements.length}</span>
        </Link>
      </nav>

      {activeTab === "announcements" ? (
        <AnnouncementManager announcements={announcements} />
      ) : activeTab === "segments" ? (
        <SportManager sports={sports} tournaments={tournaments} />
      ) : (
        <div className="organizer-workspace">
          <aside className="section-sidebar">
            <Link href="/admin?tab=segments" className="sidebar-announcement-shortcut segment-shortcut">
              <Layers size={15} />
              <span>Manage Game Segments</span>
              <span className="shortcut-badge">{sports.length}</span>
            </Link>
            <h2>Tournament sections</h2>
            <nav aria-label="Tournament sections">
              {tournaments.map(t => (
                <Link
                  key={t.id}
                  href={`/admin?tab=tournaments&section=${t.id}`}
                  aria-current={selected?.id === t.id ? "page" : undefined}
                >
                  <strong>{t.title}</strong>
                  <small>
                    {t.bracket.format === "round_robin" ? "Group Stage" : "Knockout"} · {t.bracket.entries.length} entries
                  </small>
                </Link>
              ))}
            </nav>
            {canEditLineup && <NewSectionForm sports={sports} />}
          </aside>
          {selected ? (
            <TournamentEditor key={selected.id} tournament={selected} canEditLineup={canEditLineup} />
          ) : (
            <div className="empty-state">
              <h3>No sections created yet</h3>
              <p>Use the form on the left to create your first tournament section.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
