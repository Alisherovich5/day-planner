"use client";

import { useState } from "react";
import { DayPlan } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";
import ThemeToggle from "./ThemeToggle";
import LangSwitcher from "./LangSwitcher";
import { CalendarIcon, CheckIcon, XIcon, CopyIcon } from "./Icons";

interface HistorySidebarProps {
  plans: DayPlan[]; currentDate: string; onSelect: (d: string) => void;
  onDuplicate: (f: string, t: string) => void; open: boolean; onClose: () => void;
}

function fmtShort(d: string) {
  const dt = new Date(d + "T00:00:00");
  return `${dt.getDate()} ${["Yan","Fev","Mar","Apr","May","Iyn","Iyl","Avg","Sen","Okt","Noy","Dek"][dt.getMonth()]}`;
}
function dayChar(d: string) { return ["Ya","Du","Se","Ch","Pa","Ju","Sh"][new Date(d + "T00:00:00").getDay()]; }
function isToday(d: string) { return d === new Date().toISOString().split("T")[0]; }
function today() { return new Date().toISOString().split("T")[0]; }

export default function HistorySidebar({ plans, currentDate, onSelect, onDuplicate, open, onClose }: HistorySidebarProps) {
  const { t } = useLang();
  const sorted = [...plans].sort((a, b) => b.date.localeCompare(a.date));
  const [cpFrom, setCpFrom] = useState<string | null>(null);
  const [cpTo, setCpTo] = useState(today());
  const sel = (d: string) => { onSelect(d); onClose(); };
  const doCopy = () => { if (cpFrom && cpTo) { onDuplicate(cpFrom, cpTo); setCpFrom(null); sel(cpTo); } };

  return (
    <>
      <div className={`sidebar-overlay ${open ? "sidebar-open" : ""}`} onClick={onClose} />
      <div className={`sidebar w-[240px] h-screen overflow-y-auto flex-shrink-0 flex flex-col ${open ? "sidebar-open" : ""}`}
        style={{ borderRight: "1px solid var(--border-light)" }}>

        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <span className="text-[14px] font-semibold tracking-tight" style={{ color: "var(--text)" }}>Flowday</span>
          <div className="flex items-center gap-1">
            <LangSwitcher />
            <ThemeToggle />
            <button onClick={onClose} className="mobile-menu-btn p-1 rounded-md" style={{ color: "var(--text-3)" }}>
              <XIcon size={14} />
            </button>
          </div>
        </div>

        {cpFrom && (
          <div className="mx-3 mb-2 p-3 rounded-lg animate-fade-in" style={{ background: "var(--bg-hover)" }}>
            <p className="text-[12px] font-medium mb-1.5" style={{ color: "var(--text)" }}>{fmtShort(cpFrom)}</p>
            <input type="date" value={cpTo} onChange={(e) => setCpTo(e.target.value)}
              className="w-full text-[12px] rounded-md px-2 py-1.5 mb-2 outline-none"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" }} />
            <div className="flex gap-1.5">
              <button onClick={doCopy} className="flex-1 text-[11px] font-medium py-1.5 rounded-md text-white cursor-pointer"
                style={{ background: "var(--accent)" }}>{t("add")}</button>
              <button onClick={() => setCpFrom(null)} className="flex-1 text-[11px] py-1.5 rounded-md cursor-pointer"
                style={{ color: "var(--text-2)", border: "1px solid var(--border)" }}>{t("cancel")}</button>
            </div>
          </div>
        )}

        <div className="flex-1 px-2 pb-3 overflow-y-auto">
          <div className="flex items-center gap-1 px-2 py-1.5" style={{ color: "var(--text-3)" }}>
            <CalendarIcon size={11} />
            <span className="text-[10px] font-semibold uppercase tracking-wider">{t("daily")}</span>
          </div>
          {sorted.length === 0 && <p className="text-[12px] px-2 py-3" style={{ color: "var(--text-3)" }}>{t("noTasks")}</p>}
          {sorted.map((plan) => {
            const dn = plan.tasks.filter(t => t.completed).length;
            const tt = plan.tasks.length;
            const act = plan.date === currentDate;
            const allDn = tt > 0 && dn === tt;
            return (
              <div key={plan.date} className="group flex items-center">
                <button onClick={() => sel(plan.date)}
                  className="flex-1 text-left px-2 py-[6px] rounded-md text-[13px] transition-colors cursor-pointer"
                  style={{ background: act ? "var(--bg-hover)" : "transparent", color: act ? "var(--text)" : "var(--text-2)", fontWeight: act ? 600 : 400 }}
                  onMouseEnter={(e) => { if (!act) e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { if (!act) e.currentTarget.style.background = "transparent"; }}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[10px] w-4 text-center" style={{ color: "var(--text-3)" }}>{dayChar(plan.date)}</span>
                      {fmtShort(plan.date)}
                      {isToday(plan.date) && <span className="w-[5px] h-[5px] rounded-full" style={{ background: "var(--accent)" }} />}
                    </span>
                    <span className="text-[11px] flex items-center gap-0.5"
                      style={{ color: allDn ? "var(--green)" : "var(--text-3)" }}>
                      {allDn && <CheckIcon size={9} />} {dn}/{tt}
                    </span>
                  </div>
                  {tt > 0 && (
                    <div className="mt-1 progress-track">
                      <div className="progress-fill" style={{ width: `${(dn/tt)*100}%`, background: allDn ? "var(--green)" : "var(--accent)" }} />
                    </div>
                  )}
                </button>
                {tt > 0 && (
                  <button onClick={() => { setCpFrom(plan.date); setCpTo(today()); }}
                    className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-pointer"
                    style={{ color: "var(--text-3)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-3)"; }}>
                    <CopyIcon size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <ProfileBtn onClose={onClose} />
      </div>
    </>
  );
}

function ProfileBtn({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  if (!user) return null;
  const name = user.user_metadata?.name || user.email?.split("@")[0] || "U";
  return (
    <div className="px-3 py-2.5" style={{ borderTop: "1px solid var(--border-light)" }}>
      <a href="/profile" onClick={() => onClose()}
        className="w-full py-1.5 rounded-md text-left px-2 flex items-center gap-2 transition-colors cursor-pointer"
        style={{ color: "var(--text-2)", textDecoration: "none", display: "flex" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
          style={{ background: "var(--accent)" }}>
          {name.charAt(0).toUpperCase()}
        </div>
        <span className="text-[12px] truncate">{name}</span>
      </a>
    </div>
  );
}
