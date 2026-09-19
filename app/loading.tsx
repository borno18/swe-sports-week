export default function Loading() {
  return (
    <div className="page-shell route-loading" role="status" aria-label="Loading page">
      <span className="eyebrow">SWE Sports Week</span>
      <p>Loading the latest fixtures…</p>
      <div className="loading-line" />
      <div className="loading-cards" aria-hidden="true"><div /><div /><div /></div>
    </div>
  );
}
