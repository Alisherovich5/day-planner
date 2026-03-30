"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLang, Lang } from "@/lib/lang";
import { useTheme } from "@/lib/theme";
import { SOUNDS, SoundName, getSelectedSound, setSelectedSound, previewSound } from "@/lib/sounds";
import AuthPage from "@/components/AuthPage";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, SunIcon, MoonIcon, BellIcon, CheckIcon } from "@/components/Icons";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const { lang, setLang, t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [sound, setSound] = useState<SoundName>("marimba");

  useEffect(() => { setSound(getSelectedSound()); }, []);

  if (loading) return <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg)" }}>
    <div className="text-sm" style={{ color: "var(--text-3)" }}>...</div>
  </div>;
  if (!user) return <AuthPage />;

  const pickSound = (s: SoundName) => {
    setSound(s); setSelectedSound(s); previewSound(s);
  };

  const langs: { code: Lang; flag: string; label: string }[] = [
    { code: "uz", flag: "🇺🇿", label: "O'zbekcha" },
    { code: "ru", flag: "🇷🇺", label: "Русский" },
    { code: "en", flag: "🇬🇧", label: "English" },
  ];

  return (
    <div className="h-screen overflow-y-auto" style={{ background: "var(--bg)" }}>
      <div className="max-w-[480px] mx-auto px-5 sm:px-8 py-8 sm:py-12">
        <button onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-[13px] mb-6 cursor-pointer transition-colors rounded-md px-2 py-1.5 -ml-2"
          style={{ color: "var(--text-2)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-light)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-2)"; e.currentTarget.style.background = "transparent"; }}>
          <ChevronLeftIcon size={16} /> {t("back")}
        </button>

        <h1 className="text-[20px] font-bold mb-8" style={{ color: "var(--text)" }}>
          {lang === "ru" ? "Настройки" : lang === "en" ? "Settings" : "Sozlamalar"}
        </h1>

        {/* Theme */}
        <Section title={lang === "ru" ? "Тема" : lang === "en" ? "Theme" : "Mavzu"}>
          <div className="flex gap-2">
            <ThemeBtn active={theme === "light"} onClick={() => { if (theme !== "light") toggleTheme(); }}
              icon={<SunIcon size={16} />} label={lang === "ru" ? "Светлая" : lang === "en" ? "Light" : "Yorug'"} />
            <ThemeBtn active={theme === "dark"} onClick={() => { if (theme !== "dark") toggleTheme(); }}
              icon={<MoonIcon size={16} />} label={lang === "ru" ? "Тёмная" : lang === "en" ? "Dark" : "Qorong'u"} />
          </div>
        </Section>

        {/* Language */}
        <Section title={t("language")}>
          <div className="space-y-1">
            {langs.map((l) => (
              <button key={l.code} onClick={() => setLang(l.code)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] cursor-pointer transition-colors text-left"
                style={{ background: lang === l.code ? "var(--accent-light)" : "transparent", color: lang === l.code ? "var(--accent)" : "var(--text-2)", fontWeight: lang === l.code ? 600 : 400 }}
                onMouseEnter={(e) => { if (lang !== l.code) e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { if (lang !== l.code) e.currentTarget.style.background = "transparent"; }}>
                <span className="text-[18px]">{l.flag}</span>
                <span className="flex-1">{l.label}</span>
                {lang === l.code && <CheckIcon size={16} />}
              </button>
            ))}
          </div>
        </Section>

        {/* Alarm Sound */}
        <Section title={lang === "ru" ? "Звук напоминания" : lang === "en" ? "Alarm sound" : "Eslatma ovozi"}>
          <div className="space-y-1">
            {SOUNDS.map((s) => (
              <button key={s.id} onClick={() => pickSound(s.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] cursor-pointer transition-colors text-left"
                style={{ background: sound === s.id ? "var(--accent-light)" : "transparent", color: sound === s.id ? "var(--accent)" : "var(--text-2)", fontWeight: sound === s.id ? 600 : 400 }}
                onMouseEnter={(e) => { if (sound !== s.id) e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { if (sound !== s.id) e.currentTarget.style.background = "transparent"; }}>
                <BellIcon size={15} />
                <span className="flex-1">{s.label[lang] || s.label.en}</span>
                {sound === s.id && <CheckIcon size={16} />}
              </button>
            ))}
          </div>
          <p className="text-[11px] mt-2 px-1" style={{ color: "var(--text-3)" }}>
            {lang === "ru" ? "Нажмите чтобы прослушать" : lang === "en" ? "Tap to preview" : "Bosib eshiting"}
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-3)" }}>{title}</p>
      {children}
    </div>
  );
}

function ThemeBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[13px] font-medium cursor-pointer transition-colors"
      style={{
        background: active ? "var(--accent-light)" : "var(--bg-hover)",
        color: active ? "var(--accent)" : "var(--text-2)",
        border: active ? "1px solid var(--accent)" : "1px solid var(--border-light)",
      }}>
      {icon} {label}
    </button>
  );
}
