"use client";

import { useLang, Lang } from "@/lib/lang";

const langs: { code: Lang; label: string }[] = [
  { code: "uz", label: "O'zbek" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];

export default function LangSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
      className="appearance-none text-[11px] px-2 py-1 rounded-md cursor-pointer outline-none"
      style={{
        background: "var(--bg-hover)",
        color: "var(--text-2)",
        border: "1px solid var(--border-light)",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 4px center",
        paddingRight: "18px",
      }}
    >
      {langs.map(l => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  );
}
