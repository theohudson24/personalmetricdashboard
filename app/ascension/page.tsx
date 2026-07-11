import { Clock3, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

export default function AscensionPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Personal optimization"
        title="Ascension"
        description="A deeper personal optimization system is being prepared behind the scenes."
      />
      <Card className="overflow-hidden bg-gradient-to-br from-core/15 via-white/[0.055] to-growth/10">
        <div className="mx-auto flex max-w-2xl flex-col items-center py-12 text-center sm:py-20">
          <div className="grid h-16 w-16 place-items-center rounded-full border border-core/30 bg-core/10 text-core"><Sparkles size={28} /></div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-core">Feature coming soon</p>
          <h2 className="mt-2 text-3xl font-semibold">Ascension is evolving</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted">The scoring, goals, check-ins, metrics, and progress system are temporarily disconnected while secure cross-device persistence is completed and tested.</p>
          <div className="mt-6 flex items-center gap-2 rounded-md border border-line bg-black/15 px-4 py-3 text-sm text-muted"><Clock3 size={17} className="text-core" /> Available in a future update</div>
        </div>
      </Card>
    </div>
  );
}
