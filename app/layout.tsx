import type { Metadata } from "next";
import "./globals.css";
import "./tournaments.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LiveRefresh } from "@/components/live-refresh";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Suspense } from "react";
import { getPublicRevision } from "@/lib/public-revision";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Intra SWE Sports Week 2026",
  description: "The live tournament hub for Intra SWE Sports Week, SUST.",
};

async function LiveUpdates() {
  return <LiveRefresh initialRevision={await getPublicRevision()} />;
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <SiteHeader />
        <Suspense fallback={null}><LiveUpdates /></Suspense>
        <main id="main-content" tabIndex={-1}>{children}</main>
        <SiteFooter />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
