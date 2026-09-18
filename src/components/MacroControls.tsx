"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { MacroSettings, DEFAULT_MACROS } from "@/lib/audio/presets";
import {
  Volume2,
  SunMedium,
  Waves,
  Zap,
  RotateCcw,
  Headphones,
  Sliders,
  CheckCircle2,
  Radio,
} from "lucide-react";

interface MacroControlsProps {
  macros: MacroSettings;
  onChangeMacro: (macro: Partial<MacroSettings>) => void;
  onResetMacros: () => void;
  onOpenSignalChain: () => void;
}

export const MacroControls: React.FC<MacroControlsProps> = ({
  macros,
  onChangeMacro,
  onResetMacros,
  onOpenSignalChain,
}) => {
  const { t } = useLanguage();

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-6">
      {/* Header & A/B Bypass & Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-violet-400" />
            <span>{t.macros.title}</span>
          </h2>
          <p className="text-xs text-zinc-400">{t.macros.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* A/B Comparison Toggle Button */}
          <button
            onClick={() => onChangeMacro({ isBypassed: !macros.isBypassed })}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
              macros.isBypassed
                ? "bg-amber-500 text-black shadow-amber-500/30 scale-105"
                : "bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700"
            }`}
            title="Toggle between Processed Vocal and Dry Raw Vocal"
          >
            <Headphones className="w-4 h-4" />
            <span>
              {macros.isBypassed ? "BYPASS: RAW VOCAL" : t.macros.abToggle}
            </span>
          </button>

          {/* Reset Sliders */}
          <button
            onClick={onResetMacros}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
            title={t.macros.resetAll}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.macros.resetAll}</span>
          </button>
        </div>
      </div>

      {/* Bypass Notice Bar */}
      {macros.isBypassed && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3 text-amber-300 text-xs font-semibold animate-pulse">
          <Radio className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{t.macros.abBypassed}</span>
        </div>
      )}

      {/* 4 Core Macro Knobs / Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Vocal Balance */}
        <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400">
                <Volume2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">
                {t.macros.vocalBalance}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-violet-400 bg-violet-950/60 px-2 py-0.5 rounded border border-violet-800/50">
              {macros.vocalBalance > 0 ? `+${macros.vocalBalance} dB` : `${macros.vocalBalance} dB`}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-tight">
            {t.macros.vocalBalanceDesc}
          </p>
          <div className="pt-2">
            <input
              type="range"
              min="-10"
              max="10"
              step="0.5"
              value={macros.vocalBalance}
              onChange={(e) => onChangeMacro({ vocalBalance: parseFloat(e.target.value) })}
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 pt-1 font-mono">
              <span>-10 dB</span>
              <span className="text-zinc-400">0 dB (Preset default)</span>
              <span>+10 dB</span>
            </div>
          </div>
        </div>

        {/* 2. Tone (Brightness & Warmth) */}
        <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400">
                <SunMedium className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">
                {t.macros.tone}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
              {macros.tone > 0 ? `+${macros.tone}%` : `${macros.tone}%`}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-tight">
            {t.macros.toneDesc}
          </p>
          <div className="pt-2">
            <input
              type="range"
              min="-50"
              max="50"
              step="1"
              value={macros.tone}
              onChange={(e) => onChangeMacro({ tone: parseFloat(e.target.value) })}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 pt-1 font-mono">
              <span>Warm (-50)</span>
              <span className="text-zinc-400">Neutral (0)</span>
              <span>Air (+50)</span>
            </div>
          </div>
        </div>

        {/* 3. Space (Reverb & Echo) */}
        <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-600/20 text-cyan-400">
                <Waves className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">
                {t.macros.space}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
              {macros.space}%
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-tight">
            {t.macros.spaceDesc}
          </p>
          <div className="pt-2">
            <input
              type="range"
              min="0"
              max="200"
              step="2"
              value={macros.space}
              onChange={(e) => onChangeMacro({ space: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 pt-1 font-mono">
              <span>Dry (0%)</span>
              <span className="text-zinc-400">100%</span>
              <span>Lush (200%)</span>
            </div>
          </div>
        </div>

        {/* 4. Punch (Dynamics & Comp) */}
        <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">
                {t.macros.punch}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50">
              {macros.punch}%
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-tight">
            {t.macros.punchDesc}
          </p>
          <div className="pt-2">
            <input
              type="range"
              min="0"
              max="200"
              step="2"
              value={macros.punch}
              onChange={(e) => onChangeMacro({ punch: parseFloat(e.target.value) })}
              className="w-full accent-rose-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 pt-1 font-mono">
              <span>Gentle (0%)</span>
              <span className="text-zinc-400">100%</span>
              <span>Squashed (200%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signal Chain Interactive Breadcrumb */}
      <div
        onClick={onOpenSignalChain}
        className="cursor-pointer bg-zinc-900/40 hover:bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/60 transition-colors flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-medium text-zinc-300">
            {t.macros.chainDiagram}
          </span>
        </div>
        <div className="flex items-center flex-wrap gap-1.5 font-mono text-[10px]">
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">HPF 90Hz</span>
          <span className="text-zinc-600">→</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">3-Band EQ</span>
          <span className="text-zinc-600">→</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Compressor</span>
          <span className="text-zinc-600">→</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Saturation</span>
          <span className="text-zinc-600">→</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Delay & Reverb</span>
          <span className="text-zinc-600">→</span>
          <span className="px-1.5 py-0.5 rounded bg-violet-900/60 text-violet-300 border border-violet-600/40">Master Limiter (0dBFS)</span>
        </div>
      </div>
    </div>
  );
};
