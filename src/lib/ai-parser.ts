import { Task } from "./types";
import { generateId } from "./storage";

/**
 * Smart AI parser — natural language → Task with auto-scheduled time.
 *
 * Time patterns understood:
 *   "9 da uchrashuv"           → 09:00-10:00
 *   "soat 3 da choy"           → 15:00-16:00  (PM assumed for 1-6)
 *   "14:30 da prezentatsiya"   → 14:30-15:30
 *   "9:30-11:00 dars"          → 09:30-11:00
 *   "9 dan 11 gacha sport"     → 09:00-11:00
 *   "yarim 4 da"               → 15:30-16:30  (half past 3 = 3:30, PM)
 *   "5 minutdan keyin"         → now+5min
 *   "1 soatdan keyin"          → now+1hr
 *   "yarim soatdan keyin"      → now+30min
 *   "ertalab yoga"             → 07:00-08:00
 *   "tushda ovqat"             → 13:00-14:00
 *   "kechqurun kitob"          → 19:00-20:00
 */

const MORNING_WORDS = ["ertalab", "erta", "tong", "tongda", "ertalabki"];
const AFTERNOON_WORDS = ["tushda", "tushlik", "peshin", "tushdan keyin", "kunduzi"];
const EVENING_WORDS = ["kechqurun", "kech", "kechki", "oqshom", "oqshomda"];
const HIGH_WORDS = ["muhim", "zarur", "shoshilinch", "juda muhim", "critical", "urgent", "yuqori"];
const LOW_WORDS = ["oddiy", "past", "sekin", "unchalik muhim emas", "minor"];

// Russian/Uzbek number words → digits (voice recognition returns these)
const NUMBER_WORDS: Record<string, number> = {
  // English
  "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6,
  "seven": 7, "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12,
  // Russian
  "один": 1, "два": 2, "три": 3, "четыре": 4, "пять": 5, "шесть": 6,
  "семь": 7, "восемь": 8, "девять": 9, "десять": 10, "одиннадцать": 11, "двенадцать": 12,
  // Uzbek
  "bir": 1, "ikki": 2, "uch": 3, "to'rt": 4, "tort": 4, "besh": 5, "olti": 6,
  "yetti": 7, "sakkiz": 8, "to'qqiz": 9, "toqqiz": 9, "o'n": 10, "on": 10,
};

// Pre-process: replace number words with digits
function normalizeNumbers(text: string): string {
  let result = text;
  for (const [word, num] of Object.entries(NUMBER_WORDS)) {
    result = result.replace(new RegExp(`\\b${word}\\b`, "gi"), String(num));
  }
  // Russian time pattern: "в 3 часа" / "в три часа" → "soat 3 da"
  result = result.replace(/в\s*(\d{1,2})\s*час(?:а|ов|)\b/gi, "soat $1 da");
  // "в 3:30" → "3:30 da"
  result = result.replace(/в\s*(\d{1,2}:\d{2})/gi, "$1 da");
  // "в 3" → "3 da"
  result = result.replace(/в\s*(\d{1,2})(?:\s|$)/gi, "$1 da ");
  // Russian: "через 5 минут" → "5 minutdan keyin"
  result = result.replace(/через\s*(\d+)\s*минут/gi, "$1 minutdan keyin");
  // Russian: "через час" → "1 soatdan keyin"
  result = result.replace(/через\s*час/gi, "1 soatdan keyin");
  // Russian: "через полчаса" → "yarim soatdan keyin"
  result = result.replace(/через\s*полчаса/gi, "yarim soatdan keyin");
  // Russian priority: "важно/срочно" → muhim
  result = result.replace(/\b(важно|срочно|важная|срочная)\b/gi, "muhim");

  // English: "at 7 o'clock" / "at 7" → "7 da"
  result = result.replace(/at\s*(\d{1,2})(?:\s*o'?clock)?/gi, "$1 da");
  // English: "from 7 to 9" / "since 9" / "until 9" → "7 dan 9 gacha"
  result = result.replace(/from\s*(\d{1,2})\s*(?:to|till|until)\s*(\d{1,2})/gi, "$1 dan $2 gacha");
  // "since/until/till 9" → endTime hint
  result = result.replace(/(?:since|until|till)\s*(\d{1,2})/gi, "gacha $1");
  // English: "in 5 minutes" → "5 minutdan keyin"
  result = result.replace(/in\s*(\d+)\s*minutes?/gi, "$1 minutdan keyin");
  // English: "in an hour" / "in 2 hours" → "X soatdan keyin"
  result = result.replace(/in\s*an?\s*hour/gi, "1 soatdan keyin");
  result = result.replace(/in\s*(\d+)\s*hours?/gi, "$1 soatdan keyin");
  // English: "morning/afternoon/evening"
  result = result.replace(/\b(morning)\b/gi, "ertalab");
  result = result.replace(/\b(afternoon)\b/gi, "tushda");
  result = result.replace(/\b(evening|tonight)\b/gi, "kechqurun");
  // English priority: "important/urgent" → muhim
  result = result.replace(/\b(important|urgent|critical)\b/gi, "muhim");
  result = result.replace(/\b(minor|optional)\b/gi, "oddiy");
  // English: "continuous since 9" → treat as endTime
  result = result.replace(/continuous\s*(?:since|until|till)\s*(\d{1,2})/gi, "gacha $1");

  return result;
}

function pad(n: number): string { return String(n).padStart(2, "0"); }
function clamp(n: number, min: number, max: number): number { return Math.max(min, Math.min(max, n)); }

function nowTime(): { h: number; m: number } {
  const d = new Date();
  return { h: d.getHours(), m: d.getMinutes() };
}

function addMinutes(h: number, m: number, mins: number): { h: number; m: number } {
  const total = h * 60 + m + mins;
  return { h: clamp(Math.floor(total / 60), 0, 23), m: total % 60 };
}

function formatTime(h: number, m: number): string {
  return `${pad(h)}:${pad(m)}`;
}

// Smart PM: if hour is 1-6 and no explicit indicator, assume PM
function smartHour(h: number): number {
  if (h >= 1 && h <= 6) return h + 12;
  return h;
}

export function parseTaskFromText(rawText: string, date: string): Task {
  const text = normalizeNumbers(rawText);
  let title = text.trim();
  let startH = 9, startM = 0, endH = 10, endM = 0;
  let priority: "low" | "medium" | "high" = "medium";
  let timeFound = false;
  const lower = text.toLowerCase();

  // ── Priority ──
  for (const w of HIGH_WORDS) {
    if (lower.includes(w)) {
      priority = "high";
      title = title.replace(new RegExp(w, "gi"), "");
      break;
    }
  }
  if (priority === "medium") {
    for (const w of LOW_WORDS) {
      if (lower.includes(w)) {
        priority = "low";
        title = title.replace(new RegExp(w, "gi"), "");
        break;
      }
    }
  }

  // ── Relative time: "X minutdan keyin", "X soatdan keyin", "yarim soatdan keyin" ──
  if (!timeFound) {
    const relMin = text.match(/(\d+)\s*minut(?:dan)?\s*(?:keyin|so['ʻ]ng|ichida)/i);
    if (relMin) {
      const n = nowTime();
      const s = addMinutes(n.h, n.m, parseInt(relMin[1]));
      startH = s.h; startM = s.m;
      const e = addMinutes(s.h, s.m, 60);
      endH = e.h; endM = e.m;
      title = title.replace(relMin[0], "");
      timeFound = true;
    }
  }
  if (!timeFound) {
    const relHour = text.match(/(\d+)\s*soat(?:dan)?\s*(?:keyin|so['ʻ]ng|ichida)/i);
    if (relHour) {
      const n = nowTime();
      const s = addMinutes(n.h, n.m, parseInt(relHour[1]) * 60);
      startH = s.h; startM = s.m;
      const e = addMinutes(s.h, s.m, 60);
      endH = e.h; endM = e.m;
      title = title.replace(relHour[0], "");
      timeFound = true;
    }
  }
  if (!timeFound) {
    const relHalf = text.match(/yarim\s*soat(?:dan)?\s*(?:keyin|so['ʻ]ng|ichida)/i);
    if (relHalf) {
      const n = nowTime();
      const s = addMinutes(n.h, n.m, 30);
      startH = s.h; startM = s.m;
      const e = addMinutes(s.h, s.m, 60);
      endH = e.h; endM = e.m;
      title = title.replace(relHalf[0], "");
      timeFound = true;
    }
  }

  // ── "yarim 4 da" (half past 3 = 3:30) ──
  if (!timeFound) {
    const halfPast = text.match(/yarim\s*(\d{1,2})\s*(?:da)?(?:\s|$)/i);
    if (halfPast) {
      const h = smartHour(clamp(parseInt(halfPast[1]) - 1, 0, 23));
      startH = h; startM = 30;
      const e = addMinutes(h, 30, 60);
      endH = e.h; endM = e.m;
      title = title.replace(halfPast[0], " ");
      timeFound = true;
    }
  }

  // ── "14:30-16:00" or "14:30 - 16:00" ──
  if (!timeFound) {
    const rangeMatch = text.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
    if (rangeMatch) {
      startH = clamp(parseInt(rangeMatch[1]), 0, 23);
      startM = clamp(parseInt(rangeMatch[2]), 0, 59);
      endH = clamp(parseInt(rangeMatch[3]), 0, 23);
      endM = clamp(parseInt(rangeMatch[4]), 0, 59);
      title = title.replace(rangeMatch[0], "");
      timeFound = true;
    }
  }

  // ── "17:00 dan 21:00 gacha" or "17:00dan 21:00gacha" ──
  if (!timeFound) {
    const rangeColon = text.match(/(\d{1,2}):(\d{2})\s*(?:dan|da)\s*(\d{1,2}):(\d{2})\s*(?:gacha)?/i);
    if (rangeColon) {
      startH = clamp(parseInt(rangeColon[1]), 0, 23);
      startM = clamp(parseInt(rangeColon[2]), 0, 59);
      endH = clamp(parseInt(rangeColon[3]), 0, 23);
      endM = clamp(parseInt(rangeColon[4]), 0, 59);
      title = title.replace(rangeColon[0], "");
      timeFound = true;
    }
  }

  // ── "9 dan 11 gacha" or "17 dan 21 gacha" ──
  if (!timeFound) {
    const rangeSimple = text.match(/(\d{1,2})\s*(?:dan|da)\s*(\d{1,2})\s*(?:gacha)/i);
    if (rangeSimple) {
      const h1 = parseInt(rangeSimple[1]);
      const h2 = parseInt(rangeSimple[2]);
      startH = h1 < 7 ? smartHour(h1) : clamp(h1, 0, 23);
      endH = h2 < 7 ? smartHour(h2) : clamp(h2, 0, 23);
      startM = 0; endM = 0;
      title = title.replace(rangeSimple[0], "");
      timeFound = true;
    }
  }

  // ── "soat 3 da", "soat 15:30 da" ──
  if (!timeFound) {
    const soatMatch = text.match(/soat\s*(\d{1,2})(?::(\d{2}))?\s*(?:da)?/i);
    if (soatMatch) {
      const h = parseInt(soatMatch[1]);
      startH = h <= 12 ? smartHour(h) : clamp(h, 0, 23);
      startM = soatMatch[2] ? clamp(parseInt(soatMatch[2]), 0, 59) : 0;
      const e = addMinutes(startH, startM, 60);
      endH = e.h; endM = e.m;
      title = title.replace(soatMatch[0], "");
      timeFound = true;
    }
  }

  // ── "14:30 da" or "14:30" ──
  if (!timeFound) {
    const singleTime = text.match(/(\d{1,2}):(\d{2})\s*(?:da)?/);
    if (singleTime) {
      startH = clamp(parseInt(singleTime[1]), 0, 23);
      startM = clamp(parseInt(singleTime[2]), 0, 59);
      const e = addMinutes(startH, startM, 60);
      endH = e.h; endM = e.m;
      title = title.replace(singleTime[0], "");
      timeFound = true;
    }
  }

  // ── "9 da" ──
  if (!timeFound) {
    const hourOnly = text.match(/(?:^|\s)(\d{1,2})\s*da(?:\s|$)/);
    if (hourOnly) {
      const h = smartHour(clamp(parseInt(hourOnly[1]), 0, 23));
      startH = h; startM = 0;
      const e = addMinutes(h, 0, 60);
      endH = e.h; endM = e.m;
      title = title.replace(hourOnly[0], " ");
      timeFound = true;
    }
  }

  // ── Bare number: "3 uchrashuv" or "uchrashuv 17" ──
  if (!timeFound) {
    const bareNum = text.match(/(?:^|\s)(\d{1,2})(?:\s|$)/);
    if (bareNum) {
      const n = parseInt(bareNum[1]);
      if (n >= 1 && n <= 23) {
        startH = n < 7 ? smartHour(n) : n;
        startM = 0;
        const e = addMinutes(startH, 0, 60);
        endH = e.h; endM = e.m;
        title = title.replace(bareNum[0], " ");
        timeFound = true;
      }
    }
  }

  // ── Time-of-day words ──
  if (!timeFound) {
    for (const w of MORNING_WORDS) {
      if (lower.includes(w)) { startH = 7; startM = 0; endH = 8; endM = 0; title = title.replace(new RegExp(w, "gi"), ""); timeFound = true; break; }
    }
  }
  if (!timeFound) {
    for (const w of AFTERNOON_WORDS) {
      if (lower.includes(w)) { startH = 13; startM = 0; endH = 14; endM = 0; title = title.replace(new RegExp(w, "gi"), ""); timeFound = true; break; }
    }
  }
  if (!timeFound) {
    for (const w of EVENING_WORDS) {
      if (lower.includes(w)) { startH = 19; startM = 0; endH = 20; endM = 0; title = title.replace(new RegExp(w, "gi"), ""); timeFound = true; break; }
    }
  }

  // ── "gacha X" — set endTime from leftover "gacha 9" ──
  if (timeFound) {
    const gachaMatch = title.match(/gacha\s*(\d{1,2})/i);
    if (gachaMatch) {
      const eh = parseInt(gachaMatch[1]);
      endH = eh < 7 ? smartHour(eh) : eh;
      endM = 0;
      title = title.replace(gachaMatch[0], "");
    }
  }

  // ── Duration in title: "2 soatlik dars" → extend endTime ──
  if (timeFound) {
    const durHour = title.match(/(\d+)\s*soat(?:lik)?/i);
    if (durHour) {
      const hrs = parseInt(durHour[1]);
      const e = addMinutes(startH, startM, hrs * 60);
      endH = e.h; endM = e.m;
      title = title.replace(durHour[0], "");
    }
    const durMin = title.match(/(\d+)\s*minut(?:lik)?/i);
    if (durMin) {
      const mins = parseInt(durMin[1]);
      const e = addMinutes(startH, startM, mins);
      endH = e.h; endM = e.m;
      title = title.replace(durMin[0], "");
    }
  }

  // ── Clean title ──
  title = title.replace(/\s+/g, " ").replace(/^[-–,.\s]+|[-–,.\s]+$/g, "").trim();
  if (!title) title = text.trim();
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return {
    id: generateId(),
    title,
    date,
    startTime: formatTime(startH, startM),
    endTime: formatTime(endH, endM),
    completed: false,
    priority,
    notified: false,
    createdAt: Date.now(),
  };
}
