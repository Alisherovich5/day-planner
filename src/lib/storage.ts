import { Task, DayPlan } from "./types";
import { supabase } from "./supabase";

// ── Helpers ──

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || undefined,
    date: row.date as string,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    completed: row.completed as boolean,
    priority: row.priority as "low" | "medium" | "high",
    notified: row.notified as boolean,
    createdAt: row.created_at as number,
  };
}

// ── Read ──

export async function getAllPlansAsync(userId: string): Promise<DayPlan[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error || !data) {
    console.error("Supabase getAllPlans error:", error?.message);
    return getAllPlans(); // fallback to localStorage
  }

  const planMap = new Map<string, Task[]>();
  data.forEach((row) => {
    const task = rowToTask(row);
    const existing = planMap.get(task.date) || [];
    existing.push(task);
    planMap.set(task.date, existing);
  });

  return Array.from(planMap.entries()).map(([date, tasks]) => ({
    date,
    tasks: tasks.sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));
}

export async function getDayPlanAsync(userId: string, date: string): Promise<DayPlan> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .order("start_time");

  if (error || !data) {
    console.error("Supabase getDayPlan error:", error?.message);
    return getDayPlan(date); // fallback to localStorage
  }
  return { date, tasks: data.map(rowToTask) };
}

// ── Write ──

export async function addTaskAsync(userId: string, task: Task): Promise<void> {
  const { error } = await supabase.from("tasks").insert({
    id: task.id,
    user_id: userId,
    title: task.title,
    description: task.description || null,
    date: task.date,
    start_time: task.startTime,
    end_time: task.endTime,
    completed: task.completed,
    priority: task.priority,
    notified: task.notified,
    created_at: task.createdAt,
  });
  if (error) {
    console.error("Supabase addTask error:", error.message);
    // Fallback: save to localStorage
    addTask(task.date, task);
  }
}

export async function updateTaskAsync(userId: string, taskId: string, updates: Partial<Task>): Promise<void> {
  const mapped: Record<string, unknown> = {};
  if (updates.title !== undefined) mapped.title = updates.title;
  if (updates.description !== undefined) mapped.description = updates.description || null;
  if (updates.startTime !== undefined) mapped.start_time = updates.startTime;
  if (updates.endTime !== undefined) mapped.end_time = updates.endTime;
  if (updates.completed !== undefined) mapped.completed = updates.completed;
  if (updates.priority !== undefined) mapped.priority = updates.priority;
  if (updates.notified !== undefined) mapped.notified = updates.notified;
  mapped.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("tasks")
    .update(mapped)
    .eq("id", taskId)
    .eq("user_id", userId);
  if (error) {
    console.error("Supabase updateTask error:", error.message);
    // Fallback: find date from current localStorage
    const plans = getAllPlans();
    for (const p of plans) {
      const idx = p.tasks.findIndex((t) => t.id === taskId);
      if (idx >= 0) { updateTask(p.date, taskId, updates); break; }
    }
  }
}

export async function deleteTaskAsync(userId: string, taskId: string): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId);
  if (error) {
    console.error("Supabase deleteTask error:", error.message);
    const plans = getAllPlans();
    for (const p of plans) {
      if (p.tasks.some((t) => t.id === taskId)) { deleteTask(p.date, taskId); break; }
    }
  }
}

export async function duplicatePlanAsync(userId: string, fromDate: string, toDate: string): Promise<void> {
  const source = await getDayPlanAsync(userId, fromDate);
  const inserts = source.tasks.map((t) => ({
    id: generateId(),
    user_id: userId,
    title: t.title,
    description: t.description || null,
    date: toDate,
    start_time: t.startTime,
    end_time: t.endTime,
    completed: false,
    priority: t.priority,
    notified: false,
    created_at: Date.now(),
  }));
  if (inserts.length > 0) {
    await supabase.from("tasks").insert(inserts);
  }
}

export async function clearDayPlanAsync(userId: string, date: string): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("user_id", userId)
    .eq("date", date);
  if (error) {
    console.error("Supabase clearDayPlan error:", error.message);
    // Fallback localStorage
    const plans = getAllPlans();
    const idx = plans.findIndex(p => p.date === date);
    if (idx >= 0) { plans.splice(idx, 1); savePlansLocal(plans); }
  }
}

// ── Legacy sync wrappers (for localStorage fallback during offline) ──

const STORAGE_KEY = "daily-planner-data";

export function getAllPlans(): DayPlan[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function getDayPlan(date: string): DayPlan {
  const plans = getAllPlans();
  return plans.find((p) => p.date === date) || { date, tasks: [] };
}

function savePlansLocal(plans: DayPlan[]): void {
  plans.sort((a, b) => b.date.localeCompare(a.date));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function addTask(date: string, task: Task): void {
  const plans = getAllPlans();
  const plan = plans.find((p) => p.date === date) || { date, tasks: [] };
  if (!plans.find((p) => p.date === date)) plans.push(plan);
  plan.tasks.push(task);
  plan.tasks.sort((a, b) => a.startTime.localeCompare(b.startTime));
  savePlansLocal(plans);
}

export function updateTask(date: string, taskId: string, updates: Partial<Task>): void {
  const plans = getAllPlans();
  const plan = plans.find((p) => p.date === date);
  if (!plan) return;
  const idx = plan.tasks.findIndex((t) => t.id === taskId);
  if (idx >= 0) {
    plan.tasks[idx] = { ...plan.tasks[idx], ...updates };
    plan.tasks.sort((a, b) => a.startTime.localeCompare(b.startTime));
    savePlansLocal(plans);
  }
}

export function deleteTask(date: string, taskId: string): void {
  const plans = getAllPlans();
  const plan = plans.find((p) => p.date === date);
  if (!plan) return;
  plan.tasks = plan.tasks.filter((t) => t.id !== taskId);
  savePlansLocal(plans);
}

export function duplicatePlan(fromDate: string, toDate: string): void {
  const plans = getAllPlans();
  const source = plans.find((p) => p.date === fromDate);
  if (!source) return;
  const newPlan: DayPlan = {
    date: toDate,
    tasks: source.tasks.map((t) => ({
      ...t, id: generateId(), date: toDate, completed: false, notified: false, createdAt: Date.now(),
    })),
  };
  const existing = plans.findIndex((p) => p.date === toDate);
  if (existing >= 0) plans[existing] = newPlan; else plans.push(newPlan);
  savePlansLocal(plans);
}
