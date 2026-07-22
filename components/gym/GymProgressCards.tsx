"use client";

import { useMemo, useState } from "react";
import { Activity, Crosshair, ShieldCheck, TrendingUp } from "lucide-react";
import { StatTile } from "@/components/shared/StatTile";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type {
  ExerciseProgressPoint,
  MuscleGroupVolumeEntry,
  WeeklyWorkoutPoint,
  WorkoutComparisonEntry,
  WorkoutVolumePoint,
} from "@/lib/workouts";
import { workoutChartScale } from "@/lib/workouts";

type MetricKey =
  | "weightLifted"
  | "estimatedOneRepMax"
  | "totalVolume"
  | "workoutsPerWeek"
  | "bodyWeight"
  | "volumeByMuscleGroup";
type PeriodKey = "7" | "30" | "90" | "180" | "all";
type ChartType = "line" | "bar";

type ChartPoint = {
  label: string;
  date?: string;
  value: number;
  detail?: string;
  personalRecord?: boolean;
};

const metricOptions: Array<{
  key: MetricKey;
  label: string;
  graphTitle: string;
  yAxisLabel: string;
  tooltipLabel: string;
  unit: string;
  chartType: ChartType;
  requiresExercise?: boolean;
}> = [
  {
    key: "weightLifted",
    label: "Weight lifted over time",
    graphTitle: "Weight lifted over time",
    yAxisLabel: "Weight lifted",
    tooltipLabel: "Weight",
    unit: "lb",
    chartType: "line",
    requiresExercise: true,
  },
  {
    key: "estimatedOneRepMax",
    label: "Estimated 1RM over time",
    graphTitle: "Estimated 1RM over time",
    yAxisLabel: "Estimated 1RM",
    tooltipLabel: "Estimated 1RM",
    unit: "lb",
    chartType: "line",
    requiresExercise: true,
  },
  {
    key: "totalVolume",
    label: "Total volume over time",
    graphTitle: "Total workout volume over time",
    yAxisLabel: "Total volume",
    tooltipLabel: "Volume",
    unit: "lb",
    chartType: "line",
  },
  {
    key: "workoutsPerWeek",
    label: "Workouts per week",
    graphTitle: "Workouts per week",
    yAxisLabel: "Completed workouts",
    tooltipLabel: "Workouts",
    unit: "workouts",
    chartType: "bar",
  },
  {
    key: "bodyWeight",
    label: "Body weight over time",
    graphTitle: "Body weight over time",
    yAxisLabel: "Body weight",
    tooltipLabel: "Body weight",
    unit: "lb",
    chartType: "line",
  },
  {
    key: "volumeByMuscleGroup",
    label: "Volume by muscle group",
    graphTitle: "Volume by muscle group",
    yAxisLabel: "Training volume",
    tooltipLabel: "Volume",
    unit: "lb",
    chartType: "bar",
  },
];

const periodOptions: Array<{ key: PeriodKey; label: string }> = [
  { key: "7", label: "7 days" },
  { key: "30", label: "1 month" },
  { key: "90", label: "3 months" },
  { key: "180", label: "6 months" },
  { key: "all", label: "All time" },
];

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatValue(value: number, unit: string) {
  if (unit === "workouts") {
    return `${Math.round(value)} workouts`;
  }

  return `${Math.round(value).toLocaleString()} ${unit}`;
}

function filterByPeriod<T extends { date?: string }>(
  points: T[],
  selectedPeriod: PeriodKey,
) {
  const datedPoints = points.filter((point) => point.date);

  if (selectedPeriod === "all" || datedPoints.length === 0) {
    return points;
  }

  const latestTime = Math.max(
    ...datedPoints.map((point) => new Date(point.date as string).getTime()),
  );
  const cutoff = latestTime - Number(selectedPeriod) * 24 * 60 * 60 * 1000;

  return points.filter(
    (point) => !point.date || new Date(point.date).getTime() >= cutoff,
  );
}

function trendValue(points: ChartPoint[], unit: string) {
  if (points.length < 2) {
    return "--";
  }

  const first = points[0].value;
  const last = points[points.length - 1].value;
  const change = last - first;
  const percent = first > 0 ? (change / first) * 100 : 0;

  return `${change >= 0 ? "+" : ""}${formatValue(change, unit)} / ${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%`;
}

function buildChartGeometry(
  points: ChartPoint[],
  width: number,
  height: number,
  padding: { left: number; right: number; top: number; bottom: number },
) {
  if (points.length === 0) {
    return { path: "", coordinates: [], min: 0, max: 5, ticks: [0, 5] };
  }

  const values = points.map((point) => point.value);
  const { min, max, ticks } = workoutChartScale(values);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const coordinates = points.map((point, index) => {
    const x =
      padding.left +
      (points.length === 1 ? chartWidth / 2 : (index / (points.length - 1)) * chartWidth);
    const y =
      padding.top +
      chartHeight -
      ((point.value - min) / Math.max(max - min, 1)) * chartHeight;

    return { x, y, point };
  });

  return {
    path: coordinates.reduce((path, coordinate, index) => {
      if (index === 0) return `M ${coordinate.x.toFixed(2)} ${coordinate.y.toFixed(2)}`;
      const previous = coordinates[index - 1];
      const midpointX = (previous.x + coordinate.x) / 2;
      return `${path} C ${midpointX.toFixed(2)} ${previous.y.toFixed(2)}, ${midpointX.toFixed(2)} ${coordinate.y.toFixed(2)}, ${coordinate.x.toFixed(2)} ${coordinate.y.toFixed(2)}`;
    }, ""),
    coordinates,
    min,
    max,
    ticks,
  };
}

function aggregateMuscleGroupVolume(entries: MuscleGroupVolumeEntry[]) {
  const totals = new Map<string, number>();

  for (const entry of entries) {
    const muscleGroup = entry.muscleGroup || "Uncategorized";
    totals.set(muscleGroup, (totals.get(muscleGroup) ?? 0) + entry.value);
  }

  return Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
}

function normalizeMuscleGroup(label: string) {
  const value = label.toLowerCase();

  if (value.includes("chest") || value.includes("pec")) return "Chest";
  if (value.includes("trap")) return "Traps";
  if (value.includes("back") || value.includes("lat")) return "Back";
  if (value.includes("shoulder") || value.includes("delt")) return "Shoulders";
  if (value.includes("bicep") || value.includes("tricep") || value.includes("arm")) return "Arms";
  if (value.includes("quad")) return "Quads";
  if (value.includes("hamstring") || value.includes("glute")) return "Posterior Chain";
  if (value.includes("leg")) return "Legs";
  if (value.includes("calf")) return "Calves";
  if (value.includes("core") || value.includes("abs")) return "Core";

  return label || "Uncategorized";
}

function muscleRecommendation(label: string, intensity: number) {
  if (intensity >= 82) {
    return `${label} is highly trained in this window. Keep the stimulus sharp and protect recovery.`;
  }

  if (intensity >= 52) {
    return `${label} has solid momentum. Add one focused progression set to push the next upgrade.`;
  }

  if (intensity > 0) {
    return `${label} is active but underfed with volume. Add targeted accessory work soon.`;
  }

  return `${label} has no logged volume here. Schedule direct work to keep your build balanced.`;
}

export function GymProgressCards({
  exercisePoints,
  workoutVolumePoints,
  weeklyWorkoutPoints,
  bodyWeightPoints,
  muscleGroupVolumeEntries,
  workoutComparisons,
}: {
  exercisePoints: ExerciseProgressPoint[];
  workoutVolumePoints: WorkoutVolumePoint[];
  weeklyWorkoutPoints: WeeklyWorkoutPoint[];
  bodyWeightPoints: ChartPoint[];
  muscleGroupVolumeEntries: MuscleGroupVolumeEntry[];
  workoutComparisons: WorkoutComparisonEntry[];
}) {
  const exerciseNames = useMemo(() => {
    const counts = new Map<string, number>();

    for (const point of exercisePoints) {
      counts.set(point.exerciseName, (counts.get(point.exerciseName) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name]) => name);
  }, [exercisePoints]);

  const [selectedExercise, setSelectedExercise] = useState(exerciseNames[0] ?? "");
  const [selectedMetric, setSelectedMetric] =
    useState<MetricKey>("weightLifted");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>("all");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(workoutComparisons[0]?.id ?? "");

  const selectedMetricOption =
    metricOptions.find((option) => option.key === selectedMetric) ?? metricOptions[0];
  const requiresExercise = Boolean(selectedMetricOption.requiresExercise);

  const chartPoints = useMemo<ChartPoint[]>(() => {
    if (selectedMetric === "weightLifted") {
      return filterByPeriod(
        exercisePoints
          .filter((point) => point.exerciseName === selectedExercise)
          .map((point) => ({
            date: point.date,
            label: formatShortDate(point.date),
            value: point.topWeight,
            detail: point.workoutName,
            personalRecord: point.personalRecords.includes("TOP_WEIGHT"),
          })),
        selectedPeriod,
      );
    }

    if (selectedMetric === "estimatedOneRepMax") {
      return filterByPeriod(
        exercisePoints
          .filter((point) => point.exerciseName === selectedExercise)
          .map((point) => ({
            date: point.date,
            label: formatShortDate(point.date),
            value: point.estimatedOneRepMax,
            detail: point.workoutName,
            personalRecord: point.personalRecords.includes("ESTIMATED_1RM"),
          })),
        selectedPeriod,
      );
    }

    if (selectedMetric === "totalVolume") {
      return filterByPeriod(
        workoutVolumePoints.map((point) => ({
          date: point.date,
          label: formatShortDate(point.date),
          value: point.value,
          detail: point.label,
        })),
        selectedPeriod,
      );
    }

    if (selectedMetric === "workoutsPerWeek") {
      return filterByPeriod(
        weeklyWorkoutPoints.map((point) => ({
          date: point.date,
          label: point.label,
          value: point.value,
        })),
        selectedPeriod,
      );
    }

    if (selectedMetric === "bodyWeight") {
      return filterByPeriod(bodyWeightPoints, selectedPeriod);
    }

    return aggregateMuscleGroupVolume(
      filterByPeriod(muscleGroupVolumeEntries, selectedPeriod),
    );
  }, [
    bodyWeightPoints,
    exercisePoints,
    muscleGroupVolumeEntries,
    selectedExercise,
    selectedMetric,
    selectedPeriod,
    weeklyWorkoutPoints,
    workoutVolumePoints,
  ]);

  const chart = buildChartGeometry(chartPoints, 760, 300, {
    left: 64,
    right: 24,
    top: 24,
    bottom: 48,
  });
  const latest = chartPoints[chartPoints.length - 1];
  const best = chartPoints.reduce<ChartPoint | null>((current, point) => {
    if (!current || point.value > current.value) {
      return point;
    }

    return current;
  }, null);
  const hoveredCoordinate =
    hoveredPointIndex !== null ? chart.coordinates[hoveredPointIndex] : undefined;
  const hasAnyData =
    exercisePoints.length > 0 ||
    workoutVolumePoints.length > 0 ||
    weeklyWorkoutPoints.length > 0 ||
    bodyWeightPoints.length > 0 ||
    muscleGroupVolumeEntries.length > 0;
  const muscleTotals = useMemo(() => {
    const totals = new Map<string, number>();

    for (const entry of filterByPeriod(muscleGroupVolumeEntries, selectedPeriod)) {
      const label = normalizeMuscleGroup(entry.muscleGroup);
      totals.set(label, (totals.get(label) ?? 0) + entry.value);
    }

    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));
  }, [muscleGroupVolumeEntries, selectedPeriod]);
  const maxMuscleVolume = Math.max(...muscleTotals.map((entry) => entry.value), 1);
  const muscleIndex = new Map(muscleTotals.map((entry) => [entry.label, entry.value]));
  const focusMuscle = selectedMuscle ?? hoveredMuscle;
  const focusVolume = focusMuscle ? (muscleIndex.get(focusMuscle) ?? 0) : 0;
  const focusIntensity = Math.round((focusVolume / maxMuscleVolume) * 100);
  const totalMuscleVolume = muscleTotals.reduce((total, entry) => total + entry.value, 0);
  const focusShare =
    totalMuscleVolume > 0 ? Math.round((focusVolume / totalMuscleVolume) * 100) : 0;
  const focusRank =
    focusMuscle && muscleTotals.findIndex((entry) => entry.label === focusMuscle) >= 0
      ? muscleTotals.findIndex((entry) => entry.label === focusMuscle) + 1
      : null;
  const focusExercisePoints = filterByPeriod(
    focusMuscle
      ? exercisePoints.filter((point) => normalizeMuscleGroup(point.muscleGroup) === focusMuscle)
      : [],
    selectedPeriod,
  );
  const focusExerciseStats = Array.from(
    focusExercisePoints.reduce<
      Map<string, { volume: number; bestOneRepMax: number; topWeight: number; sessions: number }>
    >((stats, point) => {
      const current = stats.get(point.exerciseName) ?? {
        volume: 0,
        bestOneRepMax: 0,
        topWeight: 0,
        sessions: 0,
      };

      current.volume += point.volume;
      current.bestOneRepMax = Math.max(current.bestOneRepMax, point.estimatedOneRepMax);
      current.topWeight = Math.max(current.topWeight, point.topWeight);
      current.sessions += 1;
      stats.set(point.exerciseName, current);
      return stats;
    }, new Map()),
  )
    .sort((a, b) => b[1].volume - a[1].volume)
    .map(([name, values]) => ({ name, ...values }));
  const focusBestExercise = focusExerciseStats[0];
  const bodyMuscleGroups = [
    "Back",
    "Traps",
    "Arms",
    "Chest",
    "Core",
    "Shoulders",
    "Legs",
    "Calves",
  ];
  const trainedBodyMuscleCount = bodyMuscleGroups.filter(
    (label) => (muscleIndex.get(label) ?? 0) > 0,
  ).length;
  const balanceScore = Math.round(
    bodyMuscleGroups.length > 0
      ? (trainedBodyMuscleCount / bodyMuscleGroups.length) * 100
      : 0,
  );
  const topMuscle = muscleTotals[0];
  const loggedBodyMuscles = bodyMuscleGroups
    .map((label) => ({ label, value: muscleIndex.get(label) ?? 0 }))
    .sort((a, b) => a.value - b.value);
  const improvementTarget =
    loggedBodyMuscles.find((entry) => entry.value === 0) ?? loggedBodyMuscles[0];
  const summarySuggestion =
    balanceScore < 70
      ? `Bring ${improvementTarget.label} into the plan next so your training profile stays balanced.`
      : topMuscle
        ? `${topMuscle.label} is leading your current training. Maintain it while rotating attention to lower-volume areas.`
        : "Log a few sessions to build a useful body summary.";
  const muscleRegions = [
    {
      label: "Traps",
      d: "M146 88 C158 83 169 88 180 103 C191 88 202 83 214 88 C217 101 211 113 201 119 C191 114 185 108 180 101 C175 108 169 114 159 119 C149 113 143 101 146 88Z",
    },
    {
      label: "Shoulders",
      d: "M108 108 C119 93 139 92 156 109 C169 102 191 102 204 109 C221 92 241 93 252 108 C242 127 221 131 204 119 C189 127 171 127 156 119 C139 131 118 127 108 108Z",
    },
    {
      label: "Back",
      d: "M121 119 C141 105 161 111 180 130 C199 111 219 105 239 119 C236 157 225 205 210 259 C199 272 161 272 150 259 C135 205 124 157 121 119Z",
    },
    {
      label: "Chest",
      d: "M122 129 C142 112 162 117 180 131 C198 117 218 112 238 129 C234 158 211 176 182 166 C152 176 126 158 122 129Z",
    },
    {
      label: "Core",
      d: "M145 171 C156 164 169 166 180 174 C191 166 204 164 215 171 C221 202 216 235 205 264 C192 274 168 274 155 264 C144 235 139 202 145 171Z",
    },
    {
      label: "Arms",
      d: "M94 133 C111 126 124 136 124 158 C120 193 114 229 104 259 C93 262 82 257 78 246 C80 211 83 171 94 133Z",
    },
    {
      label: "Arms",
      d: "M266 133 C249 126 236 136 236 158 C240 193 246 229 256 259 C267 262 278 257 282 246 C280 211 277 171 266 133Z",
    },
    {
      label: "Legs",
      d: "M130 271 C145 266 163 272 171 291 C172 329 168 372 158 421 C145 427 132 419 129 403 C127 361 126 313 130 271Z",
    },
    {
      label: "Legs",
      d: "M230 271 C215 266 197 272 189 291 C188 329 192 372 202 421 C215 427 228 419 231 403 C233 361 234 313 230 271Z",
    },
    {
      label: "Calves",
      d: "M134 418 C146 412 158 419 161 438 C159 467 155 493 149 512 C139 516 130 510 130 498 C128 472 129 443 134 418Z",
    },
    {
      label: "Calves",
      d: "M226 418 C214 412 202 419 199 438 C201 467 205 493 211 512 C221 516 230 510 230 498 C232 472 231 443 226 418Z",
    },
  ];

  function muscleFill(label: string) {
    const value = muscleIndex.get(label) ?? 0;
    const intensity = value / maxMuscleVolume;

    if (focusMuscle && label === focusMuscle) {
      return selectedMuscle ? "rgba(224,154,85,0.48)" : "rgba(164,207,111,0.46)";
    }
    if (intensity >= 0.75) return "rgba(38,104,95,0.44)";
    if (intensity >= 0.4) return "rgba(122,168,79,0.38)";
    if (intensity > 0) return "rgba(159,191,122,0.32)";
    return "rgba(216,209,193,0.12)";
  }

  function muscleStroke(label: string) {
    const value = muscleIndex.get(label) ?? 0;

    if (focusMuscle && label === focusMuscle) return "#ffffff";
    if (value > 0) return "rgba(255,255,255,0.56)";
    return "rgba(255,255,255,0.2)";
  }
  const selectedWorkoutComparison =
    workoutComparisons.find((workout) => workout.id === selectedWorkoutId) ??
    workoutComparisons[0];
  const improvingExercises =
    selectedWorkoutComparison?.exerciseComparisons.filter(
      (exercise) =>
        (exercise.volumeDelta ?? 0) > 0 ||
        (exercise.topWeightDelta ?? 0) > 0 ||
        (exercise.oneRepMaxDelta ?? 0) > 0,
    ).length ?? 0;

  function formatDelta(value: number | null, unit = "lb") {
    if (value === null) {
      return "No prior";
    }

    return `${value >= 0 ? "+" : ""}${Math.round(value).toLocaleString()} ${unit}`;
  }

  return (
    <Card>
      <CardHeader
        title="Training evolution"
        description="Use the body map to inspect training balance, then drill into detailed progress metrics."
      />

      {!hasAnyData ? (
        <EmptyState title="Build your first progress baseline" message="Log a workout or body-weight measurement. Your charts will begin with your own first record." />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="overflow-hidden rounded-product border border-line/70 bg-panel p-4 text-ink shadow-soft">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-growth">
                    Body System
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">Muscle focus map</h3>
                </div>
                <div className="rounded-md border border-line/70 bg-ink/[0.04] px-3 py-2 text-right">
                  <p className="text-xs text-muted">Balance</p>
                  <p className="text-lg font-semibold">{balanceScore}%</p>
                </div>
              </div>

              <div className="flex justify-center">
                <svg
                  viewBox="0 0 360 540"
                  role="img"
                  aria-label="Interactive muscle group training volume map"
                  className="h-[430px] w-full max-w-[430px]"
                >
                  <defs>
                    <linearGradient id="progressArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(var(--color-core))" stopOpacity="0.34" />
                      <stop offset="100%" stopColor="rgb(var(--color-core))" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <defs>
                    <filter id="muscleGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <image
                    href="/images/anatomical-muscle-map-transparent.png"
                    x="52"
                    y="8"
                    width="256"
                    height="540"
                    preserveAspectRatio="xMidYMid meet"
                  />
                  {[...muscleRegions]
                    .sort((a, b) => Number(a.label === focusMuscle) - Number(b.label === focusMuscle))
                    .map((region, index) => {
                    const active = region.label === focusMuscle;

                    return (
                      <path
                        key={`${region.label}-${index}`}
                        d={region.d}
                        fill={muscleFill(region.label)}
                        opacity={active ? 1 : 0.84}
                        stroke={muscleStroke(region.label)}
                        strokeWidth={active ? 3 : 1.4}
                        filter={active ? "url(#muscleGlow)" : undefined}
                        className="cursor-pointer mix-blend-screen outline-none transition"
                        onMouseEnter={() => setHoveredMuscle(region.label)}
                        onMouseLeave={() => setHoveredMuscle(null)}
                        onFocus={() => setHoveredMuscle(region.label)}
                        onBlur={() => setHoveredMuscle(null)}
                        onClick={() => setSelectedMuscle(region.label)}
                        tabIndex={0}
                      >
                        <title>
                          {`${region.label}: ${formatValue(muscleIndex.get(region.label) ?? 0, "lb")}`}
                        </title>
                      </path>
                    );
                  })}
                  <path
                    d="M180 120 C151 155 145 219 152 270 C157 302 203 302 208 270 C215 219 209 155 180 120Z"
                    fill="none"
                    stroke="rgba(255,255,255,0.28)"
                    strokeWidth="2"
                  />
                  <text x="180" y="526" textAnchor="middle" className="fill-white/55 text-[12px]">
                    Click a muscle group for detail.
                  </text>
                </svg>
              </div>
            </div>

            <div className="rounded-lg border border-line bg-ink/[0.025] p-4">
              {selectedMuscle ? (
                <div>
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Crosshair size={18} className="text-core" />
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-core">
                          Muscle Detail
                        </p>
                      </div>
                      <h3 className="text-3xl font-semibold">{selectedMuscle}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedMuscle(null)}
                      className="rounded-md border border-line bg-ink/[0.04] px-3 py-2 text-xs font-semibold text-muted transition hover:border-core/40 hover:text-ink"
                    >
                      Return to body summary
                    </button>
                  </div>

                  <p className="text-sm leading-6 text-muted">
                    {muscleRecommendation(selectedMuscle, focusIntensity)}
                  </p>

                  <div className="mt-5">
                    <ProgressBar
                      value={focusIntensity}
                      max={100}
                      label={`${focusIntensity}% of top muscle volume`}
                    />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-md border border-line bg-ink/[0.025] p-3">
                      <Activity size={16} className="mb-2 text-growth" />
                      <p className="text-xs text-muted">Volume</p>
                      <p className="mt-1 text-lg font-semibold">{formatValue(focusVolume, "lb")}</p>
                    </div>
                    <div className="rounded-md border border-line bg-ink/[0.025] p-3">
                      <ShieldCheck size={16} className="mb-2 text-growth" />
                      <p className="text-xs text-muted">Share</p>
                      <p className="mt-1 text-lg font-semibold">{focusShare}%</p>
                    </div>
                    <div className="rounded-md border border-line bg-ink/[0.025] p-3">
                      <TrendingUp size={16} className="mb-2 text-growth" />
                      <p className="text-xs text-muted">Rank</p>
                      <p className="mt-1 text-lg font-semibold">
                        {focusRank ? `#${focusRank}` : "--"}
                      </p>
                    </div>
                    <div className="rounded-md border border-line bg-ink/[0.025] p-3">
                      <Crosshair size={16} className="mb-2 text-growth" />
                      <p className="text-xs text-muted">Exercises</p>
                      <p className="mt-1 text-lg font-semibold">{focusExerciseStats.length}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-md border border-line bg-ink/[0.025] p-3">
                      <p className="text-sm font-semibold">Top movement</p>
                      {focusBestExercise ? (
                        <div className="mt-3 space-y-2 text-sm text-muted">
                          <div className="flex justify-between gap-3">
                            <span>{focusBestExercise.name}</span>
                            <span>{formatValue(focusBestExercise.volume, "lb")}</span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span>Best estimated 1RM</span>
                            <span>{formatValue(focusBestExercise.bestOneRepMax, "lb")}</span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span>Top logged weight</span>
                            <span>{formatValue(focusBestExercise.topWeight, "lb")}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-muted">No exercise history in this window.</p>
                      )}
                    </div>

                    <div className="rounded-md border border-line bg-ink/[0.025] p-3">
                      <p className="text-sm font-semibold">Exercise breakdown</p>
                      <div className="mt-3 space-y-2">
                        {focusExerciseStats.length > 0 ? (
                          focusExerciseStats.slice(0, 5).map((exercise) => (
                            <div key={exercise.name}>
                              <div className="mb-1 flex justify-between gap-3 text-xs text-muted">
                                <span>{exercise.name}</span>
                                <span>{formatValue(exercise.volume, "lb")}</span>
                              </div>
                              <ProgressBar
                                value={exercise.volume}
                                max={Math.max(focusBestExercise?.volume ?? 1, 1)}
                              />
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted">No movements to summarize yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <Crosshair size={18} className="text-core" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-core">
                        Body Summary
                      </p>
                      <h3 className="mt-1 text-2xl font-semibold">Full body breakdown</h3>
                    </div>
                  </div>

                  <p className="text-sm leading-6 text-muted">
                    {summarySuggestion}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-md border border-line bg-ink/[0.025] p-3">
                      <Activity size={16} className="mb-2 text-growth" />
                      <p className="text-xs text-muted">Total volume</p>
                      <p className="mt-1 text-lg font-semibold">
                        {formatValue(totalMuscleVolume, "lb")}
                      </p>
                    </div>
                    <div className="rounded-md border border-line bg-ink/[0.025] p-3">
                      <ShieldCheck size={16} className="mb-2 text-growth" />
                      <p className="text-xs text-muted">Balance</p>
                      <p className="mt-1 text-lg font-semibold">{balanceScore}%</p>
                    </div>
                    <div className="rounded-md border border-line bg-ink/[0.025] p-3">
                      <TrendingUp size={16} className="mb-2 text-growth" />
                      <p className="text-xs text-muted">Top group</p>
                      <p className="mt-1 text-lg font-semibold">{topMuscle?.label ?? "--"}</p>
                    </div>
                    <div className="rounded-md border border-line bg-ink/[0.025] p-3">
                      <Crosshair size={16} className="mb-2 text-growth" />
                      <p className="text-xs text-muted">Improve next</p>
                      <p className="mt-1 text-lg font-semibold">{improvementTarget.label}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-md border border-line bg-ink/[0.025] p-3">
                      <p className="text-sm font-semibold">Current muscle distribution</p>
                      <div className="mt-3 space-y-3">
                        {(muscleTotals.length > 0 ? muscleTotals : [{ label: "No muscle data", value: 0 }]).slice(0, 6).map((entry) => {
                          const intensity = Math.round((entry.value / maxMuscleVolume) * 100);

                          return (
                            <div
                              key={entry.label}
                              onMouseEnter={() => setHoveredMuscle(entry.label)}
                              onMouseLeave={() => setHoveredMuscle(null)}
                            >
                              <div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted">
                                <span>{entry.label}</span>
                                <span>{formatValue(entry.value, "lb")}</span>
                              </div>
                              <ProgressBar value={intensity} max={100} />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-md border border-line bg-ink/[0.025] p-3">
                      <p className="text-sm font-semibold">Suggestions</p>
                      <div className="mt-3 space-y-3 text-sm leading-6 text-muted">
                        <p>
                          Click a muscle group on the character to inspect your exercise history and best lifts for that area.
                        </p>
                        <p>
                          Active groups: {trainedBodyMuscleCount} of {bodyMuscleGroups.length}.
                          Current window:{" "}
                          {periodOptions.find((option) => option.key === selectedPeriod)?.label}.
                        </p>
                        <p>
                          {improvementTarget.value === 0
                            ? `${improvementTarget.label} has no logged direct volume in this window.`
                            : `${improvementTarget.label} is the lowest-volume body group in this window.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-ink/[0.025] p-4">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-core">
                  Workout Comparison
                </p>
                <h3 className="mt-1 text-xl font-semibold">Session progression</h3>
                <p className="mt-1 max-w-2xl text-sm text-muted">
                  Pick a logged workout to compare it with the most recent earlier workout that used the same name.
                </p>
              </div>
              {workoutComparisons.length > 0 ? (
                <label className="min-w-72">
                  <span className="mb-1.5 block text-sm font-medium text-ink">
                    Workout day
                  </span>
                  <select
                    value={selectedWorkoutComparison?.id ?? ""}
                    onChange={(event) => setSelectedWorkoutId(event.target.value)}
                    className="min-h-11 w-full rounded-md border border-line bg-ink/[0.04] px-3 text-sm text-ink transition focus:border-core"
                  >
                    {workoutComparisons.map((workout) => (
                      <option key={workout.id} value={workout.id}>
                        {workout.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            {!selectedWorkoutComparison ? (
              <EmptyState title="No comparable sessions yet" message="Log the same workout at least twice, or import your Strong history, to compare progression." />
            ) : (
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-md border border-line bg-ink/[0.025] p-3">
                    <p className="text-xs text-muted">Selected workout</p>
                    <p className="mt-1 text-lg font-semibold">{selectedWorkoutComparison.name}</p>
                    <p className="mt-1 text-xs text-muted">
                      {formatShortDate(selectedWorkoutComparison.date)}
                    </p>
                  </div>
                  <div className="rounded-md border border-line bg-ink/[0.025] p-3">
                    <p className="text-xs text-muted">Total volume</p>
                    <p className="mt-1 text-lg font-semibold">
                      {formatValue(selectedWorkoutComparison.volume, "lb")}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {formatDelta(selectedWorkoutComparison.volumeDelta)}
                    </p>
                  </div>
                  <div className="rounded-md border border-line bg-ink/[0.025] p-3">
                    <p className="text-xs text-muted">Volume change</p>
                    <p className="mt-1 text-lg font-semibold">
                      {selectedWorkoutComparison.volumeDeltaPercent === null
                        ? "No prior"
                        : `${selectedWorkoutComparison.volumeDeltaPercent >= 0 ? "+" : ""}${selectedWorkoutComparison.volumeDeltaPercent.toFixed(1)}%`}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Versus {selectedWorkoutComparison.previous?.label ?? "no prior matching workout"}
                    </p>
                  </div>
                  <div className="rounded-md border border-line bg-ink/[0.025] p-3">
                    <p className="text-xs text-muted">Improved lifts</p>
                    <p className="mt-1 text-lg font-semibold">
                      {improvingExercises} / {selectedWorkoutComparison.exerciseComparisons.length}
                    </p>
                    <p className="mt-1 text-xs text-muted">Volume, top weight, or estimated 1RM</p>
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  {selectedWorkoutComparison.exerciseComparisons.map((exercise) => {
                    const liftImproved =
                      (exercise.volumeDelta ?? 0) > 0 ||
                      (exercise.topWeightDelta ?? 0) > 0 ||
                      (exercise.oneRepMaxDelta ?? 0) > 0;

                    return (
                      <div
                        key={exercise.name}
                        className={`rounded-md border p-3 ${
                          liftImproved ? "border-core/40 bg-core/10" : "border-line bg-ink/[0.025]"
                        }`}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{exercise.name}</p>
                            <p className="text-xs text-muted">
                              {exercise.previousVolume === null
                                ? "No matching exercise in prior session"
                                : "Compared to prior matching exercise"}
                            </p>
                          </div>
                          <span className={`text-xs font-semibold ${liftImproved ? "text-core" : "text-muted"}`}>
                            {liftImproved ? "Improved" : "Flat / lower"}
                          </span>
                        </div>
                        <div className="grid gap-2 text-sm text-muted sm:grid-cols-3">
                          <div>
                            <p className="text-xs">Volume</p>
                            <p className="font-semibold text-ink">
                              {formatValue(exercise.currentVolume, "lb")}
                            </p>
                            <p className="text-xs">{formatDelta(exercise.volumeDelta)}</p>
                          </div>
                          <div>
                            <p className="text-xs">Top weight</p>
                            <p className="font-semibold text-ink">
                              {formatValue(exercise.currentTopWeight, "lb")}
                            </p>
                            <p className="text-xs">{formatDelta(exercise.topWeightDelta)}</p>
                          </div>
                          <div>
                            <p className="text-xs">Est. 1RM</p>
                            <p className="font-semibold text-ink">
                              {formatValue(exercise.currentOneRepMax, "lb")}
                            </p>
                            <p className="text-xs">{formatDelta(exercise.oneRepMaxDelta)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-base font-semibold">{selectedMetricOption.graphTitle}</h3>
            <p className="mt-1 text-sm text-muted">Detailed chart controls and historical trend inspection.</p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
            {requiresExercise ? (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">
                  Exercise
                </span>
                <select
                  value={selectedExercise}
                  onChange={(event) => setSelectedExercise(event.target.value)}
                  className="min-h-11 w-full rounded-md border border-line bg-ink/[0.04] px-3 text-sm text-ink transition focus:border-core"
                >
                  {exerciseNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="hidden lg:block" />
            )}

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                Metric
              </span>
              <select
                value={selectedMetric}
                onChange={(event) => setSelectedMetric(event.target.value as MetricKey)}
                className="min-h-11 w-full rounded-md border border-line bg-ink/[0.04] px-3 text-sm text-ink transition focus:border-core"
              >
                {metricOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                Period
              </span>
              <select
                value={selectedPeriod}
                onChange={(event) => setSelectedPeriod(event.target.value as PeriodKey)}
                className="min-h-11 w-full rounded-md border border-line bg-ink/[0.04] px-3 text-sm text-ink transition focus:border-core"
              >
                {periodOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {chartPoints.length === 0 ? (
            <EmptyState title="No data in this view" message="Choose another metric or time period, or add the corresponding measurement to begin tracking it." />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <StatTile
                  label="Latest"
                  value={formatValue(latest.value, selectedMetricOption.unit)}
                  helper={latest.date ? formatShortDate(latest.date) : latest.label}
                />
                <StatTile
                  label="Best"
                  value={best ? formatValue(best.value, selectedMetricOption.unit) : "--"}
                  helper={best?.date ? formatShortDate(best.date) : best?.label}
                />
                <StatTile
                  label="Trend"
                  value={trendValue(chartPoints, selectedMetricOption.unit)}
                  helper={`${chartPoints.length} points`}
                />
                <StatTile
                  label="Y-axis"
                  value={selectedMetricOption.yAxisLabel}
                  helper={selectedMetricOption.chartType === "bar" ? "Bar chart" : "Line chart"}
                />
              </div>

              <div className="overflow-hidden rounded-md border border-line bg-ink/[0.04]">
                <svg
                  viewBox="0 0 760 300"
                  role="img"
                  aria-label={`${selectedMetricOption.graphTitle}: ${selectedMetricOption.yAxisLabel}`}
                  className="h-80 w-full bg-[#111814]"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="workoutProgressArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(var(--color-core))" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="rgb(var(--color-core))" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <text
                    x="16"
                    y="154"
                    transform="rotate(-90 16 154)"
                    textAnchor="middle"
                    className="fill-neutral-500 text-[11px]"
                  >
                    {selectedMetricOption.yAxisLabel}
                  </text>

                  {[...chart.ticks].reverse().map((value) => {
                    const y = 24 + ((chart.max - value) / Math.max(chart.max - chart.min, 1)) * (300 - 24 - 48);

                    return (
                      <g key={value}>
                        <line
                          x1="64"
                          x2="736"
                          y1={y}
                          y2={y}
                          stroke="#2a352e"
                          strokeWidth="1"
                        />
                        <text
                          x="54"
                          y={y + 4}
                          textAnchor="end"
                          className="fill-neutral-500 text-[11px]"
                        >
                          {value.toLocaleString()}
                        </text>
                      </g>
                    );
                  })}

                  {selectedMetricOption.chartType === "line" && chartPoints.length > 1 ? (
                    <>
                      <path d={`${chart.path} L ${chart.coordinates.at(-1)?.x} 252 L ${chart.coordinates[0].x} 252 Z`} fill="url(#workoutProgressArea)" />
                      <path d={chart.path} fill="none" stroke="rgb(var(--color-core))" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                      {chart.coordinates.slice(1).map((coordinate, index) => {
                        const previous = chart.coordinates[index];
                        const change = coordinate.point.value - previous.point.value;
                        const midpointX = (previous.x + coordinate.x) / 2;
                        return <path key={`${coordinate.point.label}-${index}-segment`} d={`M ${previous.x} ${previous.y} C ${midpointX} ${previous.y}, ${midpointX} ${coordinate.y}, ${coordinate.x} ${coordinate.y}`} fill="none" stroke={change > 0 ? "#a4cf6f" : change < 0 ? "#e06464" : "#eabf69"} strokeWidth="3" strokeLinecap="round" />;
                      })}
                    </>
                  ) : null}

                  {selectedMetricOption.chartType === "bar"
                    ? chart.coordinates.map((coordinate, index) => {
                        const barWidth = Math.max(
                          12,
                          Math.min(42, 620 / Math.max(chart.coordinates.length, 1)),
                        );
                        const chartBottom = 300 - 48;

                        return (
                          <rect
                            key={`${coordinate.point.label}-${index}`}
                            x={coordinate.x - barWidth / 2}
                            y={coordinate.y}
                            width={barWidth}
                            height={Math.max(chartBottom - coordinate.y, 1)}
                            fill="#111111"
                            rx="2"
                          >
                            <title>
                              {`${coordinate.point.label}: ${selectedMetricOption.tooltipLabel} ${formatValue(
                                coordinate.point.value,
                                selectedMetricOption.unit,
                              )}`}
                            </title>
                          </rect>
                        );
                      })
                    : chart.coordinates.map((coordinate, index) => (
                        <g key={`${coordinate.point.label}-${index}`}>
                          <circle
                            cx={coordinate.x}
                            cy={coordinate.y}
                            r={hoveredPointIndex === index ? "5.5" : "4"}
                            fill={coordinate.point.personalRecord ? "#a4cf6f" : "#111814"}
                            stroke={coordinate.point.personalRecord ? "rgb(var(--color-growth))" : "rgb(var(--color-core))"}
                            strokeWidth={coordinate.point.personalRecord ? "3" : "2"}
                            onMouseEnter={() => setHoveredPointIndex(index)}
                            onMouseLeave={() => setHoveredPointIndex(null)}
                            className="cursor-pointer"
                          >
                            <title>
                              {`${coordinate.point.label}${
                                coordinate.point.detail ? ` / ${coordinate.point.detail}` : ""
                              }: ${selectedMetricOption.tooltipLabel} ${formatValue(
                                coordinate.point.value,
                                selectedMetricOption.unit,
                              )}`}
                            </title>
                          </circle>
                        </g>
                      ))}

                  {hoveredCoordinate ? (
                    <g pointerEvents="none">
                      {(() => {
                        const tooltipWidth = 206;
                        const tooltipHeight = 62;
                        const x = Math.min(
                          Math.max(hoveredCoordinate.x - tooltipWidth / 2, 70),
                          760 - tooltipWidth - 12,
                        );
                        const y =
                          hoveredCoordinate.y > 96
                            ? hoveredCoordinate.y - tooltipHeight - 14
                            : hoveredCoordinate.y + 16;

                        return (
                          <>
                            <rect
                              x={x}
                              y={y}
                              width={tooltipWidth}
                              height={tooltipHeight}
                              rx="6"
                              fill="#111814"
                              stroke="#2a352e"
                            />
                            <text
                              x={x + 12}
                              y={y + 20}
                              className="fill-neutral-500 text-[11px]"
                            >
                              {hoveredCoordinate.point.date
                                ? formatShortDate(hoveredCoordinate.point.date)
                                : hoveredCoordinate.point.label}
                            </text>
                            <text
                              x={x + 12}
                              y={y + 39}
                              className="fill-ink text-[13px] font-semibold"
                            >
                              {selectedMetricOption.tooltipLabel}:{" "}
                              {formatValue(
                                hoveredCoordinate.point.value,
                                selectedMetricOption.unit,
                              )}
                            </text>
                            <text
                              x={x + 12}
                              y={y + 55}
                              className="fill-neutral-500 text-[11px]"
                            >
                              {hoveredCoordinate.point.detail ??
                                selectedMetricOption.graphTitle}
                            </text>
                          </>
                        );
                      })()}
                    </g>
                  ) : null}

                  {chart.coordinates.map((coordinate, index) => {
                    if (
                      index !== 0 &&
                      index !== chart.coordinates.length - 1 &&
                      index % Math.ceil(chart.coordinates.length / 4) !== 0
                    ) {
                      return null;
                    }

                    return (
                      <text
                        key={`${coordinate.point.label}-label-${index}`}
                        x={coordinate.x}
                        y="282"
                        textAnchor="middle"
                        className="fill-neutral-500 text-[11px]"
                      >
                        {coordinate.point.date
                          ? formatShortDate(coordinate.point.date)
                          : coordinate.point.label}
                      </text>
                    );
                  })}
                </svg>
              </div>
              {selectedMetricOption.chartType === "line" ? <div className="flex flex-wrap gap-4 px-1 text-xs text-muted"><span><i className="mr-1 inline-block h-2 w-5 rounded bg-growth"/>Improved</span><span><i className="mr-1 inline-block h-2 w-5 rounded bg-[#eabf69]"/>No change</span><span><i className="mr-1 inline-block h-2 w-5 rounded bg-[#e06464]"/>Lower</span>{requiresExercise ? <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-growth"/>Personal record</span> : null}</div> : null}

            </>
          )}
        </div>
      )}
    </Card>
  );
}
