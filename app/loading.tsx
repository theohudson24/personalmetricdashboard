export default function Loading() {
  return <div className="animate-pulse" aria-label="Loading dashboard" role="status">
    <div className="mb-7 h-24 rounded-lg bg-panel" />
    <div className="grid gap-5">
      <div className="rounded-product border border-line/70 bg-panel p-5"><div className="h-5 w-40 rounded bg-line/70"/><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-48 rounded-product bg-ink/[0.04]"/>)}</div></div>
      <div className="h-80 rounded-lg border border-line/70 bg-ink/[0.04]"/>
    </div>
    <span className="sr-only">Loading your daily status.</span>
  </div>;
}
