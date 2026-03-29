"use client";

import { useAuth } from "@/lib/auth";
import ProfilePage from "@/components/ProfilePage";
import AuthPage from "@/components/AuthPage";
import { useRouter } from "next/navigation";

export default function ProfileRoute() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg)" }}>
      <div className="text-sm" style={{ color: "var(--text-3)" }}>Yuklanmoqda...</div>
    </div>
  );

  if (!user) return <AuthPage />;

  return (
    <div className="h-screen overflow-y-auto" style={{ background: "var(--bg)" }}>
      <ProfilePage onBack={() => router.push("/")} />
    </div>
  );
}
