export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  completed: boolean;
  priority: "low" | "medium" | "high";
  notified: boolean;
  createdAt: number;
}

export interface DayPlan {
  date: string;
  tasks: Task[];
}
