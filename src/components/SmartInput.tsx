"use client";

import { useState, useRef, useEffect } from "react";
import { Task } from "@/lib/types";
import { parseTaskFromText } from "@/lib/ai-parser";
import { warmUpAudio } from "@/lib/sounds";
import { useLang } from "@/lib/lang";
import { MicIcon, SendIcon, StopCircleIcon, SparkleIcon, ClockIcon } from "./Icons";

interface SmartInputProps { date: string; onTaskCreated: (task: Task) => void; }

export default function SmartInput({ date, onTaskCreated }: SmartInputProps) {
  const { t } = useLang();
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [focused, setFocused] = useState(false);
  const [preview, setPreview] = useState<Task | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    setPreview(text.trim().length > 2 ? parseTaskFromText(text, date) : null);
  }, [text, date]);

  const submit = () => {
    if (!text.trim()) return;
    warmUpAudio();
    onTaskCreated(parseTaskFromText(text, date));
    setText(""); setPreview(null);
  };

  const toggleVoice = () => {
    warmUpAudio();
    if (listening) { recRef.current?.stop(); recRef.current = null; setListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR(); r.lang = "ru-RU"; r.interimResults = true; r.continuous = false;
    r.onresult = (e: SpeechRecognitionEvent) => {
      let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setText(t);
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
        <span style={{ color: active ? "var(--accent)" : "var(--text-3)" }}><SparkleIcon size={15} /></span>
        <input type="text" value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={listening ? "..." : t("smartPlaceholder")}
          className="flex-1 text-[14px] bg-transparent border-none outline-none min-w-0"
          style={{ color: "var(--text)" }}
        />
        <button type="button" onClick={toggleVoice}
          className={`p-1.5 rounded-md flex-shrink-0 transition-all cursor-pointer ${listening ? "animate-pulse-glow" : ""}`}
          style={{ color: listening ? "#fff" : "var(--text-3)", background: listening ? "var(--red)" : "transparent" }}>
          {listening ? <StopCircleIcon size={16} /> : <MicIcon size={16} />}
        </button>
        {text.trim() && (
          <button type="button" onClick={submit}
            className="p-1.5 rounded-md text-white flex-shrink-0 cursor-pointer" style={{ background: "var(--accent)" }}>
            <SendIcon size={15} />
          </button>
        )}
      </div>

      {preview && (
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
