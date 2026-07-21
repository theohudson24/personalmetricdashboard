"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDefaultProfile } from "@/lib/profile";
import { consumeRateLimit, privateRateLimitKey } from "@/lib/rateLimit";

export type BugReportState = { status: "idle" | "success" | "error"; message: string; reference?: string };
export const idleBugReportState: BugReportState = { status: "idle", message: "" };

export async function createBugReport(_state: BugReportState, formData: FormData): Promise<BugReportState> {
  try {
    const parsed = z.object({
      category: z.enum(["NUTRITION", "WORKOUTS", "HABITS", "ACCOUNT", "LOGIN", "OTHER"]),
      summary: z.string().trim().min(5).max(120),
      description: z.string().trim().min(10).max(4000),
      pageUrl: z.string().trim().max(500).optional(),
      deviceInfo: z.string().trim().max(1000).optional(),
    }).safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { status: "error", message: "Add a short title and enough detail for us to reproduce the problem." };
    const profile = await getDefaultProfile();
    const rate = await consumeRateLimit(privateRateLimitKey("bug-report", profile.id), 5, 60 * 60 * 1000);
    if (!rate.allowed) return { status: "error", message: "Too many reports were submitted recently. Wait before trying again." };
    const report = await prisma.bugReport.create({ data: { profileId: profile.id, ...parsed.data, pageUrl: parsed.data.pageUrl || null, deviceInfo: parsed.data.deviceInfo || null } });
    return { status: "success", message: "Bug report received. Thank you for helping improve the application.", reference: report.id.slice(-8).toUpperCase() };
  } catch {
    return { status: "error", message: "The report could not be saved on our end. Please try again after refreshing the page." };
  }
}
