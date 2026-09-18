import Link from "next/link";
import { ArrowLeft, LogOut, ShieldCheck, Trophy, Users, CheckCircle2, GitBranch } from "lucide-react";
import { loginAction, logoutAction } from "@/app/admin/actions";
import { getCurrentAdmin } from "@/lib/auth";
import { SubmitButton } from "@/components/submit-button";
import { TournamentEditor, NewSectionForm } from "@/components/tournament-editor";
import { getTournamentData } from "@/lib/tournaments";
import { championOf } from "@/lib/bracket";

type AdminPageProps = {
  searchParams: Promise<{ error?: string; section?: string }>;
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
        <p>Sign in to add players and teams, publish brackets, and advance match winners.</p>
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
  const [user, params, tournamentData] = await Promise.all([
    getCurrentAdmin(),
    searchParams,
    getTournamentData(),
  ]);
  if (!user) return <LoginForm error={params.error} />;

  const { tournaments, matches } = tournamentData;
  const selected = tournaments.find(t => t.id === params.section) ?? tournaments[0];
  const published = tournaments.filter(t => t.bracket.rounds.length);
  const canEditLineup = user.role !== "RESULT_MANAGER";

  return <div className="organizer-page">
    <header className="dashboard-header"><div><span className="eyebrow">Sports Week Control Center</span><h1>Welcome, {user.name.split(" ")[0]}.</h1><p>{user.email} · Your changes are published to the website.</p></div><form action={logoutAction}><button className="dashboard-logout"><LogOut size={16} /> Sign out</button></form></header>
    <section className="dashboard-stats" aria-label="Tournament overview">
      <article><span><GitBranch /></span><div><b>{published.length}</b><small>Published brackets</small></div></article>
      <article><span><Users /></span><div><b>{tournaments.reduce((sum,t) => sum + t.bracket.entries.length,0)}</b><small>Players / teams</small></div></article>
      <article><span><CheckCircle2 /></span><div><b>{matches.filter(m => m.status === "completed").length}</b><small>Decided matches</small></div></article>
      <article><span><Trophy /></span><div><b>{tournaments.filter(t => championOf(t.bracket)).length}</b><small>Champions</small></div></article>
    </section>
    <div className="organizer-workspace">
      <aside className="section-sidebar"><h2>Tournament sections</h2><nav aria-label="Tournament sections">{tournaments.map(t => <Link key={t.id} href={`/admin?section=${t.id}`} aria-current={selected.id === t.id ? "page" : undefined}><strong>{t.title}</strong><small>{t.bracket.entries.length} entries · {championOf(t.bracket) ? "Completed" : t.bracket.rounds.length ? "Published" : "Add lineup"}</small></Link>)}</nav>{canEditLineup && <NewSectionForm />}</aside>
      <TournamentEditor key={selected.id} tournament={selected} canEditLineup={canEditLineup} />
    </div>
  </div>;
}
