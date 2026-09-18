import type { Metadata } from "next";
import "./globals.css";
import "./tournaments.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getTournamentData } from "@/lib/tournaments";
import { LiveRefresh } from "@/components/live-refresh";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Intra SWE Sports Week 2026",
  description: "The live tournament hub for Intra SWE Sports Week, SUST.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { sports, matches } = await getTournamentData();
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <SiteHeader sports={sports} matches={matches} />
        <LiveRefresh />
        <main id="main-content" tabIndex={-1}>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
