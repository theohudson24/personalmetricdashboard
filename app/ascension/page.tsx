import { AscensionDashboard } from "@/components/ascension/AscensionDashboard";
import { PageHeader } from "@/components/layout/PageHeader";

export default function AscensionPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Personal optimization"
        title="Ascension"
        description="Optimize your body, mind, health, appearance, and lifestyle through clear scores and next actions."
      />
      <AscensionDashboard />
    </div>
  );
}
