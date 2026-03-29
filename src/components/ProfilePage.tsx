"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getWeeklyStatsAsync, WeeklyStats } from "@/lib/analytics";
import { ChevronLeftIcon, EditIcon, CheckIcon, BarChartIcon, TrendingUpIcon, CalendarIcon } from "./Icons";

interface ProfilePageProps { onBack: () => void; }

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [editing, setEditing] = useState<"name" | "phone" | "email" | null>(null);
  const [editVal, setEditVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (user) getWeeklyStatsAsync(user.id).then(setStats);
  }, [user]);

  if (!user) return null;

  const name = user.user_metadata?.name || user.email?.split("@")[0] || "Foydalanuvchi";
  const email = user.email || "";
  const phone = user.user_metadata?.phone || user.phone || "";
  const initial = name.charAt(0).toUpperCase();
  const created = new Date(user.created_at).toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" });

  const startEdit = (field: "name" | "phone" | "email") => {
    setEditing(field);
    setEditVal(field === "name" ? name : field === "phone" ? phone : email);
    setMsg("");
  };

  const saveEdit = async () => {
    if (!editVal.trim()) return;
    setSaving(true); setMsg("");
    try {
      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setMsg("Iltimos, qayta kiring"); setSaving(false); return; }

      if (editing === "name") {
        const { error } = await supabase.auth.updateUser({ data: { ...user.user_metadata, name: editVal.trim() } });
        if (error) throw error;
        setMsg("Ism yangilandi");
      } else if (editing === "phone") {
        const cleaned = editVal.replace(/\s/g, "");
        if (!/^\+998\d{9}$/.test(cleaned)) { setMsg("Format: +998 XX XXX XX XX"); setSaving(false); return; }
        const { error } = await supabase.auth.updateUser({ data: { ...user.user_metadata, phone: editVal.trim() } });
        if (error) throw error;
        setMsg("Telefon yangilandi");
      } else if (editing === "email") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editVal)) { setMsg("Email noto'g'ri"); setSaving(false); return; }
        const { error } = await supabase.auth.updateUser({ email: editVal.trim() });
        if (error) throw error;
        setMsg("Yangi email'ga tasdiqlash yuborildi");
      }
      setEditing(null);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Xatolik yuz berdi");
    }
    setSaving(false);
  };

  const cancelEdit = () => { setEditing(null); setMsg(""); };

  return (
    <div className="max-w-[480px] mx-auto px-5 sm:px-8 py-8 sm:py-12">
      {/* Back button */}
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-[13px] mb-6 cursor-pointer transition-colors rounded-md px-2 py-1.5 -ml-2"
        style={{ color: "var(--text-2)" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-light)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-2)"; e.currentTarget.style.background = "transparent"; }}>
        <ChevronLeftIcon size={16} /> Ortga
      </button>

      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-[24px] font-bold flex-shrink-0"
          style={{ background: "var(--accent)" }}>
          {initial}
        </div>
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: "var(--text)" }}>{name}</h1>
          <p className="text-[13px]" style={{ color: "var(--text-3)" }}>A&apos;zo bo&apos;lgan: {created}</p>
        </div>
      </div>

      {/* Editable fields */}
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-3)" }}>
          Shaxsiy ma&apos;lumotlar
        </p>

        <EditableField
          label="Ism"
          value={name}
          isEditing={editing === "name"}
          editValue={editVal}
          onChange={setEditVal}
          onEdit={() => startEdit("name")}
          onSave={saveEdit}
          onCancel={cancelEdit}
          saving={saving}
        />
        <EditableField
          label="Email"
          value={email}
          isEditing={editing === "email"}
          editValue={editVal}
          onChange={setEditVal}
          onEdit={() => startEdit("email")}
          onSave={saveEdit}
          onCancel={cancelEdit}
          saving={saving}
          type="email"
        />
        <EditableField
          label="Telefon"
          value={phone || "Qo'shilmagan"}
          isEditing={editing === "phone"}
          editValue={editVal}
          onChange={(v) => {
            const digits = v.replace(/\D/g, "").replace(/^998/, "").slice(0, 9);
            let formatted = "+998";
            if (digits.length > 0) formatted += " " + digits.slice(0, 2);
            if (digits.length > 2) formatted += " " + digits.slice(2, 5);
            if (digits.length > 5) formatted += " " + digits.slice(5, 7);
            if (digits.length > 7) formatted += " " + digits.slice(7, 9);
            setEditVal(formatted);
          }}
          onEdit={() => startEdit("phone")}
          onSave={saveEdit}
          onCancel={cancelEdit}
          saving={saving}
          type="tel"
          placeholder="+998 88 665 43 34"
        />

        {msg && (
          <p className="text-[12px] mt-3 px-3 py-2 rounded-lg"
            style={{ background: msg.includes("yangilandi") || msg.includes("yuborildi") ? "var(--green-light)" : "var(--red-light)", color: msg.includes("yangilandi") || msg.includes("yuborildi") ? "var(--green)" : "var(--red)" }}>
            {msg}
          </p>
        )}
      </div>

      {/* Stats */}
      {stats && stats.totalTasks > 0 && (
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5"
            style={{ color: "var(--text-3)" }}>
            <BarChartIcon size={12} /> Haftalik statistika
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <StatBox icon={<CalendarIcon size={12} />} label="Jami" value={String(stats.totalTasks)} />
            <StatBox icon={<CheckIcon size={12} />} label="Bajarildi" value={String(stats.totalCompleted)} color="var(--green)" />
            <StatBox icon={<TrendingUpIcon size={12} />} label="Samaradorlik" value={`${stats.overallRate}%`} color="var(--accent)" />
            <StatBox icon={<BarChartIcon size={12} />} label="O'rtacha/kun" value={String(stats.avgTasksPerDay)} />
          </div>
          {stats.streak > 0 && (
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg" style={{ background: "var(--accent-light)" }}>
              <span className="text-[20px] font-bold" style={{ color: "var(--accent)" }}>{stats.streak}</span>
              <span className="text-[12px]" style={{ color: "var(--text-2)" }}>kun ketma-ket 100%</span>
            </div>
          )}
        </div>
      )}

      {/* Sign out */}
      <button onClick={async () => { await signOut(); }}
        className="w-full text-[13px] font-medium py-2.5 rounded-lg cursor-pointer transition-colors"
        style={{ color: "var(--red)", border: "1px solid var(--border)" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--red-light)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
        Akkauntdan chiqish
      </button>
    </div>
  );
}

function EditableField({ label, value, isEditing, editValue, onChange, onEdit, onSave, onCancel, saving, type = "text", placeholder }: {
  label: string; value: string; isEditing: boolean; editValue: string; onChange: (v: string) => void;
  onEdit: () => void; onSave: () => void; onCancel: () => void; saving: boolean; type?: string; placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
      <span className="text-[12px] w-16 flex-shrink-0" style={{ color: "var(--text-3)" }}>{label}</span>
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <input type={type} value={editValue} onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 text-[13px] rounded-md px-2.5 py-1.5 outline-none min-w-0"
            style={{ background: "var(--bg-input)", border: "1px solid var(--accent)", color: "var(--text)" }}
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }}
          />
          <button onClick={onSave} disabled={saving}
            className="p-1.5 rounded-md cursor-pointer" style={{ color: "var(--accent)" }}>
            <CheckIcon size={14} />
          </button>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
          <span className="text-[13px] truncate" style={{ color: value === "Qo'shilmagan" ? "var(--text-3)" : "var(--text)" }}>{value}</span>
          <button onClick={onEdit}
            className="p-1 rounded-md cursor-pointer flex-shrink-0 transition-colors" style={{ color: "var(--text-3)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-3)"; }}>
            <EditIcon size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: "var(--bg-hover)" }}>
      <div className="flex items-center gap-1 mb-1" style={{ color: "var(--text-3)" }}>
        {icon}<span className="text-[10px] font-medium">{label}</span>
      </div>
      <p className="text-[17px] font-bold" style={{ color: color || "var(--text)" }}>{value}</p>
    </div>
  );
}
