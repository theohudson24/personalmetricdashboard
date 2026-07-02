export function InsightCard({ insights }: { insights: string[] }) {
  return (
    <div className="space-y-2">
      {insights.map((insight) => (
        <div
          key={insight}
          className="rounded-md border border-line bg-neutral-50 px-3 py-2 text-sm text-neutral-700"
        >
          {insight}
        </div>
      ))}
    </div>
  );
}
