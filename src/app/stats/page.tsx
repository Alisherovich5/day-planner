"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { getWeeklyStatsAsync, WeeklyStats } from "@/lib/analytics";
import AuthPage from "@/components/AuthPage";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, BarChartIcon, CheckIcon, TrendingUpIcon, CalendarIcon, TargetIcon } from "@/components/Icons";

export default function StatsRoute() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<WeeklyStats | null>(null);

  useEffect(() => {
    if (user) getWeeklyStatsAsync(user.id).then(setStats);
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg)" }}>
      <div className="text-sm" style={{ color: "var(--text-3)" }}>Yuklanmoqda...</div>
    </div>
  );

  if (!user) return <AuthPage />;

  const maxT = stats ? Math.max(...stats.days.map(d => d.total), 1) : 1;

  return (
    <div className="h-screen overflow-y-auto" style={{ background: "var(--bg)" }}>
      <div className="max-w-[520px] mx-auto px-5 sm:px-8 py-8 sm:py-12">
        {/* Back */}
        <button onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-[13px] mb-6 cursor-pointer transition-colors rounded-md px-2 py-1.5 -ml-2"
          style={{ color: "var(--text-2)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-light)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-2)"; e.currentTarget.style.background = "transparent"; }}>
          <ChevronLeftIcon size={16} /> Ortga
        </button>

        <h1 className="text-[20px] font-bold mb-6 flex items-center gap-2" style={{ color: "var(--text)" }}>
          <TrendingUpIcon size={20} /> Haftalik statistika
        </h1>

        {!stats || stats.totalTasks === 0 ? (
          <div className="text-center py-16">
            <p className="text-[14px]" style={{ color: "var(--text-2)" }}>Hafta davomida tasklar topilmadi</p>
            <p className="text-[13px] mt-1" style={{ color: "var(--text-3)" }}>Task qo&apos;shib boshlang</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Stat icon={<CalendarIcon size={12} />} label="Jami" value={String(stats.totalTasks)} />
              <Stat icon={<CheckIcon size={12} />} label="Bajarildi" value={String(stats.totalCompleted)} color="var(--green)" />
              <Stat icon={<TrendingUpIcon size={12} />} label="Samaradorlik" value={`${stats.overallRate}%`} color="var(--accent)" />
              <Stat icon={<BarChartIcon size={12} />} label="O'rtacha/kun" value={String(stats.avgTasksPerDay)} />
            </div>

            {/* Bar chart */}
            <div>
              <p className="text-[12px] font-semibold mb-3 flex items-center gap-1.5" style={{ color: "var(--text-2)" }}>
                <BarChartIcon size={13} /> Kunlik ko&apos;rsatkich
              </p>
              <div className="flex items-end gap-2" style={{ height: "120px" }}>
                {stats.days.map((day) => {
                  const h = day.total > 0 ? Math.max((day.total / maxT) * 100, 8) : 4;
                  const td = day.date === new Date().toISOString().split("T")[0];
                  return (
                    <button key={day.date} onClick={() => router.push(`/?date=${day.date}`)}
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

            {/* Best/Worst */}
            {(stats.bestDay || stats.worstDay) && (
              <div className="grid grid-cols-2 gap-2">
                {stats.bestDay && (
                  <div className="rounded-lg p-3" style={{ background: "var(--green-light)", border: "1px solid var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase mb-1" style={{ color: "var(--green)" }}>Eng yaxshi</p>
                    <p className="text-[14px] font-medium" style={{ color: "var(--text)" }}>{stats.bestDay.dayName}</p>
                    <p className="text-[12px]" style={{ color: "var(--text-2)" }}>{stats.bestDay.rate}%</p>
                  </div>
                )}
                {stats.worstDay && stats.worstDay.date !== stats.bestDay?.date && (
                  <div className="rounded-lg p-3" style={{ background: "var(--red-light)", border: "1px solid var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase mb-1" style={{ color: "var(--red)" }}>Eng past</p>
                    <p className="text-[14px] font-medium" style={{ color: "var(--text)" }}>{stats.worstDay.dayName}</p>
                    <p className="text-[12px]" style={{ color: "var(--text-2)" }}>{stats.worstDay.rate}%</p>
                  </div>
                )}
              </div>
            )}

            {/* Priority breakdown */}
            <div>
              <p className="text-[12px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: "var(--text-2)" }}>
                <TargetIcon size={13} /> Muhimlik taqsimoti
              </p>
              <div className="flex gap-0.5 rounded-md overflow-hidden" style={{ height: "8px" }}>
                {stats.priorityBreakdown.high > 0 && <div style={{ width: `${(stats.priorityBreakdown.high/stats.totalTasks)*100}%`, background: "var(--red)" }} />}
                {stats.priorityBreakdown.medium > 0 && <div style={{ width: `${(stats.priorityBreakdown.medium/stats.totalTasks)*100}%`, background: "var(--amber)" }} />}
                {stats.priorityBreakdown.low > 0 && <div style={{ width: `${(stats.priorityBreakdown.low/stats.totalTasks)*100}%`, background: "var(--blue)" }} />}
              </div>
              <div className="flex gap-4 mt-2">
                <Leg c="var(--red)" l="Yuqori" n={stats.priorityBreakdown.high} />
                <Leg c="var(--amber)" l="O'rta" n={stats.priorityBreakdown.medium} />
                <Leg c="var(--blue)" l="Past" n={stats.priorityBreakdown.low} />
              </div>
            </div>

            {/* Streak */}
            {stats.streak > 0 && (
              <div className="flex items-center justify-center gap-2 py-3 rounded-lg" style={{ background: "var(--accent-light)", border: "1px solid var(--border)" }}>
                <span className="text-[22px] font-bold" style={{ color: "var(--accent)" }}>{stats.streak}</span>
                <span className="text-[13px]" style={{ color: "var(--text-2)" }}>kun ketma-ket 100%</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: "var(--bg-hover)" }}>
      <div className="flex items-center gap-1 mb-1" style={{ color: "var(--text-3)" }}>
        {icon}<span className="text-[10px] font-medium">{label}</span>
      </div>
      <p className="text-[18px] font-bold" style={{ color: color || "var(--text)" }}>{value}</p>
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
