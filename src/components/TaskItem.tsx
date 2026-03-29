"use client";

import { Task } from "@/lib/types";
import { useState } from "react";
import { useLang } from "@/lib/lang";
import { CheckIcon, EditIcon, TrashIcon, ClockIcon, BellIcon, AlertCircleIcon } from "./Icons";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const pCfg = {
  high:   { color: "var(--red)",   label: "high" },
  medium: { color: "var(--amber)", label: "medium" },
  low:    { color: "var(--blue)",  label: "low" },
};

export default function TaskItem({ task, onToggle, onDelete, onEdit }: TaskItemProps) {
  const [hover, setHover] = useState(false);
  const { t } = useLang();
  const p = pCfg[task.priority];
  const done = task.completed;
  const overdue = !done && (() => {
    const now = new Date();
    const [sh, sm] = task.startTime.split(":").map(Number);
    const [eh, em] = task.endTime.split(":").map(Number);
    const end = new Date();
    end.setHours(eh, em, 0);
    // If endTime <= startTime, task spans midnight — not overdue until next day
    if (eh * 60 + em <= sh * 60 + sm) return false;
    return now > end;
  })();

  return (
    <div
      className="group flex items-start gap-3 p-3 rounded-lg transition-all animate-fade-in"
      style={{
        background: hover ? "var(--bg-hover)" : done ? "var(--bg-2)" : "var(--bg-card)",
        border: `1px solid ${overdue ? "var(--red)" : hover ? "var(--border)" : "var(--border-light)"}`,
        opacity: done ? 0.5 : 1,
        marginBottom: "6px",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Checkbox */}
      <button type="button" onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
        className={`mt-[3px] w-[18px] h-[18px] rounded-[5px] flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${done ? "animate-check-pop" : ""}`}
        style={{
          background: done ? "var(--accent)" : "transparent",
          border: done ? "none" : "1.5px solid var(--text-3)",
        }}>
        {done && <CheckIcon size={10} className="text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] leading-[1.4]"
          style={{ color: done ? "var(--text-3)" : "var(--text)", textDecoration: done ? "line-through" : "none" }}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: "var(--text-2)" }}>{task.description}</p>
        )}
        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] flex items-center gap-1 px-2 py-[2px] rounded-[4px]"
            style={{ color: overdue ? "var(--red)" : "var(--text-2)", background: "var(--bg-2)" }}>
            <ClockIcon size={10} /> {task.startTime} — {task.endTime}
          </span>
          <span className="text-[10px] font-semibold px-1.5 py-[2px] rounded-[4px]" style={{ color: p.color }}>
            {t(p.label)}
          </span>
          {overdue && (
            <span className="text-[10px] font-medium flex items-center gap-0.5" style={{ color: "var(--red)" }}>
              <AlertCircleIcon size={9} /> {t("overdue")}
            </span>
          )}
          {task.notified && !done && (
            <span className="animate-ring" style={{ color: "var(--accent)" }}><BellIcon size={10} /></span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0 mt-[2px]">
        <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(task); }}
          className="p-1.5 rounded-md transition-colors cursor-pointer" style={{ color: "var(--text-3)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-light)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "transparent"; }}>
          <EditIcon size={13} />
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="p-1.5 rounded-md transition-colors cursor-pointer" style={{ color: "var(--text-3)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.background = "var(--red-light)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "transparent"; }}>
          <TrashIcon size={13} />
        </button>
      </div>
    </div>
  );
}
