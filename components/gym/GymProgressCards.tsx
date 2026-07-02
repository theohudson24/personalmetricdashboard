"use client";

import { useMemo, useState } from "react";
import { StatTile } from "@/components/shared/StatTile";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type {
  ExerciseProgressPoint,
  MuscleGroupVolumeEntry,
  WeeklyWorkoutPoint,
  WorkoutVolumePoint,
} from "@/lib/workouts";

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
    return { path: "", coordinates: [], min: 0, max: 0 };
  }

  const values = points.map((point) => point.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const spread = Math.max(rawMax - rawMin, 1);
  const min = Math.max(0, rawMin - spread * 0.12);
  const max = rawMax + spread * 0.12;
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
    path: coordinates
      .map((coordinate, index) =>
        `${index === 0 ? "M" : "L"} ${coordinate.x.toFixed(2)} ${coordinate.y.toFixed(2)}`,
      )
      .join(" "),
    coordinates,
    min,
    max,
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

export function GymProgressCards({
  exercisePoints,
  workoutVolumePoints,
  weeklyWorkoutPoints,
  bodyWeightPoints,
  muscleGroupVolumeEntries,
}: {
  exercisePoints: ExerciseProgressPoint[];
  workoutVolumePoints: WorkoutVolumePoint[];
  weeklyWorkoutPoints: WeeklyWorkoutPoint[];
  bodyWeightPoints: ChartPoint[];
  muscleGroupVolumeEntries: MuscleGroupVolumeEntry[];
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

  return (
    <Card>
      <CardHeader
        title={selectedMetricOption.graphTitle}
        description="Track progress using supported training and body-weight metrics."
      />

      {!hasAnyData ? (
        <EmptyState message="Progress data appears after workouts or body weight are logged." />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
            {requiresExercise ? (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Exercise
                </span>
                <select
                  value={selectedExercise}
                  onChange={(event) => setSelectedExercise(event.target.value)}
                  className="min-h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink transition focus:border-ink"
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
              <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                Metric
              </span>
              <select
                value={selectedMetric}
                onChange={(event) => setSelectedMetric(event.target.value as MetricKey)}
                className="min-h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink transition focus:border-ink"
              >
                {metricOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                Period
              </span>
              <select
                value={selectedPeriod}
                onChange={(event) => setSelectedPeriod(event.target.value as PeriodKey)}
                className="min-h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink transition focus:border-ink"
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
            <EmptyState message="No data matches this metric and time period." />
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

              <div className="overflow-hidden rounded-md border border-line bg-neutral-50">
                <svg
                  viewBox="0 0 760 300"
                  role="img"
                  aria-label={`${selectedMetricOption.graphTitle}: ${selectedMetricOption.yAxisLabel}`}
                  className="h-80 w-full bg-white"
                  preserveAspectRatio="none"
                >
                  <text
                    x="16"
                    y="154"
                    transform="rotate(-90 16 154)"
                    textAnchor="middle"
                    className="fill-neutral-500 text-[11px]"
                  >
                    {selectedMetricOption.yAxisLabel}
                  </text>

                  {[0, 1, 2, 3].map((line) => {
                    const y = 24 + line * ((300 - 24 - 48) / 3);
                    const value = chart.max - line * ((chart.max - chart.min) / 3);

                    return (
                      <g key={line}>
                        <line
                          x1="64"
                          x2="736"
                          y1={y}
                          y2={y}
                          stroke="#e5e5e5"
                          strokeWidth="1"
                        />
                        <text
                          x="54"
                          y={y + 4}
                          textAnchor="end"
                          className="fill-neutral-500 text-[11px]"
                        >
                          {Math.round(value).toLocaleString()}
                        </text>
                      </g>
                    );
                  })}

                  {selectedMetricOption.chartType === "line" && chartPoints.length > 1
                    ? chart.coordinates.slice(1).map((coordinate, index) => {
                        const previous = chart.coordinates[index];
                        const isUp = coordinate.point.value >= previous.point.value;

                        return (
                          <line
                            key={`${coordinate.point.label}-${index}-segment`}
                            x1={previous.x}
                            y1={previous.y}
                            x2={coordinate.x}
                            y2={coordinate.y}
                            stroke={isUp ? "#15803d" : "#b91c1c"}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                        );
                      })
                    : null}

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
                            fill="#ffffff"
                            stroke="#111111"
                            strokeWidth="2"
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
                              fill="#ffffff"
                              stroke="#d4d4d4"
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

            </>
          )}
        </div>
      )}
    </Card>
  );
}
