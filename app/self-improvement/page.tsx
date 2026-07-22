import { Lightbulb, LockKeyhole, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { CategoryGrid } from "@/components/self-improvement/CategoryGrid";
import { DailyImprovementChecklist } from "@/components/self-improvement/DailyImprovementChecklist";
import { ImprovementGoals } from "@/components/self-improvement/ImprovementGoals";
import { RoutineBuilder } from "@/components/self-improvement/RoutineBuilder";
import { SafetyNotice } from "@/components/self-improvement/SafetyNotice";
import { SelfImprovementOverview } from "@/components/self-improvement/SelfImprovementOverview";
import { WeeklyImprovementReview } from "@/components/self-improvement/WeeklyImprovementReview";
import { prisma } from "@/lib/prisma";
import { getDefaultProfile } from "@/lib/profile";
import { goalPaceStatus, goalProgressPercent, improvementCategories, todayUtc, uniqueSuccessfulHabitDays, weekStartUtc } from "@/lib/selfImprovement";

export const dynamic = "force-dynamic";

export default async function SelfImprovementPage() {
  const profile = await getDefaultProfile(); const today = todayUtc();
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate()-6);
  const [todayItems, weekItems, rawGoals, routines, review, previousReview, metrics, habits] = await Promise.all([
    prisma.selfImprovementChecklistItem.findMany({where:{profileId:profile.id,date:today},orderBy:{createdAt:"asc"}}),
    prisma.selfImprovementChecklistItem.findMany({where:{profileId:profile.id,date:{gte:weekAgo,lte:today}}}),
    prisma.selfImprovementGoal.findMany({where:{profileId:profile.id,status:{not:"Archived"}},include:{habitLinks:{include:{habit:{include:{completions:true}}}},routineLinks:{include:{routine:true}},progressEntries:{orderBy:{recordedAt:"desc"},take:8}},orderBy:{updatedAt:"desc"}}),
    prisma.selfImprovementRoutine.findMany({where:{profileId:profile.id,archived:false},include:{tasks:true},orderBy:{createdAt:"desc"}}),
    prisma.selfImprovementWeeklyReview.findUnique({where:{profileId_weekStart:{profileId:profile.id,weekStart:weekStartUtc()}}}),
    prisma.selfImprovementWeeklyReview.findFirst({where:{profileId:profile.id,weekStart:{lt:weekStartUtc()}},orderBy:{weekStart:"desc"}}),
    prisma.selfImprovementMetric.findMany({where:{profileId:profile.id},orderBy:{updatedAt:"desc"},take:6}),
    prisma.habit.findMany({where:{profileId:profile.id,status:"Active"},select:{id:true,name:true}}),
  ]);
  const goals = rawGoals.map((goal) => {
    const habitDays = uniqueSuccessfulHabitDays(goal.habitLinks.flatMap((link) => link.habit.completions).filter((entry) => entry.date >= goal.createdAt));
    const currentValue = goal.measurementMode === "HABIT_DAYS" ? goal.baselineValue + habitDays : goal.currentValue;
    const progress = goalProgressPercent(goal.baselineValue, currentValue, goal.targetValue);
    return { ...goal, currentValue, progress, paceStatus: goalPaceStatus({ progress, createdAt: goal.createdAt, deadline: goal.deadline }) };
  });
  const completion=todayItems.length?Math.round(todayItems.filter(i=>i.completed).length/todayItems.length*100):0;
  const weeklyConsistency=weekItems.length?Math.round(weekItems.filter(i=>i.completed).length/weekItems.length*100):completion;
  const categoryActivity=Object.fromEntries(improvementCategories.map(category=>{const items=weekItems.filter(i=>i.category===category.name);return[category.name,{completed:items.filter(i=>i.completed).length,total:items.length,goals:goals.filter(g=>g.category===category.name&&g.status==="Active").length}]}));
  const ranked=[...improvementCategories].map(c=>({name:c.name,total:categoryActivity[c.name].total,score:categoryActivity[c.name].total?categoryActivity[c.name].completed/categoryActivity[c.name].total:0})).sort((a,b)=>b.score-a.score);
  const strongest=ranked.find(c=>c.total)?.name??"Your foundations"; const focus=[...ranked].reverse().find(c=>c.total)?.name??improvementCategories[0].name;
  const categories=improvementCategories.map(c=>c.name); const activeGoals=goals.filter(g=>["Active","In Progress","Not started","Not Started"].includes(g.status)).length; const completedGoals=goals.filter(g=>g.status==="Completed").length;
  const recommendations=[completion<60?"Consider reducing today’s checklist to a few high-impact basics.":"Your daily basics are consistent. Keep them stable before adding more.",`If it fits your priorities, choose one small action in ${focus}.`,routines.length?"Review any routine that feels too long and create a simpler weekday version.":"A short morning or nighttime routine can reduce decision fatigue."];
  return <div><PageHeader eyebrow="Sustainable personal growth" title="Self-Improvement" description="Build confidence, health, presentation, and self-respect through realistic routines and measurable actions."/><div className="grid gap-8"><SafetyNotice/><SelfImprovementOverview completion={completion} weeklyConsistency={weeklyConsistency} activeGoals={activeGoals} completedGoals={completedGoals} streak={completion>0?1:0} focus={focus} strongest={strongest}/><div className="grid gap-8 xl:grid-cols-[1.1fr_.9fr]"><DailyImprovementChecklist items={todayItems} categories={categories}/><Card><CardHeader title="Optional suggestions" description="Generated from your logged activity using simple heuristics—not medical findings or guaranteed outcomes."/><div className="space-y-3">{recommendations.map((recommendation,index)=><div key={recommendation} className="flex gap-3 rounded-md border border-line bg-ink/[0.025] p-3"><Lightbulb size={17} className="mt-0.5 shrink-0 text-growth"/><div><p className="text-xs font-semibold uppercase tracking-wider text-muted">Optional suggestion {index+1}</p><p className="mt-1 text-sm leading-6">{recommendation}</p></div></div>)}</div><div className="mt-4 flex gap-2 rounded-md border border-line p-3 text-xs leading-5 text-muted"><LockKeyhole size={17} className="shrink-0 text-core"/>Your self-improvement records are tied to your account. Photos are not enabled until private object storage and deletion controls are implemented.</div></Card></div><CategoryGrid categories={improvementCategories} activity={categoryActivity}/><div className="grid gap-8 xl:grid-cols-2"><ImprovementGoals goals={goals} categories={categories} habits={habits} routines={routines.map(({id,name})=>({id,name}))}/><RoutineBuilder routines={routines} categories={categories}/></div>{metrics.length?<Card><CardHeader title="Personal metrics" description="Category-specific markers only—never an attractiveness score, diagnosis, or comparison with other people."/><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{metrics.map(metric=><div key={metric.id} className="rounded-md border border-line bg-ink/[0.025] p-3"><TrendingUp size={17} className="text-core"/><p className="mt-2 text-sm text-muted">{metric.category}</p><p className="font-semibold">{metric.name}: {metric.value}{metric.unit}</p></div>)}</div></Card>:null}<WeeklyImprovementReview review={review} previousAdjustment={previousReview?.adjustment ?? null} weekStart={weekStartUtc()} categories={categories}/></div></div>;
}
