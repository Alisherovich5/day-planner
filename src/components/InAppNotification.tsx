"use client";

import { Task } from "@/lib/types";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/lang";
import { BellIcon, ClockIcon, XIcon } from "./Icons";

interface Props { task: Task; onDismiss: () => void; }

export default function InAppNotification({ task, onDismiss }: Props) {
  const { t } = useLang();
  const [out, setOut] = useState(false);
  useEffect(() => {
    const tm = setTimeout(() => { setOut(true); setTimeout(onDismiss, 200); }, 8000);
    return () => clearTimeout(tm);
  }, [onDismiss]);
  const dismiss = () => { setOut(true); setTimeout(onDismiss, 200); };

  return (
    <div className={`flex items-start gap-3 rounded-lg p-3.5 w-[300px] sm:w-[340px] ${out ? "animate-notif-out" : "animate-notif-in"}`}
      style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)" }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 animate-ring"
        style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
        <BellIcon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--accent)" }}>{t("reminder")}</p>
        <p className="text-[14px] font-medium mt-0.5 truncate" style={{ color: "var(--text)" }}>{task.title}</p>
        <p className="text-[12px] mt-0.5 flex items-center gap-1" style={{ color: "var(--text-2)" }}>
          <ClockIcon size={10} /> {task.startTime}–{task.endTime}
        </p>
      </div>
      <button onClick={dismiss} className="p-1 rounded-md transition-colors cursor-pointer" style={{ color: "var(--text-3)" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
        <XIcon size={13} />
      </button>
    </div>
  );
}
