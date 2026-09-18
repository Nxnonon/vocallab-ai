import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

export const metadata: Metadata = {
  title: "VocalLab AI - Auto-Vocal Mixing & Preset Platform",
  description:
    "Transform raw vocal takes into radio-ready hits with Web Audio DSP, dual-track waveform sync, and signature artist presets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen antialiased selection:bg-violet-600 selection:text-white">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
