import { InsightCard } from "@/components/shared/InsightCard";
import { Card, CardHeader } from "@/components/ui/Card";

export function TrainingInsights({ insights }: { insights: string[] }) {
  return (
    <Card>
      <CardHeader
        title="Growth and recovery suggestions"
        description="Basic rule-based training feedback for the MVP."
      />
      <InsightCard insights={insights} />
    </Card>
  );
}
