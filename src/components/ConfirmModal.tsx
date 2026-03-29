"use client";

import { useLang } from "@/lib/lang";
import { XIcon } from "./Icons";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel }: ConfirmModalProps) {
  const { t } = useLang();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--overlay)" }}
      onClick={onCancel}>
      <div className="w-full max-w-[340px] rounded-xl p-5 animate-slide-up"
        style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>{title}</h3>
          <button onClick={onCancel} className="p-1 rounded-md cursor-pointer" style={{ color: "var(--text-3)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <XIcon size={14} />
          </button>
        </div>
        <p className="text-[13px] mb-5" style={{ color: "var(--text-2)" }}>{message}</p>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onCancel}
            className="text-[13px] px-3.5 py-2 rounded-lg cursor-pointer transition-colors"
            style={{ color: "var(--text-2)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            {t("cancel")}
          </button>
          <button onClick={onConfirm}
            className="text-[13px] font-medium text-white px-3.5 py-2 rounded-lg cursor-pointer transition-colors"
            style={{ background: "var(--red)" }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
            {confirmLabel || t("delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
