"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDefaultProfile } from "@/lib/profile";
import { todayUtc, weekStartUtc } from "@/lib/selfImprovement";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const category = z.string().trim().min(1).max(100);
const id = z.string().min(1).max(100);
function refresh() { revalidatePath("/ascension"); revalidatePath("/self-improvement"); }

export async function addImprovementChecklistItem(formData: FormData) {
  const profile = await getDefaultProfile();
  const title = z.string().trim().min(1).max(160).parse(text(formData, "title"));
  await prisma.selfImprovementChecklistItem.upsert({
    where: { profileId_date_title: { profileId: profile.id, date: todayUtc(), title } }, update: { category: category.parse(text(formData, "category")) },
    create: { profileId: profile.id, date: todayUtc(), title, category: category.parse(text(formData, "category")) },
  }); refresh();
}

export async function toggleImprovementChecklistItem(formData: FormData) {
  const profile = await getDefaultProfile(); const itemId = id.parse(text(formData, "id"));
  await prisma.selfImprovementChecklistItem.updateMany({ where: { id: itemId, profileId: profile.id }, data: { completed: text(formData, "completed") !== "true" } }); refresh();
}

export async function deleteImprovementChecklistItem(formData: FormData) {
  const profile = await getDefaultProfile();
  await prisma.selfImprovementChecklistItem.deleteMany({ where: { id: id.parse(text(formData, "id")), profileId: profile.id } }); refresh();
}

export async function createImprovementGoal(formData: FormData) {
  const profile = await getDefaultProfile(); const title = z.string().trim().min(1).max(200).parse(text(formData, "title"));
  const currentValue = Number(formData.get("baseline")) || 0; const targetValue = Number(formData.get("target")) || 100;
  await prisma.ascensionGoal.create({ data: { profileId: profile.id, title, category: category.parse(text(formData, "category")), currentValue, targetValue, deadline: text(formData, "targetDate") ? new Date(`${text(formData, "targetDate")}T00:00:00.000Z`) : null, priority: z.enum(["Low", "Medium", "High"]).parse(text(formData, "priority")), progress: targetValue > 0 ? Math.max(0, Math.min(100, Math.round(currentValue / targetValue * 100))) : 0, linkedHabits: text(formData, "weeklyActions").slice(0, 1000), status: "Active", notes: [text(formData, "motivation"), text(formData, "notes")].filter(Boolean).join("\n\n").slice(0, 5000) } }); refresh();
}

export async function setImprovementGoalStatus(formData: FormData) {
  const profile = await getDefaultProfile(); const goalId = id.parse(text(formData, "id"));
  const status = z.enum(["Not started", "Active", "Paused", "Completed", "Archived"]).parse(text(formData, "status"));
  await prisma.ascensionGoal.updateMany({ where: { id: goalId, profileId: profile.id }, data: { status, ...(status === "Completed" ? { progress: 100 } : {}) } }); refresh();
}

export async function deleteImprovementGoal(formData: FormData) {
  const profile = await getDefaultProfile(); await prisma.ascensionGoal.deleteMany({ where: { id: id.parse(text(formData, "id")), profileId: profile.id } }); refresh();
}

export async function createImprovementRoutine(formData: FormData) {
  const profile = await getDefaultProfile();
  const tasks = text(formData, "tasks").split("\n").map((task) => task.trim()).filter(Boolean).slice(0, 20);
  await prisma.selfImprovementRoutine.create({ data: { profileId: profile.id, name: z.string().trim().min(1).max(120).parse(text(formData, "name")), category: category.parse(text(formData, "category")), frequency: z.string().trim().min(1).max(60).parse(text(formData, "frequency")), preferredTime: text(formData, "preferredTime") || null, estimatedMinutes: Math.max(1, Math.min(240, Number(formData.get("estimatedMinutes")) || 10)), notes: text(formData, "notes").slice(0, 2000) || null, tasks: { create: tasks.map((title, orderIndex) => ({ title, orderIndex })) } } }); refresh();
}

export async function toggleRoutineTask(formData: FormData) {
  const profile = await getDefaultProfile(); const taskId = id.parse(text(formData, "id"));
  const task = await prisma.selfImprovementRoutineTask.findFirst({ where: { id: taskId, routine: { profileId: profile.id } } });
  if (task) await prisma.selfImprovementRoutineTask.update({ where: { id: task.id }, data: { completed: !task.completed } }); refresh();
}

export async function deleteImprovementRoutine(formData: FormData) {
  const profile = await getDefaultProfile(); await prisma.selfImprovementRoutine.deleteMany({ where: { id: id.parse(text(formData, "id")), profileId: profile.id } }); refresh();
}

export async function saveWeeklyReview(formData: FormData) {
  const profile = await getDefaultProfile();
  const data = { wentWell: text(formData, "wentWell").slice(0, 4000), difficult: text(formData, "difficult").slice(0, 4000), improvedCategory: category.parse(text(formData, "improvedCategory")), attentionCategory: category.parse(text(formData, "attentionCategory")), confidence: z.coerce.number().int().min(1).max(10).parse(formData.get("confidence")), positiveDifference: text(formData, "positiveDifference").slice(0, 4000), adjustment: text(formData, "adjustment").slice(0, 4000), priorities: text(formData, "priorities").slice(0, 2000) };
  await prisma.selfImprovementWeeklyReview.upsert({ where: { profileId_weekStart: { profileId: profile.id, weekStart: weekStartUtc() } }, update: data, create: { profileId: profile.id, weekStart: weekStartUtc(), ...data } }); refresh();
}
