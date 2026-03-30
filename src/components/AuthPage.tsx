"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";
import LangSwitcher from "./LangSwitcher";

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const { t } = useLang();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setOk(""); setLoading(true);
    if (mode === "login") {
      const r = await signIn(email, pw); if (r) setErr(r);
    } else {
      if (!name.trim()) { setErr(t("nameRequired")); setLoading(false); return; }
      if (pw.length < 6) { setErr(t("minPw")); setLoading(false); return; }
      const r = await signUp(email, pw, name);
      if (r) setErr(r);
      else {
        if (phone.length > 4) {
          const { supabase } = await import("@/lib/supabase");
          await supabase.auth.updateUser({ data: { name, phone: "+998" + phone.replace(/\D/g, "") } });
        }
        setOk(t("success"));
      }
    }
    setLoading(false);
  };

  const inp = "w-full text-[14px] rounded-lg px-4 py-2.5 outline-none";
  const inpS = { background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-[360px]">
        {/* Lang */}
        <div className="flex justify-center mb-6">
          <LangSwitcher />
        </div>

        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="w-11 h-11 rounded-xl mx-auto mb-3 flex items-center justify-center text-white text-[17px] font-black"
            style={{ background: "var(--accent)" }}>F</div>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: "var(--text)" }}>Flowday</h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--text-3)" }}>{t("sub")}</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <p className="text-[14px] font-medium" style={{ color: "var(--text)" }}>
            {mode === "login" ? t("login") : t("register")}
          </p>

          {mode === "register" && (
            <>
              <input type="text" placeholder={t("name")} value={name} onChange={(e) => setName(e.target.value)}
                className={inp} style={inpS} required />
              <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-input)" }}>
                <span className="text-[14px] pl-3 pr-1.5 flex-shrink-0" style={{ color: "var(--text-2)" }}>+998</span>
                <input type="tel" placeholder="88 665 43 34" value={phone}
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, "").slice(0, 9);
                    let f = "";
                    if (d.length > 0) f += d.slice(0, 2);
                    if (d.length > 2) f += " " + d.slice(2, 5);
                    if (d.length > 5) f += " " + d.slice(5, 7);
                    if (d.length > 7) f += " " + d.slice(7, 9);
                    setPhone(f);
                  }}
                  className="flex-1 text-[14px] py-2.5 pr-3 outline-none bg-transparent" style={{ color: "var(--text)" }} />
              </div>
            </>
          )}

          <input type="email" placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)}
            className={inp} style={inpS} required />
          <input type="password" placeholder={t("password")} value={pw} onChange={(e) => setPw(e.target.value)}
            className={inp} style={inpS} required />

          {err && <p className="text-[12px] font-medium px-3 py-2 rounded-lg" style={{ background: "var(--red-light)", color: "var(--red)" }}>{err}</p>}
          {ok && <p className="text-[12px] font-medium px-3 py-2 rounded-lg" style={{ background: "var(--green-light)", color: "var(--green)" }}>{ok}</p>}

          <button type="submit" disabled={loading}
            className="w-full text-[14px] font-semibold text-white py-2.5 rounded-lg disabled:opacity-50 cursor-pointer"
            style={{ background: "var(--accent)" }}>
            {loading ? "..." : mode === "login" ? t("login") : t("register")}
          </button>

          <p className="text-center text-[12px]" style={{ color: "var(--text-3)" }}>
            {mode === "login" ? t("noAcc") + " " : t("hasAcc") + " "}
            <button type="button" className="font-medium cursor-pointer" style={{ color: "var(--accent)" }}
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); setOk(""); }}>
              {mode === "login" ? t("regLink") : t("loginLink")}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
