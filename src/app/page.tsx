"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Task, DayPlan } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import {
  getDayPlanAsync, getAllPlansAsync, addTaskAsync, updateTaskAsync, deleteTaskAsync, duplicatePlanAsync, clearDayPlanAsync,
} from "@/lib/storage";
import { requestNotificationPermission, registerServiceWorker, syncTasksToSW } from "@/lib/notifications";
import { playAlarmSound, warmUpAudio } from "@/lib/sounds";
import { useLang } from "@/lib/lang";
import TaskItem from "@/components/TaskItem";
import TaskForm from "@/components/TaskForm";
import DateNav from "@/components/DateNav";
import HistorySidebar from "@/components/HistorySidebar";
import InAppNotification from "@/components/InAppNotification";
import SmartInput from "@/components/SmartInput";
import NotificationBanner from "@/components/NotificationBanner";
import AuthPage from "@/components/AuthPage";
import ConfirmModal from "@/components/ConfirmModal";
import { PlusIcon, FileTextIcon, MenuIcon, TrendingUpIcon, CalendarPlusIcon, CheckIcon, CopyIcon, TrashIcon } from "@/components/Icons";

function getTomorrow(): string {
  const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0];
}

function formatCopyText(plan: DayPlan): string {
  if (plan.tasks.length === 0) return "";
  const d = new Date(plan.date + "T00:00:00");
  const days = ["Yakshanba","Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba"];
  const months = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const header = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${yyyy}`;
  const dateNum = `${dd}.${mm}.${yyyy}`;

  const done = plan.tasks.filter(t => t.completed).length;
  const total = plan.tasks.length;
  const pct = Math.round((done / total) * 100);

  const lines = plan.tasks.map((t) => {
    const check = t.completed ? "[\u2705]" : "[ ]";
    return `${check} ${t.startTime}\u2013${t.endTime}  ${t.title}`;
  });

  return [
    `\uD83D\uDCCB Kunlik reja \u2014 ${dateNum}`,
    `\uD83D\uDCC5 ${header}`,
    "",
    ...lines,
    "",
    `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
    `\u2705 ${done}/${total} bajarildi (${pct}%)`,
    `\u23F0 Flowday \u2014 flowday.app`,
  ].join("\n");
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLang();
  const [currentDate, setCurrentDate] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const d = params.get("date");
      if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    }
    return new Date().toISOString().split("T")[0];
  });
  const [dayPlan, setDayPlan] = useState<DayPlan>({ date: currentDate, tasks: [] });
  const [allPlans, setAllPlans] = useState<DayPlan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [notifications, setNotifications] = useState<Task[]>([]);
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [clearDay, setClearDay] = useState(false);
  const notifRef = useRef<ReturnType<typeof setInterval>>();

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [plan, plans] = await Promise.all([getDayPlanAsync(user.id, currentDate), getAllPlansAsync(user.id)]);
      setDayPlan(plan);
      setAllPlans(plans);
      // Cache locally for resilience
      if (typeof window !== "undefined" && plans.length > 0) {
        localStorage.setItem("daily-planner-data", JSON.stringify(plans));
      }
      syncTasksToSW();
    } catch (err) {
      console.error("loadData error:", err);
    }
  }, [currentDate, user]);

  useEffect(() => {
    setMounted(true); requestNotificationPermission(); registerServiceWorker();
    const w = () => { warmUpAudio(); document.removeEventListener("click", w); };
    document.addEventListener("click", w, { once: true });
  }, []);

  useEffect(() => { if (mounted && user) loadData(); }, [mounted, user, loadData]);

  useEffect(() => {
    if (!mounted || !user) return;
    let dailySummarySent = false;

    const check = async () => {
      const today = new Date().toISOString().split("T")[0];
      const plan = await getDayPlanAsync(user.id, today);
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const ct = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;

      // Task reminders
      for (const task of plan.tasks) {
        if (!task.completed && !task.notified && task.startTime <= ct) {
          playAlarmSound();
          if (Notification.permission === "granted") {
            new Notification("Eslatma", { body: `${task.title} — ${task.startTime}`, tag: task.id, requireInteraction: true });
          }
          await updateTaskAsync(user.id, task.id, { notified: true });
          setNotifications((p) => [...p, task]);
          if (today === currentDate) loadData();
        }
      }

      // 21:00 daily summary
      if (h === 21 && m < 5 && !dailySummarySent && plan.tasks.length > 0) {
        dailySummarySent = true;
        const done = plan.tasks.filter(t => t.completed).length;
        const total = plan.tasks.length;
        const pct = Math.round((done / total) * 100);
        const pending = plan.tasks.filter(t => !t.completed);

        let body = `${done}/${total} bajarildi (${pct}%)`;
        if (pending.length > 0) {
          body += `\n\nBajarilmagan:\n${pending.map(t => `• ${t.title}`).join("\n")}`;
        }
        if (pct === 100) {
          body = `Barcha ${total} ta task bajarildi! Ajoyib kun!`;
        }

        playAlarmSound();
        if (Notification.permission === "granted") {
          new Notification("Kun yakuni", { body, tag: "daily-summary", requireInteraction: true });
        }
        setNotifications((p) => [...p, {
          id: "daily-summary-" + today,
          title: pct === 100 ? `Ajoyib! ${total}/${total} bajarildi` : `Kun yakuni: ${done}/${total} (${pct}%)`,
          date: today, startTime: "21:00", endTime: "21:00",
          completed: false, priority: pct === 100 ? "low" : pct >= 50 ? "medium" : "high",
          notified: true, createdAt: Date.now(),
        }]);
      }
    };

    check(); notifRef.current = setInterval(check, 30000);
    return () => clearInterval(notifRef.current);
  }, [mounted, user, currentDate, loadData]);

  const addT = async (task: Task) => {
    if (!user) return;
    if (editingTask) await updateTaskAsync(user.id, task.id, task);
    else await addTaskAsync(user.id, task);
    setShowForm(false); setEditingTask(null); loadData();
  };
  const smartAdd = async (task: Task) => { if (user) { await addTaskAsync(user.id, task); loadData(); } };
  const toggle = async (id: string) => { if (!user) return; const t = dayPlan.tasks.find(t => t.id === id); if (t) { await updateTaskAsync(user.id, id, { completed: !t.completed }); loadData(); } };
  const askDel = (id: string) => { setDeleteId(id); };
  const confirmDel = async () => {
    if (user && deleteId) { await deleteTaskAsync(user.id, deleteId); setDeleteId(null); loadData(); }
  };
  const confirmClearDay = async () => {
    if (user) { await clearDayPlanAsync(user.id, currentDate); setClearDay(false); loadData(); }
  };
  const edit = (t: Task) => { setEditingTask(t); setShowForm(true); };
  const dup = async (f: string, t: string) => { if (user) { await duplicatePlanAsync(user.id, f, t); setCurrentDate(t); loadData(); } };

  const handleCopy = async () => {
    const text = formatCopyText(dayPlan);
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isTom = currentDate === getTomorrow();
  const isPast = currentDate < new Date().toISOString().split("T")[0];
  const done = dayPlan.tasks.filter(t => t.completed).length;
  const total = dayPlan.tasks.length;
  const pct = total > 0 ? (done / total) * 100 : 0;

  if (!mounted || authLoading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg)" }}>
      <div className="text-sm" style={{ color: "var(--text-3)" }}>Yuklanmoqda...</div>
    </div>
  );

  if (!user) return <AuthPage />;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <HistorySidebar plans={allPlans} currentDate={currentDate} onSelect={setCurrentDate}
        onDuplicate={dup} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[680px] mx-auto px-5 sm:px-10 py-8 sm:py-12">

          {/* Header */}
          <div className="flex items-center gap-1 mb-1 overflow-hidden">
            <button onClick={() => setSidebarOpen(true)} className="mobile-menu-btn p-1.5 rounded-[4px] flex-shrink-0 -ml-1" style={{ color: "var(--text-2)" }}>
              <MenuIcon size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <DateNav date={currentDate} onChange={setCurrentDate} />
            </div>
            <div className="flex items-center flex-shrink-0">
              {total > 0 && (
                <button onClick={() => setClearDay(true)} className="p-1.5 rounded-[4px] transition-colors" title={t("delete")}
                  style={{ color: "var(--text-3)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.background = "var(--red-light)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "transparent"; }}>
                  <TrashIcon size={14} />
                </button>
              )}
              {total > 0 && (
                <button onClick={handleCopy} className="p-1.5 rounded-[4px] transition-colors" title={t("copyTg")}
                  style={{ color: copied ? "var(--accent)" : "var(--text-3)" }}
                  onMouseEnter={(e) => { if (!copied) { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-light)"; } }}
                  onMouseLeave={(e) => { if (!copied) { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "transparent"; } }}>
                  {copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
                </button>
              )}
              {!isTom && (
                <button onClick={() => setCurrentDate(getTomorrow())} className="p-1.5 rounded-[4px] transition-colors"
                  style={{ color: "var(--text-3)" }} title="Ertangi reja"
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-light)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "transparent"; }}>
                  <CalendarPlusIcon size={15} />
                </button>
              )}
              <a href="/stats" className="p-1.5 rounded-[4px] transition-colors inline-flex"
                style={{ color: "var(--text-3)" }} title="Haftalik tahlil"
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-light)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "transparent"; }}>
                <TrendingUpIcon size={15} />
              </a>
            </div>
          </div>

          {/* Progress */}
          {total > 0 && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-5"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <div className="flex-1 progress-track" style={{ height: "6px" }}>
                <div className="progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? "var(--green)" : "var(--accent)" }} />
              </div>
              <span className="text-[12px] font-semibold flex-shrink-0" style={{ color: pct === 100 ? "var(--green)" : "var(--text)" }}>
                {Math.round(pct)}%
              </span>
              <span className="text-[11px] flex-shrink-0" style={{ color: "var(--text-3)" }}>
                {done}/{total}
              </span>
            </div>
          )}

          {!total && <div className="mb-5" />}

          <NotificationBanner />

          {/* Smart Input — only for today and future */}
          {!isPast && (
            <div className="mb-4">
              <SmartInput date={currentDate} onTaskCreated={smartAdd} />
            </div>
          )}

          {/* Divider */}
          <div style={{ height: "1px", background: "var(--border-light)", margin: "0 0 12px" }} />

          {/* Form — only for today and future */}
          {!isPast && (showForm ? (
            <div className="mb-4">
              <TaskForm date={currentDate} editingTask={editingTask} onSave={addT}
                onCancel={() => { setShowForm(false); setEditingTask(null); }} />
            </div>
          ) : (
            <button onClick={() => setShowForm(true)}
              className="w-full mb-4 py-2.5 text-[13px] transition-all flex items-center justify-center gap-1.5 rounded-lg border border-dashed"
              style={{ color: "var(--text-3)", borderColor: "var(--border)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-light)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.borderColor = "var(--border)"; }}>
              <PlusIcon size={14} /> {t("addTask")}
            </button>
          ))}

          {/* Tasks */}
          <div>
            {dayPlan.tasks.length === 0 && !showForm && (
              <div className="text-center py-16 animate-fade-in">
                <div className="mb-3 flex justify-center" style={{ color: "var(--text-3)" }}>
                  <FileTextIcon size={32} />
                </div>
                <p className="text-sm" style={{ color: "var(--text-2)" }}>
                  {isTom ? t("tomorrowPlan") : t("noTasks")}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
                  {t("noTasksSub")}
                </p>
              </div>
            )}
            {dayPlan.tasks.map((task) => (
              <TaskItem key={task.id} task={task} onToggle={toggle} onDelete={askDel} onEdit={edit} />
            ))}
          </div>
        </div>
      </div>

      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 space-y-2 z-50">
        {notifications.map((t) => <InAppNotification key={t.id} task={t} onDismiss={() => setNotifications(p => p.filter(n => n.id !== t.id))} />)}
      </div>


      {deleteId && (
        <ConfirmModal
          title={t("deleteTitle")}
          message={t("deleteMsg")}
          confirmLabel={t("delete")}
          onConfirm={confirmDel}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {clearDay && (
        <ConfirmModal
          title={t("deleteTitle")}
          message={`${currentDate} — barcha tasklar o'chiriladi`}
          confirmLabel={t("delete")}
          onConfirm={confirmClearDay}
          onCancel={() => setClearDay(false)}
        />
      )}
    </div>
  );
}
