import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { LangProvider } from "@/lib/lang";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flowday",
  description: "Kunlik rejalashtiruvchi - Supabase + bildirishnomalar",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Reja",
  },
};

export const viewport: Viewport = {
  themeColor: "#3ecf8e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <ThemeProvider>
          <LangProvider>
            <AuthProvider>{children}</AuthProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
