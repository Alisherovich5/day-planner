"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "uz" | "ru" | "en";

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const translations: Record<Lang, Record<string, string>> = {
  uz: {
    // Auth
    brand: "Flowday", sub: "Kuningizni rejalashtiring",
    login: "Kirish", register: "Ro'yxatdan o'tish",
    name: "Ismingiz", email: "Email", password: "Parol",
    phoneNum: "+998 88 665 43 34", code: "SMS kod",
    send: "Kod yuborish", verify: "Tasdiqlash",
    noAcc: "Akkaunt yo'qmi?", hasAcc: "Akkaunt bormi?",
    regLink: "Ro'yxatdan o'ting", loginLink: "Kirish",
    orPhone: "Telefon orqali kirish", orEmail: "Email orqali kirish",
    success: "Muvaffaqiyat! Email'ni tekshiring.",
    minPw: "Parol kamida 6 belgi", codeSent: "SMS kod yuborildi!",
    nameRequired: "Ismingizni kiriting",
    // Main
    addTask: "Batafsil qo'shish", smartPlaceholder: "9 da uchrashuv... (rus/eng tilida ham)",
    noTasks: "Hali tasklar yo'q", noTasksSub: "Yuqoridagi maydondan yozing yoki gapiring",
    tomorrowPlan: "Ertangi kun rejasi",
    progress: "Progress", completed: "bajarildi",
    // Task
    high: "Yuqori", medium: "O'rta", low: "Past",
    overdue: "Kechikdi", notified: "Bildirildi",
    taskName: "Task nomi...", taskDesc: "Tavsif...",
    cancel: "Bekor", save: "Saqlash", add: "Qo'shish",
    // Delete
    deleteTitle: "Taskni o'chirish",
    deleteMsg: "Bu taskni o'chirishni xohlaysizmi?",
    delete: "O'chirish",
    // Profile
    profile: "Profil", back: "Ortga", personalInfo: "Shaxsiy ma'lumotlar",
    phone: "Telefon", notAdded: "Qo'shilmagan",
    memberSince: "A'zo bo'lgan", signOut: "Akkauntdan chiqish",
    weeklyStats: "Haftalik statistika", total: "Jami", done: "Bajarildi",
    efficiency: "Samaradorlik", avgDay: "O'rtacha/kun",
    streak: "kun ketma-ket 100%",
    // Stats
    stats: "Haftalik statistika", daily: "Kunlik ko'rsatkich",
    best: "Eng yaxshi", worst: "Eng past", priority: "Muhimlik taqsimoti",
    noStats: "Hafta davomida tasklar topilmadi",
    // Copy
    copyTg: "Telegramga nusxalash", tomorrow: "Ertangi reja",
    // Notification
    reminder: "Eslatma", allowNotif: "Bildirishnomalarni yoqing",
    allowBtn: "Ruxsat",
    // Lang
    language: "Til",
  },
  ru: {
    brand: "Flowday", sub: "Планируйте свой день",
    login: "Войти", register: "Регистрация",
    name: "Ваше имя", email: "Email", password: "Пароль",
    phoneNum: "+998 88 665 43 34", code: "SMS код",
    send: "Отправить код", verify: "Подтвердить",
    noAcc: "Нет аккаунта?", hasAcc: "Есть аккаунт?",
    regLink: "Зарегистрируйтесь", loginLink: "Войти",
    orPhone: "Войти по телефону", orEmail: "Войти по email",
    success: "Успешно! Проверьте email.", minPw: "Пароль минимум 6 символов",
    codeSent: "SMS код отправлен!", nameRequired: "Введите имя",
    addTask: "Добавить подробно", smartPlaceholder: "в 9 встреча... (на узб тоже можно)",
    noTasks: "Задач пока нет", noTasksSub: "Напишите или скажите голосом",
    tomorrowPlan: "План на завтра",
    progress: "Прогресс", completed: "выполнено",
    high: "Высокий", medium: "Средний", low: "Низкий",
    overdue: "Просрочено", notified: "Уведомлено",
    taskName: "Название...", taskDesc: "Описание...",
    cancel: "Отмена", save: "Сохранить", add: "Добавить",
    deleteTitle: "Удалить задачу", deleteMsg: "Вы уверены, что хотите удалить?", delete: "Удалить",
    profile: "Профиль", back: "Назад", personalInfo: "Личные данные",
    phone: "Телефон", notAdded: "Не указан",
    memberSince: "Дата регистрации", signOut: "Выйти из аккаунта",
    weeklyStats: "Статистика за неделю", total: "Всего", done: "Выполнено",
    efficiency: "Эффективность", avgDay: "В среднем/день",
    streak: "дней подряд 100%",
    stats: "Статистика за неделю", daily: "По дням",
    best: "Лучший", worst: "Худший", priority: "По приоритетам",
    noStats: "Задач за неделю не найдено",
    copyTg: "Скопировать для Telegram", tomorrow: "План на завтра",
    reminder: "Напоминание", allowNotif: "Включите уведомления",
    allowBtn: "Разрешить", language: "Язык",
  },
  en: {
    brand: "Flowday", sub: "Plan your day with ease",
    login: "Sign in", register: "Sign up",
    name: "Your name", email: "Email", password: "Password",
    phoneNum: "+998 88 665 43 34", code: "SMS code",
    send: "Send code", verify: "Verify",
    noAcc: "No account?", hasAcc: "Have an account?",
    regLink: "Sign up", loginLink: "Sign in",
    orPhone: "Sign in with phone", orEmail: "Sign in with email",
    success: "Success! Check your email.", minPw: "Password min 6 chars",
    codeSent: "SMS code sent!", nameRequired: "Enter your name",
    addTask: "Add with details", smartPlaceholder: "9 meeting... (uzb/rus also works)",
    noTasks: "No tasks yet", noTasksSub: "Type or speak above",
    tomorrowPlan: "Tomorrow's plan",
    progress: "Progress", completed: "done",
    high: "High", medium: "Medium", low: "Low",
    overdue: "Overdue", notified: "Notified",
    taskName: "Task name...", taskDesc: "Description...",
    cancel: "Cancel", save: "Save", add: "Add",
    deleteTitle: "Delete task", deleteMsg: "Are you sure you want to delete?", delete: "Delete",
    profile: "Profile", back: "Back", personalInfo: "Personal info",
    phone: "Phone", notAdded: "Not added",
    memberSince: "Member since", signOut: "Sign out",
    weeklyStats: "Weekly statistics", total: "Total", done: "Done",
    efficiency: "Efficiency", avgDay: "Avg/day",
    streak: "days 100% streak",
    stats: "Weekly statistics", daily: "Daily",
    best: "Best", worst: "Worst", priority: "By priority",
    noStats: "No tasks found this week",
    copyTg: "Copy for Telegram", tomorrow: "Tomorrow's plan",
    reminder: "Reminder", allowNotif: "Enable notifications",
    allowBtn: "Allow", language: "Language",
  },
};

const LangContext = createContext<LangContextType>({
  lang: "uz", setLang: () => {}, t: (k) => k,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("uz");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("flowday-lang") as Lang | null;
    if (saved && translations[saved]) setLangState(saved);
    setMounted(true);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("flowday-lang", l);
  };

  const t = (key: string) => translations[lang][key] || key;

  if (!mounted) return null;

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() { return useContext(LangContext); }
