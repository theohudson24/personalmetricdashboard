import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatTile } from "@/components/shared/StatTile";
import type { SummaryItem } from "@/types/dashboard";

export function DailySummaryCard({
  items,
  completion,
}: {
  items: SummaryItem[];
  completion: number;
}) {
  return (
    <Card>
      <CardHeader
        title="Daily summary"
        description="A compact view of today's health and consistency signals."
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {items.map((item) => (
          <StatTile
            key={item.label}
            label={item.label}
            value={item.value}
            helper={item.helper}
            tone={item.missing ? "missing" : "default"}
          />
        ))}
      </div>
      <div className="mt-4">
        <ProgressBar value={completion} max={100} label={`${completion}% complete`} />
      </div>
    </Card>
  );
}
