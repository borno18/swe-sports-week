import type { Metadata } from "next";
import "./globals.css";
import "./tournaments.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LiveRefresh } from "@/components/live-refresh";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { getPublicRevision } from "@/lib/public-revision";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL("https://swe-sports-week.vercel.app"),
  title: "SWE Sports Week 2026 | SUST Software Engineering",
  description:
    "Official website of SWE Sports Week 2026, organized by SWE Society, SUST. View schedules, teams, fixtures, results and tournament updates.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SWE Sports Week 2026 | SUST Software Engineering",
    description:
      "Official website of SWE Sports Week 2026, organized by SWE Society, SUST. View schedules, teams, fixtures, results and tournament updates.",
    url: "https://swe-sports-week.vercel.app",
    siteName: "SWE Sports Week 2026",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SWE Sports Week 2026 | SUST Software Engineering",
    description:
      "Official website of SWE Sports Week 2026, organized by SWE Society, SUST. View schedules, teams, fixtures, results and tournament updates.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google51095d9edc59cf78",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  name: "SWE Sports Week 2026",
  alternateName: "Intra SWE Sports Week 2026",
  description:
    "Official website of SWE Sports Week 2026, organized by SWE Society, SUST. View schedules, teams, fixtures, results and tournament updates.",
  startDate: "2026-09-26T00:00:00+06:00",
  endDate: "2026-10-02T23:59:59+06:00",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  location: {
    "@type": "Place",
    name: "IICT, Shahjalal University of Science and Technology",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Kumargaon",
      addressLocality: "Sylhet",
      postalCode: "3114",
      addressCountry: "BD",
    },
  },
  organizer: {
    "@type": "Organization",
    name: "SWE Society, SUST",
    url: "https://swe-sports-week.vercel.app",
    sameAs: [
      "https://www.facebook.com/swesociety.sust",
    ],
  },
};

async function LiveUpdates() {
  return <LiveRefresh initialRevision={await getPublicRevision()} />;
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <SiteHeader />
        <Suspense fallback={null}><LiveUpdates /></Suspense>
        <main id="main-content" tabIndex={-1}>{children}</main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
