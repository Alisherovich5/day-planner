import { DayPlan } from "./types";
import { getAllPlansAsync } from "./storage";

export interface WeeklyStats {
  days: {
    date: string;
    dayName: string;
    total: number;
    completed: number;
    rate: number;
  }[];
  totalTasks: number;
  totalCompleted: number;
  overallRate: number;
  bestDay: { date: string; dayName: string; rate: number } | null;
  worstDay: { date: string; dayName: string; rate: number } | null;
  priorityBreakdown: { high: number; medium: number; low: number };
  avgTasksPerDay: number;
  streak: number;
}

const DAY_NAMES = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const SHORT_DAYS = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];

function getLast7Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

export async function getWeeklyStatsAsync(userId: string): Promise<WeeklyStats> {
  const plans = await getAllPlansAsync(userId);
  const planMap = new Map<string, DayPlan>();
  plans.forEach((p) => planMap.set(p.date, p));

  const last7 = getLast7Days();
  let totalTasks = 0;
  let totalCompleted = 0;
  const priorityBreakdown = { high: 0, medium: 0, low: 0 };

  const days = last7.map((dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    const plan = planMap.get(dateStr);
    const total = plan?.tasks.length || 0;
    const completed = plan?.tasks.filter((t) => t.completed).length || 0;
    const rate = total > 0 ? Math.round((completed / total) * 100) : -1;
    totalTasks += total;
    totalCompleted += completed;
    if (plan) plan.tasks.forEach((t) => { priorityBreakdown[t.priority]++; });
    return { date: dateStr, dayName: SHORT_DAYS[d.getDay()], total, completed, rate };
  });

  const overallRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  const avgTasksPerDay = totalTasks > 0 ? Math.round((totalTasks / 7) * 10) / 10 : 0;

  const daysWithTasks = days.filter((d) => d.rate >= 0);
  let bestDay: WeeklyStats["bestDay"] = null;
  let worstDay: WeeklyStats["worstDay"] = null;
  if (daysWithTasks.length > 0) {
    const sorted = [...daysWithTasks].sort((a, b) => b.rate - a.rate);
    const best = sorted[0]; const worst = sorted[sorted.length - 1];
    bestDay = { date: best.date, dayName: DAY_NAMES[new Date(best.date + "T00:00:00").getDay()], rate: best.rate };
    worstDay = { date: worst.date, dayName: DAY_NAMES[new Date(worst.date + "T00:00:00").getDay()], rate: worst.rate };
  }

  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].rate === 100) streak++;
    else if (days[i].total > 0) break;
  }

  return { days, totalTasks, totalCompleted, overallRate, bestDay, worstDay, priorityBreakdown, avgTasksPerDay, streak };
}
