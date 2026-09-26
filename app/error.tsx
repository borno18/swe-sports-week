"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section className="page-shell route-loading" role="alert">
    <span className="eyebrow">Connection interrupted</span>
    <h1>We couldn’t load this page.</h1>
    <p>Please try again to load the latest saved data.</p>
    <button className="button organizer-primary" onClick={reset}>Try again</button>
  </section>;
}
