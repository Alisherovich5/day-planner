"use client";

import { useLang } from "@/lib/lang";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";

interface DateNavProps { date: string; onChange: (date: string) => void; }

const dayNames: Record<string, string[]> = {
  uz: ["Yakshanba","Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba"],
  ru: ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"],
  en: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
};
const dayShorts: Record<string, string[]> = {
  uz: ["Yak","Dush","Sesh","Chor","Pay","Jum","Shan"],
  ru: ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"],
  en: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
};
const monthNames: Record<string, string[]> = {
  uz: ["Yan","Fev","Mar","Apr","May","Iyn","Iyl","Avg","Sen","Okt","Noy","Dek"],
  ru: ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"],
  en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
};
const todayLabel: Record<string, string> = { uz: "bugun", ru: "сегодня", en: "today" };

function addDays(d: string, n: number): string {
  const dt = new Date(d + "T00:00:00"); dt.setDate(dt.getDate() + n); return dt.toISOString().split("T")[0];
}
function isToday(d: string) { return d === new Date().toISOString().split("T")[0]; }

export default function DateNav({ date, onChange }: DateNavProps) {
  const { lang } = useLang();
  const dt = new Date(date + "T00:00:00");
  const day = (dayNames[lang] || dayNames.uz)[dt.getDay()];
  const dayS = (dayShorts[lang] || dayShorts.uz)[dt.getDay()];
  const mon = (monthNames[lang] || monthNames.uz)[dt.getMonth()];
  const rest = `${dt.getDate()} ${mon}`;

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onChange(addDays(date, -1))}
        className="p-1.5 rounded-lg transition-all flex-shrink-0 cursor-pointer" style={{ color: "var(--text-3)" }}>
        <ChevronLeftIcon size={16} />
      </button>
      <button onClick={() => { if (!isToday(date)) onChange(new Date().toISOString().split("T")[0]); }}
        className="font-bold leading-tight truncate text-left cursor-pointer"
        style={{ color: "var(--text)", fontSize: "15px" }}
        title={isToday(date) ? todayLabel[lang] : ""}>
        <span className="hidden sm:inline">{day}, </span>
        <span className="sm:hidden">{dayS}, </span>
        {rest}
        {isToday(date) && (
          <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded align-middle"
            style={{ background: "var(--accent)", color: "white" }}>
            {todayLabel[lang]}
          </span>
        )}
      </button>
      <button onClick={() => onChange(addDays(date, 1))}
        className="p-1.5 rounded-lg transition-all flex-shrink-0 cursor-pointer" style={{ color: "var(--text-3)" }}>
        <ChevronRightIcon size={16} />
      </button>
    </div>
  );
}
