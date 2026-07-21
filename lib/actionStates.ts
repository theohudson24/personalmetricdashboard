export type SettingsActionState = { status: "idle" | "success" | "error"; message: string };
export const idleSettingsState: SettingsActionState = { status: "idle", message: "" };

export type BugReportState = { status: "idle" | "success" | "error"; message: string; reference?: string };
export const idleBugReportState: BugReportState = { status: "idle", message: "" };

export type DeletionState = { status: "idle" | "success" | "error"; message: string };
export const idleDeletionState: DeletionState = { status: "idle", message: "" };
