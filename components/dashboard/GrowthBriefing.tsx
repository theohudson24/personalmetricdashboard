import { Activity, Brain, Droplets, Flame, Target, Trophy } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";

function clamp(value: number) {
  return Math.max(0, Math.min(value, 100));
}

export function GrowthBriefing({
  completion,
  calories,
  calorieGoal,
  protein,
  proteinGoal,
  water,
  waterGoal,
  workoutComplete,
  sleepHours,
  energyLevel,
  recentPr,
}: {
  completion: number;
  calories: number;
  calorieGoal: number;
  protein: number;
  proteinGoal: number;
  water: number;
  waterGoal: number;
  workoutComplete: boolean;
  sleepHours: number | null;
  energyLevel: number | null;
  recentPr: string;
}) {
  const fuelScore = Math.round(
    (clamp((calories / Math.max(calorieGoal, 1)) * 100) +
      clamp((protein / Math.max(proteinGoal, 1)) * 100) +
      clamp((water / Math.max(waterGoal, 1)) * 100)) /
      3,
  );
  const recoveryScore = Math.round(
    ((sleepHours ? clamp((sleepHours / 8) * 100) : 45) +
      (energyLevel ? clamp((energyLevel / 5) * 100) : 45)) /
      2,
  );
  const trainingScore = workoutComplete ? 100 : 45;
  const levelScore = Math.round((completion + fuelScore + recoveryScore + trainingScore) / 4);
  const level = Math.max(1, Math.floor(levelScore / 10));

  const pillars = [
    { label: "Execution", value: completion, icon: Target },
    { label: "Fuel", value: fuelScore, icon: Flame },
    { label: "Recovery", value: recoveryScore, icon: Brain },
    { label: "Training", value: trainingScore, icon: Activity },
  ];

  const nextMove =
    completion < 70
      ? "Close the open tasks first. Consistency is the multiplier today."
      : fuelScore < 70
        ? "Fuel is the easiest upgrade right now. Push protein, water, or calories toward target."
        : recoveryScore < 70
          ? "Recovery is lagging. Protect sleep, reduce stress, and keep the next session precise."
          : workoutComplete
            ? "Training is logged. Bank the win and keep nutrition aligned for adaptation."
            : "You are set up well. A focused workout would convert today's readiness into progress.";

  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-[#0b100d] text-ink shadow-glow">
      <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative p-5 sm:p-6">
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-growth/20 blur-3xl" />
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-growth">
            Assistant Briefing
          </p>
          <div className="mt-6 flex items-end gap-4">
            <div>
              <p className="text-sm text-white/60">Current level</p>
              <p className="text-6xl font-semibold leading-none">Lv {level}</p>
            </div>
            <div className="pb-2">
              <p className="text-sm text-white/60">Growth charge</p>
              <p className="text-2xl font-semibold">{levelScore}%</p>
            </div>
          </div>
          <div className="mt-5">
            <ProgressBar value={levelScore} max={100} label="Today toward upgrade" />
          </div>
          <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.06] p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-growth">
              <Trophy size={16} />
              Next best move
            </div>
            <p className="text-sm leading-6 text-white/75">{nextMove}</p>
          </div>
        </div>

        <div className="grid gap-3 border-t border-white/10 bg-white/[0.04] p-5 sm:p-6 lg:border-l lg:border-t-0">
          <div className="grid gap-3 sm:grid-cols-2">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;

              return (
                <div key={pillar.label} className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Icon size={16} className="text-growth" />
                      {pillar.label}
                    </div>
                    <span className="text-sm text-white/60">{pillar.value}%</span>
                  </div>
                  <ProgressBar value={pillar.value} max={100} />
                </div>
              );
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <p className="text-xs text-white/50">Hydration</p>
              <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                <Droplets size={18} className="text-growth" />
                {water} oz
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <p className="text-xs text-white/50">Protein</p>
              <p className="mt-2 text-lg font-semibold">{Math.round(protein)}g</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <p className="text-xs text-white/50">Recent PR</p>
              <p className="mt-2 text-lg font-semibold">{recentPr}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
