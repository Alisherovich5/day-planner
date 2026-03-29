import { Task } from "./types";
import { playAlarmSound } from "./sounds";
import { getAllPlans } from "./storage";

// ---- Service Worker Registration ----

let swRegistration: ServiceWorkerRegistration | null = null;

export async function registerServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    swRegistration = await navigator.serviceWorker.register("/sw.js");

    // Listen for messages from SW
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data.type === "TASK_COMPLETED" || event.data.type === "NOTIFICATION_CLICKED") {
        // Trigger a page reload of data
        window.dispatchEvent(new CustomEvent("sw-task-update", { detail: event.data }));
      }
    });
  } catch {
    // SW registration failed — fallback to regular notifications
  }
}

// ---- Sync tasks to SW cache so it can check in background ----

export async function syncTasksToSW(): Promise<void> {
  try {
    const plans = getAllPlans();
    const cache = await caches.open("planner-v1");
    const response = new Response(JSON.stringify(plans), {
      headers: { "Content-Type": "application/json" },
    });
    await cache.put("/planner-tasks", response);

    // Tell SW to start checking
    if (swRegistration?.active) {
      swRegistration.active.postMessage({ type: "START_CHECKING" });
    }
  } catch {
    // Cache API not available
  }
}

// ---- Permission ----

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

// ---- Send notification (foreground) ----

export function sendNotification(task: Task): void {
  playAlarmSound();

  if (Notification.permission !== "granted") return;

  // Use SW notification if available (richer, with actions)
  if (swRegistration) {
    const options: NotificationOptions & Record<string, unknown> = {
      body: `${task.title}\n${task.startTime} — ${task.endTime}`,
      tag: task.id,
      requireInteraction: true,
    };
    // These are valid for ServiceWorker notifications but not in TS lib types
    (options as Record<string, unknown>).vibrate = [200, 100, 200, 100, 200];
    (options as Record<string, unknown>).data = { taskId: task.id, date: task.date };
    (options as Record<string, unknown>).actions = [
      { action: "done", title: "Bajarildi" },
      { action: "dismiss", title: "Keyinroq" },
    ];
    swRegistration.showNotification("Eslatma — Kunlik Reja", options);
  } else {
    // Fallback: basic notification
    new Notification("Eslatma", {
      body: `"${task.title}" — ${task.startTime} - ${task.endTime}`,
      tag: task.id,
      requireInteraction: true,
    });
  }
}

// ---- Check task notifications (foreground) ----

export function checkTaskNotifications(
  tasks: Task[],
  onNotify: (task: Task) => void
): void {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  tasks.forEach((task) => {
    if (!task.completed && !task.notified && task.startTime <= currentTime) {
      sendNotification(task);
      onNotify(task);
    }
  });
}
