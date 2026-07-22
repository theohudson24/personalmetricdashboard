export function InsightCard({ insights }: { insights: string[] }) {
  return (
    <div className="space-y-2">
      {insights.map((insight) => (
        <div
          key={insight}
          className="border-l-2 border-core/50 py-2 pl-3 text-sm leading-6 text-muted"
        >
          {insight}
        </div>
      ))}
    </div>
  );
}
