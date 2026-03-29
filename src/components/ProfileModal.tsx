"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { getWeeklyStatsAsync, WeeklyStats } from "@/lib/analytics";
import { XIcon, BarChartIcon, CheckIcon, TrendingUpIcon, CalendarIcon } from "./Icons";

interface ProfileModalProps { onClose: () => void; }

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<WeeklyStats | null>(null);

  useEffect(() => {
    if (user) getWeeklyStatsAsync(user.id).then(setStats);
  }, [user]);

  if (!user) return null;

  const name = user.user_metadata?.name || user.email?.split("@")[0] || "Foydalanuvchi";
  const email = user.email || "";
  const phone = user.user_metadata?.phone || user.phone || "";
  const initial = name.charAt(0).toUpperCase();
  const created = new Date(user.created_at).toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--overlay)" }}
      onClick={onClose}>
      <div className="w-full max-w-[380px] rounded-xl animate-slide-up max-h-[85vh] overflow-y-auto"
        style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border-light)" }}>
          <span className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>Profil</span>
          <button onClick={onClose} className="p-1 rounded-md cursor-pointer" style={{ color: "var(--text-3)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <XIcon size={14} />
          </button>
        </div>

        <div className="p-5">
          {/* Avatar */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-[20px] font-bold"
              style={{ background: "var(--accent)" }}>
              {initial}
            </div>
            <div>
              <p className="text-[16px] font-semibold" style={{ color: "var(--text)" }}>{name}</p>
              {email && <p className="text-[12px]" style={{ color: "var(--text-2)" }}>{email}</p>}
              {phone && <p className="text-[12px]" style={{ color: "var(--text-2)" }}>{phone}</p>}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-0 mb-5">
            <InfoRow label="Ro'yxatdan o'tgan" value={created} />
          </div>

          {/* Stats */}
          {stats && stats.totalTasks > 0 && (
            <div className="mb-5">
              <p className="text-[12px] font-semibold mb-3 flex items-center gap-1.5" style={{ color: "var(--text-2)" }}>
                <BarChartIcon size={13} /> Haftalik statistika
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <StatBox icon={<CalendarIcon size={13} />} label="Jami tasklar" value={String(stats.totalTasks)} />
                <StatBox icon={<CheckIcon size={13} />} label="Bajarildi" value={String(stats.totalCompleted)} color="var(--green)" />
                <StatBox icon={<TrendingUpIcon size={13} />} label="Samaradorlik" value={`${stats.overallRate}%`} color="var(--accent)" />
                <StatBox icon={<BarChartIcon size={13} />} label="O'rtacha/kun" value={String(stats.avgTasksPerDay)} />
              </div>
              {stats.streak > 0 && (
                <div className="text-center py-2 rounded-lg" style={{ background: "var(--accent-light)" }}>
                  <span className="text-[18px] font-bold" style={{ color: "var(--accent)" }}>{stats.streak}</span>
                  <span className="text-[11px] ml-1.5" style={{ color: "var(--text-2)" }}>kun ketma-ket 100%</span>
                </div>
              )}
            </div>
          )}

          {/* Sign out */}
          <button onClick={async () => { await signOut(); onClose(); }}
            className="w-full text-[13px] font-medium py-2.5 rounded-lg cursor-pointer transition-colors"
            style={{ color: "var(--red)", border: "1px solid var(--border)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--red-light)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            Chiqish
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border-light)" }}>
      <span className="text-[12px]" style={{ color: "var(--text-3)" }}>{label}</span>
      <span className="text-[12px] font-medium" style={{ color: "var(--text-2)" }}>{value}</span>
    </div>
  );
}

function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: "var(--bg-hover)" }}>
      <div className="flex items-center gap-1 mb-1" style={{ color: "var(--text-3)" }}>
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <p className="text-[17px] font-bold" style={{ color: color || "var(--text)" }}>{value}</p>
    </div>
  );
}
