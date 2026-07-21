"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDefaultProfile } from "@/lib/profile";
import { parseMealForm } from "@/lib/meals";
import {
  archiveTemplateForProfile,
  createMealForProfile,
  deleteMealForProfile,
  duplicateMealForProfile,
  logTemplateForProfile,
  renameTemplateForProfile,
  saveMealTemplateForProfile,
  updateMealForProfile,
  MealServiceError,
} from "@/lib/mealService";

const idSchema = z.string().cuid();
const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

function refreshMeals() {
  revalidatePath("/");
  revalidatePath("/meals");
}

export async function createMealEntry(formData: FormData) {
  const profile = await getDefaultProfile();
  const input = parseMealForm(formData);
  const result = await createMealForProfile(profile.id, input);
  if (result.created && formData.get("saveAsTemplate") === "on") {
    const requestedName = String(formData.get("templateName") || input.mealName);
    await saveMealTemplateForProfile(profile.id, input, requestedName);
  }
  refreshMeals();
}

export type MealActionState = { status: "idle" | "success" | "error"; message: string; submissionId?: string };

export async function createMealEntryState(_state: MealActionState, formData: FormData): Promise<MealActionState> {
  try {
    await createMealEntry(formData);
    return { status: "success", message: "Nutrition entry saved.", submissionId: String(formData.get("clientRequestId") || "") };
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Check the required fields and nutrition values. Your draft remains available."
      : error instanceof MealServiceError
        ? error.message
        : "The nutrition entry could not be saved on our end. Your draft remains available and our development team is working to keep saving reliable.";
    return { status: "error", message };
  }
}

export async function updateMealEntry(formData: FormData) {
  const profile = await getDefaultProfile();
  const id = idSchema.parse(formData.get("id"));
  const input = parseMealForm(formData);
  const version = z.coerce.date().optional().parse(formData.get("updatedAt") || undefined);
  await updateMealForProfile(profile.id, id, input, version);
  refreshMeals();
}

export async function deleteMealEntry(formData: FormData) {
  const profile = await getDefaultProfile();
  await deleteMealForProfile(profile.id, idSchema.parse(formData.get("id")));
  refreshMeals();
}

export async function duplicateMealEntry(formData: FormData) {
  const profile = await getDefaultProfile();
  const dateKey = dateKeySchema.parse(formData.get("dateKey"));
  const requestId = z.string().uuid().optional().parse(formData.get("clientRequestId") || undefined);
  await duplicateMealForProfile(profile.id, idSchema.parse(formData.get("id")), dateKey, requestId);
  refreshMeals();
}

export async function reuseSavedMeal(formData: FormData) {
  const profile = await getDefaultProfile();
  await logTemplateForProfile(
    profile.id,
    idSchema.parse(formData.get("id")),
    dateKeySchema.parse(formData.get("dateKey")),
    z.string().min(1).max(100).parse(formData.get("timezone") || "UTC"),
    z.string().uuid().optional().parse(formData.get("clientRequestId") || undefined),
  );
  refreshMeals();
}

export async function archiveSavedMeal(formData: FormData) {
  const profile = await getDefaultProfile();
  await archiveTemplateForProfile(profile.id, idSchema.parse(formData.get("id")));
  refreshMeals();
}

export async function renameSavedMeal(formData: FormData) {
  const profile = await getDefaultProfile();
  await renameTemplateForProfile(
    profile.id,
    idSchema.parse(formData.get("id")),
    z.string().trim().min(1).max(200).parse(formData.get("name")),
  );
  refreshMeals();
}
