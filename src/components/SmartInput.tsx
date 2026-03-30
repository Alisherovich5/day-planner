"use client";

import { useState, useRef, useEffect } from "react";
import { Task } from "@/lib/types";
import { parseTaskFromText } from "@/lib/ai-parser";
import { parseTaskWithAI } from "@/lib/ai-parse-groq";
import { warmUpAudio } from "@/lib/sounds";
import { useLang } from "@/lib/lang";
import { MicIcon, SendIcon, StopCircleIcon, SparkleIcon, ClockIcon } from "./Icons";

interface SmartInputProps { date: string; onTaskCreated: (task: Task) => void; }

export default function SmartInput({ date, onTaskCreated }: SmartInputProps) {
  const { t } = useLang();
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Task | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);

  // Live preview with regex (instant)
  useEffect(() => {
    setPreview(text.trim().length > 2 ? parseTaskFromText(text, date) : null);
  }, [text, date]);

  const submit = async () => {
    if (!text.trim()) return;
    warmUpAudio();
    setLoading(true);

    // Try AI first, fallback to regex
    let task: Task | null = null;
    try {
      task = await parseTaskWithAI(text, date);
    } catch { /* ignore */ }

    if (!task) {
      task = parseTaskFromText(text, date);
    }

    onTaskCreated(task);
    setText(""); setPreview(null); setLoading(false);
  };

  const toggleVoice = () => {
    warmUpAudio();
    if (listening) {
      recRef.current?.stop();
      recRef.current = null;
      setListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const r = new SR();
    r.lang = "ru-RU";
    r.interimResults = true;
    r.continuous = true;

    r.onresult = (e: SpeechRecognitionEvent) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setText(t);
    };

    r.onend = () => { setListening(false); recRef.current = null; };
    r.onerror = () => { setListening(false); recRef.current = null; };

    recRef.current = r;
    try { r.start(); setListening(true); } catch { setListening(false); }
  };

  const active = focused || listening;

  return (
    <div>
      <div className="flex items-center gap-2.5 rounded-lg px-3.5 py-3 transition-all"
        style={{
          background: "var(--bg-card)",
          border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
          boxShadow: active ? "0 0 0 3px var(--accent-light)" : "var(--shadow)",
        }}>
        <span style={{ color: active ? "var(--accent)" : "var(--text-3)" }}>
          {loading ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin" style={{ color: "var(--accent)" }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          ) : (
            <SparkleIcon size={15} />
          )}
        </span>
        <input type="text" value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={listening ? "..." : t("smartPlaceholder")}
          className="flex-1 text-[14px] bg-transparent border-none outline-none min-w-0"
          style={{ color: "var(--text)" }}
          disabled={loading}
        />
        <button type="button" onClick={toggleVoice}
          className={`p-1.5 rounded-md flex-shrink-0 transition-all cursor-pointer ${listening ? "animate-pulse-glow" : ""}`}
          style={{ color: listening ? "#fff" : "var(--text-3)", background: listening ? "var(--red)" : "transparent" }}
          disabled={loading}>
          {listening ? <StopCircleIcon size={16} /> : <MicIcon size={16} />}
        </button>
        {text.trim() && (
          <button type="button" onClick={submit} disabled={loading}
            className="p-1.5 rounded-md text-white flex-shrink-0 cursor-pointer disabled:opacity-50"
            style={{ background: "var(--accent)" }}>
            <SendIcon size={15} />
          </button>
        )}
      </div>

      {preview && !loading && (
        <div className="mt-1.5 px-3 py-1.5 text-[12px] flex items-center gap-2.5 flex-wrap animate-fade-in" style={{ color: "var(--text-2)" }}>
          <span style={{ color: "var(--text)", fontWeight: 500 }}>{preview.title}</span>
          <span className="flex items-center gap-0.5" style={{ color: "var(--text-3)" }}>
            <ClockIcon size={10} /> {preview.startTime}–{preview.endTime}
          </span>
          <span className="text-[11px] font-medium" style={{
            color: preview.priority === "high" ? "var(--red)" : preview.priority === "low" ? "var(--blue)" : "var(--amber)",
          }}>{t(preview.priority)}</span>
        </div>
      )}
    </div>
  );
}
