export function InsightCard({ insights }: { insights: string[] }) {
  return (
    <div className="space-y-2">
      {insights.map((insight) => (
        <div
          key={insight}
          className="rounded-md border border-line bg-black/15 px-3 py-2 text-sm text-muted"
        >
          {insight}
        </div>
      ))}
    </div>
  );
}
