import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  CalendarPlus,
  LogOut,
  Megaphone,
  Radio,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { loginAction, logoutAction } from "@/app/admin/actions";
import { getCurrentAdmin } from "@/lib/auth";
import { matches, sports } from "@/lib/data";
import { SubmitButton } from "@/components/submit-button";

type AdminPageProps = {
  searchParams: Promise<{ error?: string }>;
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
        <p>Sign in to view the organizer dashboard. Editing tools are coming soon.</p>
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
  const [user, params] = await Promise.all([getCurrentAdmin(), searchParams]);
  if (!user) return <LoginForm error={params.error} />;

  const liveCount = matches.filter((match) => match.status === "live").length;
  const completedCount = matches.filter((match) => match.status === "completed").length;

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">Sports Week Control Center</span>
          <h1>Welcome, {user.name.split(" ")[0]}.</h1>
          <p>{user.role.replaceAll("_", " ")} · {user.email}</p>
        </div>
        <form action={logoutAction}><button type="submit" className="dashboard-logout"><LogOut size={16} /> Sign out</button></form>
      </header>

      <section className="dashboard-stats">
        <article><span><Trophy /></span><div><b>{sports.length}</b><small>Active sports</small></div></article>
        <article><span><Users /></span><div><b>286</b><small>Participants</small></div></article>
        <article className="live"><span><Radio /></span><div><b>{liveCount}</b><small>Live matches</small></div></article>
        <article><span><Activity /></span><div><b>{completedCount}</b><small>Published results</small></div></article>
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-title"><div><span className="eyebrow">Quick actions</span><h2>What needs updating?</h2></div></div>
        <p className="result-count" id="editing-status">Preview mode. Editing tools are coming soon; the fixtures below are sample data.</p>
        <div className="quick-actions" aria-describedby="editing-status">
          <button disabled><CalendarPlus /><span><b>Create match</b><small>Coming soon</small></span></button>
          <button disabled><Trophy /><span><b>Publish result</b><small>Coming soon</small></span></button>
          <button disabled><Megaphone /><span><b>Announcement</b><small>Coming soon</small></span></button>
          <button disabled><Users /><span><b>Add participant</b><small>Coming soon</small></span></button>
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-title"><div><span className="eyebrow">Match overview</span><h2>Featured matches</h2></div><Link href="/schedule">View public schedule</Link></div>
        <div className="admin-match-list">
          {matches.slice(0, 4).map((match) => (
            <article key={match.id}>
              <span className={`admin-status ${match.status}`}>{match.status}</span>
              <div><b>{match.icon} {match.sport} · {match.round}</b><small>{match.participantA} vs {match.participantB}</small></div>
              <time>{match.time}</time>
              <Link className="admin-match-link" href={`/schedule?day=${match.day}&match=${match.id}#match-${match.id}`}>View match</Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
