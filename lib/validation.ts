import { z } from "zod";

export const idSchema = z.string().cuid();
export const dateInputSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const shortTextSchema = z.string().trim().min(1).max(200);
export const notesSchema = z.string().trim().max(5000).nullable().optional();

export const dailyLogSchema = z.object({
  date: dateInputSchema,
  bodyWeight: z.coerce.number().min(40).max(1000).nullable().optional(),
  sleepHours: z.coerce.number().min(0).max(24).nullable().optional(),
  restingHeartRate: z.coerce.number().int().min(20).max(250).nullable().optional(),
  mood: z.coerce.number().int().min(1).max(10).nullable().optional(),
  energyLevel: z.coerce.number().int().min(1).max(10).nullable().optional(),
  sorenessLevel: z.coerce.number().int().min(1).max(10).nullable().optional(),
  stressLevel: z.coerce.number().int().min(1).max(10).nullable().optional(),
  waterIntake: z.coerce.number().int().min(0).max(1000).nullable().optional(),
  notes: notesSchema,
});

export const todoSchema = z.object({ date: dateInputSchema, title: shortTextSchema });

export function formObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}
