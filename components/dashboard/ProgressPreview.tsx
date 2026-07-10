import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/shared/StatTile";

type TrendDirection = "up" | "down" | "flat" | "none";

export function ProgressPreview({
  workoutCount,
  proteinValue,
  recentPr,
  weightTrend,
  weightTrendDirection,
}: {
  workoutCount: number;
  proteinValue: string;
  recentPr: string;
  weightTrend: string;
  weightTrendDirection: TrendDirection;
}) {
  const trendClass =
    weightTrendDirection === "up"
      ? "text-green-700"
      : weightTrendDirection === "down"
        ? "text-red-700"
        : "text-ink";

  return (
    <Card>
      <CardHeader
        title="Progress preview"
        description="A quick look at recent training and nutrition momentum."
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-md border border-line bg-black/15 p-3">
          <p className="text-xs text-muted">Weight trend</p>
          <p className={`mt-1 text-xl font-semibold ${trendClass}`}>{weightTrend}</p>
        </div>
        <StatTile label="Workout streak" value={`${workoutCount} this week`} />
        <StatTile label="Protein goal" value={proteinValue} />
        <StatTile label="Recent PR" value={recentPr} />
      </div>
    </Card>
  );
}
