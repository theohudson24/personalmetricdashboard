import { Lightbulb, LockKeyhole, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { CategoryGrid } from "@/components/ascension/CategoryGrid";
import { DailyImprovementChecklist } from "@/components/ascension/DailyImprovementChecklist";
import { ImprovementGoals } from "@/components/ascension/ImprovementGoals";
import { RoutineBuilder } from "@/components/ascension/RoutineBuilder";
import { SafetyNotice } from "@/components/ascension/SafetyNotice";
import { SelfImprovementOverview } from "@/components/ascension/SelfImprovementOverview";
import { WeeklyImprovementReview } from "@/components/ascension/WeeklyImprovementReview";
import { prisma } from "@/lib/prisma";
import { getDefaultProfile } from "@/lib/profile";
import { defaultChecklist, improvementCategories, todayUtc, weekStartUtc } from "@/lib/selfImprovement";

export const dynamic = "force-dynamic";

export default async function SelfImprovementPage() {
  const profile = await getDefaultProfile(); const today = todayUtc();
  const existing = await prisma.selfImprovementChecklistItem.count({ where: { profileId: profile.id, date: today } });
  if (!existing) await prisma.selfImprovementChecklistItem.createMany({ data: defaultChecklist.map(([title,category])=>({profileId:profile.id,date:today,title,category})), skipDuplicates:true });
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate()-6);
  const [todayItems, weekItems, goals, routines, review, metrics] = await Promise.all([
    prisma.selfImprovementChecklistItem.findMany({where:{profileId:profile.id,date:today},orderBy:{createdAt:"asc"}}),
    prisma.selfImprovementChecklistItem.findMany({where:{profileId:profile.id,date:{gte:weekAgo,lte:today}}}),
    prisma.ascensionGoal.findMany({where:{profileId:profile.id,status:{not:"Archived"}},orderBy:{updatedAt:"desc"}}),
    prisma.selfImprovementRoutine.findMany({where:{profileId:profile.id,archived:false},include:{tasks:true},orderBy:{createdAt:"desc"}}),
    prisma.selfImprovementWeeklyReview.findUnique({where:{profileId_weekStart:{profileId:profile.id,weekStart:weekStartUtc()}}}),
    prisma.ascensionMetric.findMany({where:{profileId:profile.id},orderBy:{updatedAt:"desc"},take:6}),
  ]);
  const completion=todayItems.length?Math.round(todayItems.filter(i=>i.completed).length/todayItems.length*100):0;
  const weeklyConsistency=weekItems.length?Math.round(weekItems.filter(i=>i.completed).length/weekItems.length*100):completion;
  const categoryActivity=Object.fromEntries(improvementCategories.map(category=>{const items=weekItems.filter(i=>i.category===category.name);return[category.name,{completed:items.filter(i=>i.completed).length,total:items.length,goals:goals.filter(g=>g.category===category.name&&g.status==="Active").length}]}));
  const ranked=[...improvementCategories].map(c=>({name:c.name,total:categoryActivity[c.name].total,score:categoryActivity[c.name].total?categoryActivity[c.name].completed/categoryActivity[c.name].total:0})).sort((a,b)=>b.score-a.score);
  const strongest=ranked.find(c=>c.total)?.name??"Your foundations"; const focus=[...ranked].reverse().find(c=>c.total)?.name??improvementCategories[0].name;
  const categories=improvementCategories.map(c=>c.name); const activeGoals=goals.filter(g=>["Active","In Progress","Not started","Not Started"].includes(g.status)).length; const completedGoals=goals.filter(g=>g.status==="Completed").length;
  const recommendations=[completion<60?"Consider reducing today’s checklist to a few high-impact basics.":"Your daily basics are consistent. Keep them stable before adding more.",`If it fits your priorities, choose one small action in ${focus}.`,routines.length?"Review any routine that feels too long and create a simpler weekday version.":"A short morning or nighttime routine can reduce decision fatigue."];
  return <div><PageHeader eyebrow="Sustainable personal growth" title="Self-Improvement" description="Build confidence, health, presentation, and self-respect through realistic routines and measurable actions."/><div className="grid gap-5"><SafetyNotice/><SelfImprovementOverview completion={completion} weeklyConsistency={weeklyConsistency} activeGoals={activeGoals} completedGoals={completedGoals} streak={completion>0?1:0} focus={focus} strongest={strongest}/><div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><DailyImprovementChecklist items={todayItems} categories={categories}/><Card><CardHeader title="Optional suggestions" description="Prioritized around consistency, safety, low cost, and your existing activity."/><div className="space-y-3">{recommendations.map((recommendation,index)=><div key={recommendation} className="flex gap-3 rounded-md border border-line bg-black/15 p-3"><Lightbulb size={17} className="mt-0.5 shrink-0 text-growth"/><div><p className="text-xs font-semibold uppercase tracking-wider text-muted">Suggestion {index+1}</p><p className="mt-1 text-sm leading-6">{recommendation}</p></div></div>)}</div><div className="mt-4 flex gap-2 rounded-md border border-line p-3 text-xs leading-5 text-muted"><LockKeyhole size={17} className="shrink-0 text-core"/>Your self-improvement records are tied to your account. Photos are not enabled until private object storage and deletion controls are implemented.</div></Card></div><CategoryGrid categories={improvementCategories} activity={categoryActivity}/><div className="grid gap-5 xl:grid-cols-2"><ImprovementGoals goals={goals} categories={categories}/><RoutineBuilder routines={routines} categories={categories}/></div>{metrics.length?<Card><CardHeader title="Personal metrics" description="Category-specific markers only—never an attractiveness score or comparison with other people."/><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{metrics.map(metric=><div key={metric.id} className="rounded-md border border-line bg-black/15 p-3"><TrendingUp size={17} className="text-core"/><p className="mt-2 text-sm text-muted">{metric.category}</p><p className="font-semibold">{metric.name}: {metric.value}{metric.unit}</p></div>)}</div></Card>:null}<WeeklyImprovementReview review={review} categories={categories}/></div></div>;
}
