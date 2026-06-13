export default function Loading() {
  return (
    <main className="route-loading" aria-label="Loading page" aria-busy="true">
      <div className="route-loading-bar" />
      <section className="route-loading-shell">
        <aside className="route-loading-sidebar">
          <span className="skeleton skeleton-brand" />
          {Array.from({ length: 9 }, (_, index) => (
            <span className="skeleton skeleton-nav" key={index} />
          ))}
        </aside>
        <div className="route-loading-content">
          <span className="skeleton skeleton-topbar" />
          <div className="route-loading-grid">
            {Array.from({ length: 8 }, (_, index) => (
              <span className="skeleton skeleton-card" key={index} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
