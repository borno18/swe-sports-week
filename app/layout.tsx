import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Intra SWE Sports Week 2026",
  description: "The live tournament hub for Intra SWE Sports Week, SUST.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <SiteHeader />
        <main id="main-content" tabIndex={-1}>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
