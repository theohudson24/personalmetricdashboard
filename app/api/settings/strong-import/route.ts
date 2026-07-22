import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultProfile } from "@/lib/profile";
import { importStrongCsvBatch } from "@/lib/strongCsv";

export const runtime = "nodejs";
export const maxDuration = 60;

const maxFileSize = 5_000_000;
const batchSize = 12;

function userFileError(message: string) {
  return message.startsWith("This does not look")
    || message.startsWith("No valid workout")
    || message.startsWith("No workout rows")
    || message.startsWith("Invalid workout date")
    || message.startsWith("The export is too large")
    || message.startsWith("The CSV contains")
    || message.startsWith("The import cursor");
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (!origin || new URL(origin).host !== new URL(request.url).host) {
      return NextResponse.json({ message: "This import request was not accepted." }, { status: 403 });
    }
    const profile = await getDefaultProfile();
    const formData = await request.formData();
    const file = formData.get("file");
    const cursorValue = formData.get("cursor");
    const cursor = typeof cursorValue === "string" ? Number(cursorValue) : Number.NaN;

    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json({ message: "Choose a CSV exported from Strong." }, { status: 400 });
    }
    if (file.size <= 0 || file.size > maxFileSize) {
      return NextResponse.json({ message: "The CSV must be smaller than 5 MB." }, { status: 400 });
    }
    if (!Number.isSafeInteger(cursor) || cursor < 0) {
      return NextResponse.json({ message: "The import could not be resumed. Start the import again." }, { status: 400 });
    }

    const result = await importStrongCsvBatch(prisma, profile.id, await file.text(), cursor, batchSize);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { message: userFileError(message) ? message : "This batch failed on our end. Your completed batches are safe; retry to continue." },
      { status: userFileError(message) ? 400 : 500 },
    );
  }
}
