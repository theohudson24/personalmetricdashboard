export default function Loading() {
  return <div className="animate-pulse" aria-label="Loading dashboard" role="status">
    <div className="mb-7 h-24 rounded-lg bg-white/[0.055]" />
    <div className="grid gap-5">
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5"><div className="h-5 w-40 rounded bg-white/10"/><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-48 rounded-lg bg-white/[0.06]"/>)}</div></div>
      <div className="h-80 rounded-lg border border-white/10 bg-white/[0.04]"/>
    </div>
    <span className="sr-only">Loading your daily status.</span>
  </div>;
}
