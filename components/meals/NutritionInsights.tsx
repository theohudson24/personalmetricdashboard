import { InsightCard } from "@/components/shared/InsightCard";
import { Card, CardHeader } from "@/components/ui/Card";

export function NutritionInsights({ insights }: { insights: string[] }) {
  return (
    <Card>
      <CardHeader
        title="Nutrition insights"
        description="Simple rule-based feedback based on logged intake."
      />
      <InsightCard insights={insights} />
    </Card>
  );
}
