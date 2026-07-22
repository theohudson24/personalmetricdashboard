import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultProfile } from "@/lib/profile";
import { importCronometerBatch, type CronometerFiles } from "@/lib/cronometerCsv";

export const runtime = "nodejs";
export const maxDuration = 60;

const maximumFileSize = 3_000_000;
const maximumRequestFiles = 4_000_000;
const batchSize = 14;

function sameOrigin(request: Request) {
  try {
    const origin = request.headers.get("origin");
    return Boolean(origin && new URL(origin).host === new URL(request.url).host);
  } catch {
    return false;
  }
}

function fileError(message: string) {
  return message.startsWith("This does not look")
    || message.startsWith("Choose at least")
    || message.startsWith("No valid Cronometer")
    || message.startsWith("The import cursor")
    || message.includes("Cronometer")
    || message.includes("CSV");
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return NextResponse.json({ message: "This import request was not accepted." }, { status: 403 });
    const profile = await getDefaultProfile();
    const formData = await request.formData();
    const cursorValue = formData.get("cursor");
    const cursor = typeof cursorValue === "string" ? Number(cursorValue) : Number.NaN;
    if (!Number.isSafeInteger(cursor) || cursor < 0) return NextResponse.json({ message: "The import could not be resumed. Start again." }, { status: 400 });

    const entries: Array<[keyof CronometerFiles, FormDataEntryValue | null]> = [
      ["dailySummary", formData.get("dailySummary")],
      ["servings", formData.get("servings")],
      ["biometrics", formData.get("biometrics")],
    ];
    const selected = entries.filter((entry): entry is [keyof CronometerFiles, File] => entry[1] instanceof File && entry[1].size > 0);
    if (!selected.length) return NextResponse.json({ message: "Choose at least one Cronometer CSV export." }, { status: 400 });
    if (selected.some(([, file]) => !file.name.toLowerCase().endsWith(".csv") || file.size > maximumFileSize) || selected.reduce((total, [, file]) => total + file.size, 0) > maximumRequestFiles) {
      return NextResponse.json({ message: "Cronometer files must be CSVs, below 3 MB each and 4 MB combined." }, { status: 400 });
    }

    const files: CronometerFiles = {};
    for (const [key, file] of selected) files[key] = await file.text();
    const result = await importCronometerBatch(prisma, profile.id, files, cursor, batchSize);
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { message: fileError(message) ? message : "This Cronometer batch failed on our end. Completed dates are safe; retry to continue." },
      { status: fileError(message) ? 400 : 500 },
    );
  }
}
