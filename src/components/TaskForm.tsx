"use client";

import { Task } from "@/lib/types";
import { generateId } from "@/lib/storage";
import { useState, useEffect } from "react";
import { ClockIcon } from "./Icons";
import { useLang } from "@/lib/lang";

interface TaskFormProps { date: string; editingTask?: Task | null; onSave: (t: Task) => void; onCancel: () => void; }

const pOpts = [
  { v: "low" as const, k: "low", c: "var(--blue)", bg: "var(--blue-light)" },
  { v: "medium" as const, k: "medium", c: "var(--amber)", bg: "var(--amber-light)" },
  { v: "high" as const, k: "high", c: "var(--red)", bg: "var(--red-light)" },
];

export default function TaskForm({ date, editingTask, onSave, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [st, setSt] = useState("09:00");
  const [et, setEt] = useState("10:00");
  const [pri, setPri] = useState<"low"|"medium"|"high">("medium");

  useEffect(() => {
    if (editingTask) { setTitle(editingTask.title); setDesc(editingTask.description||""); setSt(editingTask.startTime); setEt(editingTask.endTime); setPri(editingTask.priority); }
  }, [editingTask]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); if (!title.trim()) return;
    onSave({ id: editingTask?.id||generateId(), title: title.trim(), description: desc.trim()||undefined, date, startTime: st, endTime: et, completed: editingTask?.completed||false, priority: pri, notified: editingTask?.notified||false, createdAt: editingTask?.createdAt||Date.now() });
    setTitle(""); setDesc(""); setSt("09:00"); setEt("10:00"); setPri("medium");
  };

  const { t } = useLang();

  return (
    <form onSubmit={submit} className="rounded-lg p-4 animate-slide-up" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow)", border: "1px solid var(--border)" }}>
      <input type="text" placeholder={t("taskName")} value={title} onChange={(e) => setTitle(e.target.value)}
        autoFocus className="w-full text-[15px] font-medium bg-transparent border-none outline-none mb-2" style={{ color: "var(--text)" }} />
      <textarea placeholder={t("taskDesc")} value={desc} onChange={(e) => setDesc(e.target.value)}
        rows={2} className="w-full text-[13px] bg-transparent border-none outline-none resize-none mb-3" style={{ color: "var(--text-2)" }} />

      <div style={{ height: "1px", background: "var(--border-light)", marginBottom: "12px" }} />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
        <div className="flex items-center gap-1.5" style={{ color: "var(--text-2)" }}>
          <ClockIcon size={13} />
          <input type="time" value={st} onChange={(e) => setSt(e.target.value)}
            className="text-[13px] rounded-md px-2 py-1.5 outline-none" style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" }} />
          <span style={{ color: "var(--text-3)" }}>—</span>
          <input type="time" value={et} onChange={(e) => setEt(e.target.value)}
            className="text-[13px] rounded-md px-2 py-1.5 outline-none" style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" }} />
        </div>
        <div className="flex items-center gap-1">
          {pOpts.map((p) => (
            <button key={p.v} type="button" onClick={() => setPri(p.v)}
              className="text-[12px] font-medium px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              style={{
                color: pri === p.v ? p.c : "var(--text-3)",
                background: pri === p.v ? p.bg : "transparent",
                border: `1px solid ${pri === p.v ? "transparent" : "var(--border)"}`,
              }}>{t(p.k)}</button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel}
          className="text-[13px] px-3 py-1.5 rounded-md transition-colors cursor-pointer" style={{ color: "var(--text-2)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
          {t("cancel")}
        </button>
        <button type="submit"
          className="text-[13px] font-medium text-white px-4 py-1.5 rounded-md cursor-pointer"
          style={{ background: "var(--accent)" }}>
          {editingTask ? t("save") : t("add")}
        </button>
      </div>
    </form>
  );
}
