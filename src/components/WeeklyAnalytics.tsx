"use client";

import { useState, useEffect } from "react";
import { getWeeklyStatsAsync, WeeklyStats } from "@/lib/analytics";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";
import { TrendingUpIcon, XIcon, BarChartIcon, CalendarIcon, TargetIcon, CheckIcon } from "./Icons";

interface WeeklyAnalyticsProps { onClose: () => void; onSelectDate: (d: string) => void; }

export default function WeeklyAnalytics({ onClose, onSelectDate }: WeeklyAnalyticsProps) {
  const { user } = useAuth();
  const { t } = useLang();
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  useEffect(() => { if (user) getWeeklyStatsAsync(user.id).then(setStats); }, [user]);
  if (!stats) return null;
  const maxT = Math.max(...stats.days.map(d => d.total), 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--overlay)" }}>
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl animate-slide-up"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
        <div className="flex items-center justify-between p-4 sm:p-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2" style={{ color: "var(--text)" }}>
            <TrendingUpIcon size={18} /><h2 className="text-[15px] font-semibold">Haftalik tahlil</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md cursor-pointer" style={{ color: "var(--text-3)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <XIcon size={16} />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatCard label={t("total")} value={String(stats.totalTasks)} />
            <StatCard label={t("done")} value={String(stats.totalCompleted)} color="var(--green)" />
            <StatCard label={t("efficiency")} value={`${stats.overallRate}%`} color="var(--accent)" />
            <StatCard label={t("avgDay")} value={String(stats.avgTasksPerDay)} />
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-3" style={{ color: "var(--text-2)" }}>
              <BarChartIcon size={13} /><span className="text-[12px] font-medium">Kunlik</span>
            </div>
            <div className="flex items-end gap-1.5 sm:gap-2" style={{ height: "100px" }}>
              {stats.days.map((day) => {
                const h = day.total > 0 ? Math.max((day.total / maxT) * 100, 8) : 4;
                const td = day.date === new Date().toISOString().split("T")[0];
                return (
                  <button key={day.date} onClick={() => { onSelectDate(day.date); onClose(); }}
                    className="flex-1 flex flex-col items-center justify-end gap-1 group cursor-pointer" style={{ height: "100%" }}>
                    <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-2)" }}>
                      {day.total > 0 ? `${day.completed}/${day.total}` : "—"}
                    </span>
                    <div className="w-full relative rounded-sm overflow-hidden" style={{ height: `${h}%` }}>
                      <div className="absolute inset-0" style={{ background: "var(--border-light)" }} />
                      <div className="absolute bottom-0 left-0 right-0 rounded-sm transition-all" style={{
                        height: day.total > 0 ? `${(day.completed/day.total)*100}%` : "0%",
                        background: day.rate === 100 ? "var(--green)" : "var(--accent)",
                      }} />
                    </div>
                    <span className="text-[10px]" style={{ color: td ? "var(--accent)" : "var(--text-3)", fontWeight: td ? 600 : 400 }}>
                      {day.dayName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {(stats.bestDay || stats.worstDay) && (
            <div className="grid grid-cols-2 gap-2">
              {stats.bestDay && (
                <div className="rounded-lg p-3" style={{ background: "var(--green-light)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-1 mb-1" style={{ color: "var(--green)" }}>
                    <CheckIcon size={11} /><span className="text-[10px] font-semibold uppercase">Eng yaxshi</span>
                  </div>
                  <p className="text-[13px] font-medium" style={{ color: "var(--text)" }}>{stats.bestDay.dayName}</p>
                  <p className="text-[12px]" style={{ color: "var(--text-2)" }}>{stats.bestDay.rate}%</p>
                </div>
              )}
              {stats.worstDay && stats.worstDay.date !== stats.bestDay?.date && (
                <div className="rounded-lg p-3" style={{ background: "var(--red-light)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-1 mb-1" style={{ color: "var(--red)" }}>
                    <CalendarIcon size={11} /><span className="text-[10px] font-semibold uppercase">Eng past</span>
                  </div>
                  <p className="text-[13px] font-medium" style={{ color: "var(--text)" }}>{stats.worstDay.dayName}</p>
                  <p className="text-[12px]" style={{ color: "var(--text-2)" }}>{stats.worstDay.rate}%</p>
                </div>
              )}
            </div>
          )}

          {stats.totalTasks > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2" style={{ color: "var(--text-2)" }}>
                <TargetIcon size={13} /><span className="text-[12px] font-medium">Muhimlik</span>
              </div>
              <div className="flex gap-0.5 rounded-md overflow-hidden" style={{ height: "6px" }}>
                {stats.priorityBreakdown.high > 0 && <div style={{ width: `${(stats.priorityBreakdown.high/stats.totalTasks)*100}%`, background: "var(--red)" }} />}
                {stats.priorityBreakdown.medium > 0 && <div style={{ width: `${(stats.priorityBreakdown.medium/stats.totalTasks)*100}%`, background: "var(--amber)" }} />}
                {stats.priorityBreakdown.low > 0 && <div style={{ width: `${(stats.priorityBreakdown.low/stats.totalTasks)*100}%`, background: "var(--blue)" }} />}
              </div>
              <div className="flex gap-4 mt-2">
                <Leg c="var(--red)" l={t("high")} n={stats.priorityBreakdown.high} />
                <Leg c="var(--amber)" l={t("medium")} n={stats.priorityBreakdown.medium} />
                <Leg c="var(--blue)" l={t("low")} n={stats.priorityBreakdown.low} />
              </div>
            </div>
          )}

          {stats.streak > 0 && (
            <div className="rounded-lg p-3 text-center" style={{ background: "var(--accent-light)", border: "1px solid var(--border)" }}>
              <p className="text-xl font-bold" style={{ color: "var(--accent)" }}>{stats.streak}</p>
              <p className="text-[12px]" style={{ color: "var(--text-2)" }}>kun ketma-ket 100%</p>
            </div>
          )}

          {stats.totalTasks === 0 && (
            <div className="text-center py-8">
              <p className="text-[13px]" style={{ color: "var(--text-2)" }}>Hafta davomida tasklar topilmadi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: "var(--bg-hover)" }}>
      <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-3)" }}>{label}</p>
      <p className="text-[18px] font-bold mt-0.5" style={{ color: color || "var(--text)" }}>{value}</p>
    </div>
  );
}

function Leg({ c, l, n }: { c: string; l: string; n: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ background: c }} />
      <span className="text-[11px]" style={{ color: "var(--text-2)" }}>{l}: {n}</span>
    </div>
  );
}
