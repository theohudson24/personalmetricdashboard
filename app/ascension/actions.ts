"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDefaultProfile } from "@/lib/profile";

const category = z.enum(["Physical", "Health", "Mental", "Appearance", "Lifestyle"]);
const checkInSchema = z.object({ sleepHours: z.number().min(0).max(24), sleepQuality: z.number().int().min(1).max(10), energy: z.number().int().min(1).max(10), mood: z.number().int().min(1).max(10), stress: z.number().int().min(1).max(10), workoutCompleted: z.boolean(), steps: z.number().int().min(0).max(200000), nutritionQuality: z.number().int().min(1).max(10), protein: z.number().min(0).max(2000), water: z.number().min(0).max(2000), skincareCompleted: z.boolean(), supplementsCompleted: z.boolean(), deepWorkMinutes: z.number().int().min(0).max(1440), screenTimeRating: z.number().int().min(1).max(10), confidence: z.number().int().min(1).max(10), notes: z.string().max(5000) });
const goalSchema = z.object({ id: z.string().min(1).max(100), title: z.string().trim().min(1).max(200), category, currentValue: z.number().finite(), targetValue: z.number().finite(), deadline: z.string().max(20), priority: z.enum(["Low", "Medium", "High"]), progress: z.number().int().min(0).max(100), linkedHabits: z.string().max(1000), status: z.enum(["Not Started", "In Progress", "Completed", "Paused"]), notes: z.string().max(5000) });
const metricSchema = z.object({ id: z.string().min(1).max(100), category, name: z.string().trim().min(1).max(200), value: z.number().finite(), unit: z.string().max(30), target: z.number().finite().optional(), notes: z.string().max(3000) });

export async function saveAscensionCheckIn(input: unknown) {
  const data = checkInSchema.parse(input);
  const profile = await getDefaultProfile();
  const date = new Date(); date.setUTCHours(0, 0, 0, 0);
  await prisma.ascensionCheckIn.upsert({ where: { profileId_date: { profileId: profile.id, date } }, update: data, create: { profileId: profile.id, date, ...data } });
  revalidatePath("/ascension");
}

export async function saveAscensionGoal(input: unknown) {
  const goal = goalSchema.parse(input);
  const profile = await getDefaultProfile();
  const data = { title: goal.title, category: goal.category, currentValue: goal.currentValue, targetValue: goal.targetValue, deadline: goal.deadline ? new Date(`${goal.deadline}T00:00:00.000Z`) : null, priority: goal.priority, progress: goal.progress, linkedHabits: goal.linkedHabits, status: goal.status, notes: goal.notes };
  const existing = await prisma.ascensionGoal.findFirst({ where: { id: goal.id, profileId: profile.id }, select: { id: true } });
  if (existing) await prisma.ascensionGoal.update({ where: { id: goal.id }, data }); else await prisma.ascensionGoal.create({ data: { id: goal.id, profileId: profile.id, ...data } });
  revalidatePath("/ascension");
}

export async function deleteAscensionGoal(id: string) {
  const profile = await getDefaultProfile();
  await prisma.ascensionGoal.deleteMany({ where: { id: z.string().min(1).max(100).parse(id), profileId: profile.id } });
}

export async function saveAscensionMetric(input: unknown) {
  const metric = metricSchema.parse(input);
  const profile = await getDefaultProfile();
  const data = { category: metric.category, name: metric.name, value: metric.value, unit: metric.unit, target: metric.target ?? null, notes: metric.notes };
  await prisma.ascensionMetric.upsert({ where: { profileId_name: { profileId: profile.id, name: metric.name } }, update: data, create: { id: metric.id, profileId: profile.id, ...data } });
}
