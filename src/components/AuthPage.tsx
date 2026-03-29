"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";

type AuthMode = "login" | "register" | "phone" | "otp";
type Lang = "uz" | "ru" | "en";

const t: Record<Lang, Record<string, string>> = {
  uz: { brand: "Flowday", sub: "Har kuningiz oqib ketsin", login: "Kirish", register: "Ro'yxatdan o'tish", phone: "Telefon orqali", name: "Ismingiz", email: "Email", password: "Parol", phoneNum: "Telefon raqam", code: "SMS kod", send: "Kod yuborish", verify: "Tasdiqlash", noAcc: "Akkaunt yo'qmi?", hasAcc: "Akkaunt bormi?", regLink: "Ro'yxatdan o'ting", loginLink: "Kirish", orPhone: "Telefon orqali kirish", orEmail: "Email orqali kirish", success: "Muvaffaqiyat! Email'ni tekshiring.", minPw: "Parol kamida 6 belgi", codeSent: "SMS kod yuborildi!" },
  ru: { brand: "Flowday", sub: "Пусть каждый день течёт", login: "Войти", register: "Регистрация", phone: "По телефону", name: "Ваше имя", email: "Email", password: "Пароль", phoneNum: "Номер телефона", code: "SMS код", send: "Отправить код", verify: "Подтвердить", noAcc: "Нет аккаунта?", hasAcc: "Есть аккаунт?", regLink: "Зарегистрируйтесь", loginLink: "Войти", orPhone: "Войти по телефону", orEmail: "Войти по email", success: "Успешно! Проверьте email.", minPw: "Пароль минимум 6 символов", codeSent: "SMS код отправлен!" },
  en: { brand: "Flowday", sub: "Let your day flow", login: "Sign in", register: "Sign up", phone: "Phone", name: "Your name", email: "Email", password: "Password", phoneNum: "Phone number", code: "SMS code", send: "Send code", verify: "Verify", noAcc: "No account?", hasAcc: "Have an account?", regLink: "Sign up", loginLink: "Sign in", orPhone: "Sign in with phone", orEmail: "Sign in with email", success: "Success! Check your email.", minPw: "Password min 6 characters", codeSent: "SMS code sent!" },
};

export default function AuthPage() {
  const { signIn, signUp, signInWithPhone, verifyOtp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [lang, setLang] = useState<Lang>("uz");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+998");
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);
  const s = t[lang];

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setOk(""); setLoading(true);
    if (mode === "login") {
      const r = await signIn(email, pw); if (r) setErr(r);
    } else {
      if (!name.trim()) { setErr("Ismingizni kiriting"); setLoading(false); return; }
      if (pw.length < 6) { setErr(s.minPw); setLoading(false); return; }
      const r = await signUp(email, pw, name);
      if (r) setErr(r);
      else {
        // Save phone to user metadata if provided
        if (phone.length > 4) {
          const { supabase } = await import("@/lib/supabase");
          await supabase.auth.updateUser({ phone, data: { name, phone } });
        }
        setOk(s.success);
      }
    }
    setLoading(false);
  };

  const submitPhone = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setOk(""); setLoading(true);
    const r = await signInWithPhone(phone);
    if (r) setErr(r); else { setOk(s.codeSent); setMode("otp"); }
    setLoading(false);
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setLoading(true);
    const r = await verifyOtp(phone, otp); if (r) setErr(r);
    setLoading(false);
  };

  const inp = "w-full text-[14px] rounded-lg px-3 py-2.5 outline-none";
  const inpStyle = { background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-[360px]">
        {/* Lang selector */}
        <div className="flex justify-center gap-1 mb-6">
          {(["uz", "ru", "en"] as Lang[]).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className="text-[12px] px-2.5 py-1 rounded-md cursor-pointer transition-colors"
              style={{
                background: lang === l ? "var(--accent)" : "transparent",
                color: lang === l ? "white" : "var(--text-3)",
                fontWeight: lang === l ? 600 : 400,
              }}>
              {l === "uz" ? "O'zbek" : l === "ru" ? "Русский" : "English"}
            </button>
          ))}
        </div>

        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="w-11 h-11 rounded-xl mx-auto mb-3 flex items-center justify-center text-white text-[17px] font-black"
            style={{ background: "var(--accent)" }}>F</div>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: "var(--text)" }}>{s.brand}</h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--text-3)" }}>{s.sub}</p>
        </div>

        {/* Email/Register form */}
        {(mode === "login" || mode === "register") && (
          <form onSubmit={submitEmail} className="space-y-3">
            <p className="text-[14px] font-medium" style={{ color: "var(--text)" }}>
              {mode === "login" ? s.login : s.register}
            </p>
            {mode === "register" && (
              <>
                <input type="text" placeholder={s.name} value={name} onChange={(e) => setName(e.target.value)}
                  className={inp} style={inpStyle} required />
                <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-input)" }}>
                  <span className="text-[14px] pl-3 pr-1.5 flex-shrink-0" style={{ color: "var(--text-2)" }}>+998</span>
                  <input type="tel" placeholder="88 665 43 34" value={phone.replace(/^\+998\s?/, "")}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, "").slice(0, 9);
                      let f = "";
                      if (d.length > 0) f += d.slice(0, 2);
                      if (d.length > 2) f += " " + d.slice(2, 5);
                      if (d.length > 5) f += " " + d.slice(5, 7);
                      if (d.length > 7) f += " " + d.slice(7, 9);
                      setPhone("+998 " + f);
                    }}
                    className="flex-1 text-[14px] py-2.5 pr-3 outline-none bg-transparent" style={{ color: "var(--text)" }} />
                </div>
              </>
            )}
            <input type="email" placeholder={s.email} value={email} onChange={(e) => setEmail(e.target.value)}
              className={inp} style={inpStyle} required />
            <input type="password" placeholder={s.password} value={pw} onChange={(e) => setPw(e.target.value)}
              className={inp} style={inpStyle} required />
            {err && <p className="text-[12px] font-medium px-3 py-2 rounded-lg" style={{ background: "var(--red-light)", color: "var(--red)" }}>{err}</p>}
            {ok && <p className="text-[12px] font-medium px-3 py-2 rounded-lg" style={{ background: "var(--green-light)", color: "var(--green)" }}>{ok}</p>}
            <button type="submit" disabled={loading}
              className="w-full text-[14px] font-semibold text-white py-2.5 rounded-lg disabled:opacity-50 cursor-pointer"
              style={{ background: "var(--accent)" }}>
              {loading ? "..." : mode === "login" ? s.login : s.register}
            </button>

            <div className="flex items-center gap-2 my-1">
              <div className="flex-1" style={{ height: "1px", background: "var(--border)" }} />
              <span className="text-[11px]" style={{ color: "var(--text-3)" }}>yoki</span>
              <div className="flex-1" style={{ height: "1px", background: "var(--border)" }} />
            </div>

            <button type="button" onClick={() => { setMode("phone"); setErr(""); setOk(""); }}
              className="w-full text-[13px] py-2 rounded-lg cursor-pointer transition-colors"
              style={{ color: "var(--text-2)", border: "1px solid var(--border)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
              {s.orPhone}
            </button>

            <p className="text-center text-[12px]" style={{ color: "var(--text-3)" }}>
              {mode === "login" ? s.noAcc + " " : s.hasAcc + " "}
              <button type="button" className="font-medium cursor-pointer" style={{ color: "var(--accent)" }}
                onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); setOk(""); }}>
                {mode === "login" ? s.regLink : s.loginLink}
              </button>
            </p>
          </form>
        )}

        {/* Phone form */}
        {mode === "phone" && (
          <form onSubmit={submitPhone} className="space-y-3">
            <p className="text-[14px] font-medium" style={{ color: "var(--text)" }}>{s.phone}</p>
            <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-input)" }}>
              <span className="text-[14px] pl-3 pr-1.5 flex-shrink-0" style={{ color: "var(--text-2)" }}>+998</span>
              <input type="tel" placeholder="88 665 43 34" value={phone.replace(/^\+998\s?/, "")}
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, "").slice(0, 9);
                  let f = "";
                  if (d.length > 0) f += d.slice(0, 2);
                  if (d.length > 2) f += " " + d.slice(2, 5);
                  if (d.length > 5) f += " " + d.slice(5, 7);
                  if (d.length > 7) f += " " + d.slice(7, 9);
                  setPhone("+998 " + f);
                }}
                className="flex-1 text-[14px] py-2.5 pr-3 outline-none bg-transparent" style={{ color: "var(--text)" }}
                required />
            </div>
            {err && <p className="text-[12px] font-medium px-3 py-2 rounded-lg" style={{ background: "var(--red-light)", color: "var(--red)" }}>{err}</p>}
            {ok && <p className="text-[12px] font-medium px-3 py-2 rounded-lg" style={{ background: "var(--green-light)", color: "var(--green)" }}>{ok}</p>}
            <button type="submit" disabled={loading}
              className="w-full text-[14px] font-semibold text-white py-2.5 rounded-lg disabled:opacity-50 cursor-pointer"
              style={{ background: "var(--accent)" }}>
              {loading ? "..." : s.send}
            </button>
            <button type="button" onClick={() => { setMode("login"); setErr(""); setOk(""); }}
              className="w-full text-[13px] py-2 rounded-lg cursor-pointer" style={{ color: "var(--text-2)" }}>
              {s.orEmail}
            </button>
          </form>
        )}

        {/* OTP verify */}
        {mode === "otp" && (
          <form onSubmit={submitOtp} className="space-y-3">
            <p className="text-[14px] font-medium" style={{ color: "var(--text)" }}>{s.verify}</p>
            <p className="text-[12px]" style={{ color: "var(--text-2)" }}>{phone}</p>
            <input type="text" placeholder={s.code} value={otp} onChange={(e) => setOtp(e.target.value)}
              className={inp} style={inpStyle} required maxLength={6} autoFocus />
            {err && <p className="text-[12px] font-medium px-3 py-2 rounded-lg" style={{ background: "var(--red-light)", color: "var(--red)" }}>{err}</p>}
            <button type="submit" disabled={loading}
              className="w-full text-[14px] font-semibold text-white py-2.5 rounded-lg disabled:opacity-50 cursor-pointer"
              style={{ background: "var(--accent)" }}>
              {loading ? "..." : s.verify}
            </button>
            <button type="button" onClick={() => { setMode("phone"); setErr(""); }}
              className="w-full text-[13px] py-2 rounded-lg cursor-pointer" style={{ color: "var(--text-2)" }}>
              Qayta yuborish
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
