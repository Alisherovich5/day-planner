"use client";

import { useState, useRef, useEffect } from "react";
import { useLang, Lang } from "@/lib/lang";

const langs: { code: Lang; flag: string; label: string }[] = [
  { code: "uz", flag: "🇺🇿", label: "O'zbekcha" },
  { code: "ru", flag: "🇷🇺", label: "Русский" },
  { code: "en", flag: "🇬🇧", label: "English" },
];

export default function LangSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = langs.find(l => l.code === lang) || langs[0];

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[12px] px-2 py-1 rounded-md cursor-pointer transition-colors"
        style={{
          background: open ? "var(--bg-hover)" : "transparent",
          color: "var(--text-2)",
          border: "1px solid var(--border-light)",
        }}
      >
        <span>{current.flag}</span>
        <span className="font-medium">{current.code.toUpperCase()}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1 rounded-lg py-1 z-50 animate-fade-in min-w-[140px]"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
          {langs.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] cursor-pointer transition-colors text-left"
              style={{
                color: lang === l.code ? "var(--accent)" : "var(--text-2)",
                fontWeight: lang === l.code ? 600 : 400,
                background: "transparent",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span className="text-[15px]">{l.flag}</span>
              <span>{l.label}</span>
              {lang === l.code && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className="ml-auto" style={{ color: "var(--accent)" }}>
                  <polyline points="4 12 9 17 20 6" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
