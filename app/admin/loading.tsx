export default function AdminLoading() {
  return <section className="page-shell route-loading" role="status" aria-live="polite">
    <span className="eyebrow">Control Center</span>
    <p>Loading your tournament workspace…</p>
    <div className="loading-line" aria-hidden="true" />
    <div className="loading-cards" aria-hidden="true"><div /><div /><div /></div>
  </section>;
}
