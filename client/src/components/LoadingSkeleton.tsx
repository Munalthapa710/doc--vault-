export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="skeleton-table" aria-label="Loading records">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="skeleton-row" key={index}>
          <span />
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading details">
      <section className="page-header">
        <div className="skeleton-copy wide" />
        <div className="skeleton-icon" />
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </section>
      <section className="page-panel">
        <div className="skeleton-grid" />
      </section>
    </div>
  );
}
