// Service Worker for background notifications

const CACHE_NAME = "planner-v1";
const STORAGE_KEY = "daily-planner-data";

// Install
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for messages from main app
self.addEventListener("message", (event) => {
  if (event.data.type === "START_CHECKING") {
    startNotificationLoop();
  }
  if (event.data.type === "STOP_CHECKING") {
    stopNotificationLoop();
  }
});

let checkInterval = null;

function startNotificationLoop() {
  if (checkInterval) return;
  // Check every 30 seconds
  checkInterval = setInterval(() => {
    checkAndNotify();
  }, 30000);
  // Also check immediately
  checkAndNotify();
}

function stopNotificationLoop() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

async function checkAndNotify() {
  try {
    // Read tasks from IndexedDB or ask the client
    const clients = await self.clients.matchAll({ type: "window" });

    if (clients.length > 0) {
      // If app is open, let the main thread handle it
      return;
    }

    // App is closed — we need to check ourselves
    // Read from localStorage isn't available in SW, so we use a cache-based approach
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match("/planner-tasks");
    if (!response) return;

    const plans = await response.json();
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime =
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0");

    const todayPlan = plans.find((p) => p.date === today);
    if (!todayPlan) return;

    const tasksToNotify = todayPlan.tasks.filter(
      (task) => !task.completed && !task.notified && task.startTime <= currentTime
    );

    for (const task of tasksToNotify) {
      await self.registration.showNotification("Eslatma — Kunlik Reja", {
        body: `${task.title}\n${task.startTime} — ${task.endTime}`,
        tag: task.id,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true,
        data: { taskId: task.id, date: today },
        actions: [
          { action: "done", title: "Bajarildi" },
          { action: "dismiss", title: "Keyinroq" },
        ],
      });

      // Mark as notified in cache
      task.notified = true;
    }

    if (tasksToNotify.length > 0) {
      // Save updated data back to cache
      const updatedResponse = new Response(JSON.stringify(plans), {
        headers: { "Content-Type": "application/json" },
      });
      await cache.put("/planner-tasks", updatedResponse);
    }
  } catch (e) {
    // Silent fail
  }
}

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "done") {
    // Mark task as completed
    event.waitUntil(markTaskDone(event.notification.data));
  }

  // Open or focus the app
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            client.postMessage({
              type: "NOTIFICATION_CLICKED",
              data: event.notification.data,
              action: event.action,
            });
            return;
          }
        }
        return self.clients.openWindow("/");
      })
  );
});

async function markTaskDone(data) {
  if (!data) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match("/planner-tasks");
    if (!response) return;

    const plans = await response.json();
    const plan = plans.find((p) => p.date === data.date);
    if (!plan) return;

    const task = plan.tasks.find((t) => t.id === data.taskId);
    if (task) {
      task.completed = true;
      task.notified = true;
    }

    const updatedResponse = new Response(JSON.stringify(plans), {
      headers: { "Content-Type": "application/json" },
    });
    await cache.put("/planner-tasks", updatedResponse);

    // Also tell the main app if open
    const clients = await self.clients.matchAll({ type: "window" });
    for (const client of clients) {
      client.postMessage({ type: "TASK_COMPLETED", data });
    }
  } catch (e) {
    // Silent fail
  }
}
