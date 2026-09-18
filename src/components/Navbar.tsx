"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Sparkles, Crown, Music, Globe, Layers } from "lucide-react";

interface NavbarProps {
  onLoadDemo: () => void;
  isLoadingDemo: boolean;
  onOpenProModal: () => void;
  onOpenSignalChain: () => void;
  isPro: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onLoadDemo,
  isLoadingDemo,
  onOpenProModal,
  onOpenSignalChain,
  isPro,
}) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25">
            <Music className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                {t.navbar.appName}
              </span>
              <span className="text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase">
                AI Engine
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              {t.navbar.tagline}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Signal Chain Button */}
          <button
            onClick={onOpenSignalChain}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-violet-400" />
            <span>{t.navbar.docs}</span>
          </button>

          {/* Quick Demo Button */}
          <button
            onClick={onLoadDemo}
            disabled={isLoadingDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            title="Synthesizes and loads high-quality beat and vocal tracks to test instantly"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isLoadingDemo ? "animate-spin" : "text-emerald-400"}`} />
            <span className="hidden sm:inline">
              {isLoadingDemo ? "Generating..." : t.navbar.loadDemo}
            </span>
            <span className="sm:hidden">Demo</span>
          </button>

          {/* Plan Status / Upgrade Button */}
          {isPro ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.navbar.proBadge}</span>
            </div>
          ) : (
            <button
              onClick={onOpenProModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-600/20 transition-all hover:scale-105 active:scale-95"
            >
              <Crown className="w-3.5 h-3.5 text-yellow-300" />
              <span>{t.navbar.upgradePro}</span>
            </button>
          )}

          {/* Language Switcher */}
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/80 p-0.5">
            <button
              onClick={() => setLanguage("en")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                language === "en"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Switch to English"
            >
              <span>🇺🇸</span>
              <span className="font-semibold">EN</span>
            </button>
            <button
              onClick={() => setLanguage("th")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                language === "th"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="เปลี่ยนเป็นภาษาไทย"
            >
              <span>🇹🇭</span>
              <span className="font-semibold">TH</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
