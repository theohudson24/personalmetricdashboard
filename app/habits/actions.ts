"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDefaultProfile } from "@/lib/profile";

const habitSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(160),
  type: z.enum(["build", "kick"]),
  category: z.enum(["Fitness", "Health", "Mental", "Productivity", "Social", "Finance", "Lifestyle", "Appearance", "Custom"]),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  frequency: z.enum(["Daily", "Weekly", "Custom"]),
  targetAmount: z.string().trim().max(200),
  reminderTime: z.string().max(20),
  reason: z.string().trim().max(500),
  notes: z.string().trim().max(3000),
  status: z.enum(["Active", "Paused", "Completed", "Failed", "Archived"]),
  bestStreak: z.number().int().min(0).max(100000),
});

const checkInSchema = z.object({
  habitId: z.string().min(1).max(100),
  completionId: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["completed", "missed", "clean", "relapse", "partial"]),
  bestStreak: z.number().int().min(0).max(100000),
  relapse: z.object({ trigger: z.string().max(500), emotion: z.string().max(500), location: z.string().max(500), timeOfDay: z.string().max(20), reflection: z.string().max(3000), preventionPlan: z.string().max(3000) }).optional(),
});

function calendarDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function saveHabitRecord(input: unknown) {
  const habit = habitSchema.parse(input);
  const profile = await getDefaultProfile();
  const data = { name: habit.name, type: habit.type, category: habit.category, difficulty: habit.difficulty, frequency: habit.frequency, targetAmount: habit.targetAmount, reminderTime: habit.reminderTime, reason: habit.reason, notes: habit.notes, status: habit.status, bestStreak: habit.bestStreak };
  const existing = await prisma.habit.findFirst({ where: { id: habit.id, profileId: profile.id }, select: { id: true } });
  if (existing) await prisma.habit.update({ where: { id: habit.id }, data });
  else await prisma.habit.create({ data: { id: habit.id, profileId: profile.id, ...data } });
  revalidatePath("/habits");
}

export async function updateHabitStatusRecord(id: string, status: string) {
  const parsed = z.object({ id: z.string().min(1).max(100), status: habitSchema.shape.status }).parse({ id, status });
  const profile = await getDefaultProfile();
  await prisma.habit.updateMany({ where: { id: parsed.id, profileId: profile.id }, data: { status: parsed.status } });
  revalidatePath("/habits");
}

export async function deleteHabitRecord(id: string) {
  const parsedId = z.string().min(1).max(100).parse(id);
  const profile = await getDefaultProfile();
  await prisma.habit.deleteMany({ where: { id: parsedId, profileId: profile.id } });
  revalidatePath("/habits");
}

export async function saveHabitCheckIn(input: unknown) {
  const checkIn = checkInSchema.parse(input);
  const profile = await getDefaultProfile();
  const habit = await prisma.habit.findFirst({ where: { id: checkIn.habitId, profileId: profile.id }, select: { id: true } });
  if (!habit) throw new Error("Habit not found");
  const date = calendarDate(checkIn.date);
  await prisma.$transaction(async (tx) => {
    await tx.habitCompletion.upsert({ where: { habitId_date: { habitId: habit.id, date } }, update: { status: checkIn.status }, create: { id: checkIn.completionId, habitId: habit.id, date, status: checkIn.status } });
    await tx.habit.update({ where: { id: habit.id }, data: { bestStreak: checkIn.bestStreak } });
    if (checkIn.status === "relapse" && checkIn.relapse) await tx.habitRelapse.create({ data: { habitId: habit.id, date, ...checkIn.relapse } });
  });
  revalidatePath("/habits");
}
