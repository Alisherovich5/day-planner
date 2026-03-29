"use client";

import { useState, useEffect } from "react";
import { requestNotificationPermission } from "@/lib/notifications";
import { useLang } from "@/lib/lang";
import { BellIcon, XIcon } from "./Icons";

export default function NotificationBanner() {
  const { t } = useLang();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      if (!sessionStorage.getItem("notif-dismissed")) setShow(true);
    }
  }, []);

  if (!show || dismissed) return null;

  return (
    <div className="rounded-lg px-3 py-2.5 mb-4 flex items-center gap-2.5 animate-fade-in"
      style={{ background: "var(--accent-light)", border: "1px solid var(--border)" }}>
      <span className="flex-shrink-0" style={{ color: "var(--accent)" }}><BellIcon size={14} /></span>
      <p className="flex-1 text-[12px]" style={{ color: "var(--text-2)" }}>
        <span className="font-medium" style={{ color: "var(--text)" }}>{t("allowNotif")}</span>
      </p>
      <button onClick={async () => { await requestNotificationPermission(); setShow(false); }}
        className="text-[11px] font-medium px-2.5 py-1 rounded-md text-white flex-shrink-0 cursor-pointer"
        style={{ background: "var(--accent)" }}>
        {t("allowBtn")}
      </button>
      <button onClick={() => { setDismissed(true); sessionStorage.setItem("notif-dismissed", "1"); }}
        className="p-1 rounded-md flex-shrink-0 cursor-pointer" style={{ color: "var(--text-3)" }}>
        <XIcon size={12} />
      </button>
    </div>
  );
}
