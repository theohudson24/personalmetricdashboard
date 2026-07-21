import { startOfDay } from "@/lib/dates";

export const improvementCategories = [
  { name: "Skin & complexion", description: "Simple, consistent skin care and reaction awareness.", actions: ["Cleanse gently", "Moisturize", "Use sunscreen"], safety: "Introduce products gradually. Persistent or severe concerns belong with a qualified clinician." },
  { name: "Hair", description: "Hair health, styling, scalp care, and appointment planning.", actions: ["Plan wash and conditioning", "Track haircut timing", "Save styling notes"], safety: "Cosmetic care is separate from medical hair-loss treatment; no routine can promise regrowth." },
  { name: "Facial hair & shaving", description: "Comfortable shaving, beard care, and maintenance.", actions: ["Maintain neckline", "Clean tools", "Track irritation"], safety: "Pause products or techniques that cause significant irritation." },
  { name: "Oral care & smile", description: "Daily oral hygiene, appointments, and smile comfort.", actions: ["Brush twice", "Floss", "Plan dental cleaning"], safety: "Avoid excessive whitening and ask a dental professional about sensitivity or pain." },
  { name: "Body composition", description: "Long-term health and physique habits without extreme restriction.", actions: ["Follow a flexible nutrition target", "Track weekly trends", "Protect recovery"], safety: "Avoid crash diets, dehydration, purging, excessive restriction, and unsafe supplements." },
  { name: "Muscular development", description: "Balanced training focus connected to workout consistency.", actions: ["Train focus areas", "Review volume", "Log recovery"], safety: "No body type guarantees attractiveness; pain or injury requires appropriate evaluation." },
  { name: "Posture & movement", description: "Comfort, mobility, ergonomics, and confident movement.", actions: ["Take a movement break", "Practice mobility", "Review desk setup"], safety: "Pain, numbness, weakness, or injury should be evaluated professionally." },
  { name: "Grooming & hygiene", description: "Cleanliness, recurring maintenance, clothing, and small details.", actions: ["Complete hygiene routine", "Check nails and grooming", "Refresh towels or bedding"], safety: "Choose routines that are comfortable and appropriate for your skin." },
  { name: "Style & clothing", description: "Fit, cleanliness, coordination, comfort, and personal identity.", actions: ["Plan an outfit", "Check fit and condition", "Identify one wardrobe gap"], safety: "Improvement does not require expensive brands or constant purchasing." },
  { name: "Face & eye presentation", description: "Controllable presentation such as rest, grooming, eyewear, and lighting.", actions: ["Clean eyewear", "Practice comfortable expression", "Protect sleep"], safety: "Avoid dangerous jaw routines or claims that exercises reshape adult facial bones." },
  { name: "Voice & speaking", description: "Clear, comfortable communication and listening practice.", actions: ["Practice articulation", "Slow speaking pace", "Review filler words"], safety: "Do not force pitch or use physically harmful voice techniques." },
  { name: "Confidence & presence", description: "Self-reported comfort, boundaries, posture, and completed actions.", actions: ["Practice eye contact", "Use open posture", "Complete one exposure goal"], safety: "Confidence is not measured by approval, compliments, or comparison." },
  { name: "Social skills & charisma", description: "Curiosity, listening, boundaries, reliability, and connection.", actions: ["Ask a follow-up question", "Start one conversation", "Follow up with someone"], safety: "Social practice should remain genuine and respect other people’s boundaries." },
  { name: "Mental & emotional well-being", description: "Mood, stress, self-talk, connection, and restorative activities.", actions: ["Log mood", "Spend time outdoors", "Practice reflection"], safety: "Appearance changes cannot treat mental-health conditions. Persistent distress deserves professional support." },
  { name: "Sleep & recovery", description: "Consistent sleep, energy, fatigue, soreness, and downtime.", actions: ["Set a screen cutoff", "Keep a wake time", "Plan recovery"], safety: "Sleep habits can support well-being but are not a substitute for medical assessment." },
  { name: "Nutrition & hydration", description: "Flexible nutrition, hydration, meal consistency, and energy.", actions: ["Drink water", "Plan protein and fiber", "Prepare a meal"], safety: "Foods are not morally good or bad. Avoid unsafe compounds and seek qualified advice for medical needs." },
  { name: "Fitness & athleticism", description: "Strength, cardio, mobility, sport, balance, and consistency.", actions: ["Complete planned activity", "Walk or move", "Log recovery"], safety: "Respect pain and injury; progression should be gradual and sustainable." },
  { name: "Fragrance & details", description: "Hands, nails, scent, accessories, and considerate presentation.", actions: ["Check nail care", "Use fragrance lightly", "Coordinate one detail"], safety: "Avoid overspraying and respect scent-sensitive environments." },
  { name: "Lifestyle & digital presence", description: "Organization, reliability, environment, photos, and online presentation.", actions: ["Reset one space", "Review privacy settings", "Plan tomorrow"], safety: "Do not misrepresent yourself or rely on heavy image manipulation." },
  { name: "Character & personal qualities", description: "Kindness, accountability, honesty, boundaries, and maturity.", actions: ["Keep one commitment", "Reflect on one interaction", "Practice accountability"], safety: "Character goals are for honest reflection, not performative scoring or manipulation." },
] as const;

export const defaultChecklist = [
  ["Complete morning self-care", "Grooming & hygiene"], ["Brush and floss", "Oral care & smile"],
  ["Drink water", "Nutrition & hydration"], ["Practice comfortable posture", "Posture & movement"],
  ["Prepare for consistent sleep", "Sleep & recovery"],
] as const;

export function todayUtc() { return startOfDay(new Date()); }
export function weekStartUtc() { const date = todayUtc(); const day = date.getUTCDay(); date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1)); return date; }

export function goalProgressPercent(baseline: number, current: number, target: number) {
  if (![baseline, current, target].every(Number.isFinite)) return 0;
  if (target === baseline) return current === target ? 100 : 0;
  const progress = target > baseline
    ? (current - baseline) / (target - baseline)
    : (baseline - current) / (baseline - target);
  return Math.max(0, Math.min(100, Math.round(progress * 100)));
}

export function goalPaceStatus({ progress, createdAt, deadline, now = new Date() }: { progress: number; createdAt: Date; deadline: Date | null; now?: Date }) {
  if (progress >= 100) return "Completed";
  if (!deadline) return progress > 0 ? "In progress" : "Not started";
  if (deadline.getTime() <= now.getTime()) return "Behind target";
  const duration = deadline.getTime() - createdAt.getTime();
  if (duration <= 0) return "Behind target";
  const elapsed = Math.max(0, now.getTime() - createdAt.getTime());
  const expected = Math.min(100, Math.round((elapsed / duration) * 100));
  return progress + 10 >= expected ? "On track" : "Behind target";
}

export function uniqueSuccessfulHabitDays(completions: Array<{ date: Date; status: string }>) {
  return new Set(completions.filter((entry) => entry.status === "completed" || entry.status === "clean").map((entry) => entry.date.toISOString().slice(0, 10))).size;
}
