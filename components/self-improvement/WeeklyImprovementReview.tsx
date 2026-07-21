import { saveWeeklyReview } from "@/app/self-improvement/actions";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";

type Review = { wentWell: string; difficult: string; evidence: string; improvedCategory: string; attentionCategory: string; confidence: number; positiveDifference: string; adjustment: string; priorities: string } | null;

export function WeeklyImprovementReview({ review, previousAdjustment, weekStart, categories }: { review: Review; previousAdjustment: string | null; weekStart: Date; categories: readonly string[] }) {
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6);
  return <Card id="review">
    <CardHeader title="Weekly review" description={`Review ${weekStart.toLocaleDateString()}–${weekEnd.toLocaleDateString()} using observations rather than judgment, then choose realistic priorities.`}/>
    {previousAdjustment ? <div className="mb-4 rounded-md border border-core/25 bg-core/10 p-3 text-sm"><p className="font-semibold text-core">Adjustment carried from the previous review</p><p className="mt-1 text-muted">{previousAdjustment}</p><p className="mt-1 text-xs text-muted">This is context only; it does not silently change goals or routines.</p></div> : null}
    <form action={saveWeeklyReview} className="grid gap-3 md:grid-cols-2">
      <Field label="What went well?"><Textarea name="wentWell" defaultValue={review?.wentWell}/></Field>
      <Field label="What was difficult?"><Textarea name="difficult" defaultValue={review?.difficult}/></Field>
      <div className="md:col-span-2"><Field label="What evidence supports this review?"><Textarea name="evidence" defaultValue={review?.evidence} placeholder="Completed days, measurements, specific situations, or notes—avoid guessing."/></Field></div>
      <Field label="Most improved category"><Select name="improvedCategory" defaultValue={review?.improvedCategory}>{categories.map((category) => <option key={category}>{category}</option>)}</Select></Field>
      <Field label="Category needing attention"><Select name="attentionCategory" defaultValue={review?.attentionCategory}>{categories.map((category) => <option key={category}>{category}</option>)}</Select></Field>
      <Field label="Confidence this week (1–10)"><Input name="confidence" type="number" min="1" max="10" defaultValue={review?.confidence ?? 5}/></Field>
      <Field label="Biggest positive difference"><Input name="positiveDifference" defaultValue={review?.positiveDifference}/></Field>
      <Field label="One adjustment for next week"><Textarea name="adjustment" defaultValue={review?.adjustment}/></Field>
      <Field label="Up to three priorities (one per line)"><Textarea name="priorities" defaultValue={review?.priorities}/></Field>
      <Button className="md:w-fit">Save weekly review</Button>
    </form>
  </Card>;
}
