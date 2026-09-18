"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { PresetId, PRESETS } from "@/lib/audio/presets";
import { Sparkles, Moon, Flame, Wind, Disc3, Check, Music } from "lucide-react";

interface PresetSelectorProps {
  activePresetId: PresetId;
  onSelectPreset: (id: PresetId) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  activePresetId,
  onSelectPreset,
}) => {
  const { t } = useLanguage();

  const presetsList: {
    id: PresetId;
    icon: React.ReactNode;
    name: string;
    artist: string;
    desc: string;
    vibe: string;
    gradient: string;
    borderGlow: string;
    tags: string[];
  }[] = [
    {
      id: "midnight-rb",
      icon: <Moon className="w-5 h-5 text-purple-300" />,
      name: t.presets.theWeeknd.name,
      artist: t.presets.theWeeknd.artist,
      desc: t.presets.theWeeknd.desc,
      vibe: t.presets.theWeeknd.vibe,
      gradient: "from-purple-950/80 via-indigo-950/60 to-zinc-900/90",
      borderGlow: "border-purple-500 shadow-purple-900/30",
      tags: ["Smooth Highs", "Lush Plate Reverb", "R&B / Soul"],
    },
    {
      id: "rodeo-trap",
      icon: <Flame className="w-5 h-5 text-amber-300" />,
      name: t.presets.travisScott.name,
      artist: t.presets.travisScott.artist,
      desc: t.presets.travisScott.desc,
      vibe: t.presets.travisScott.vibe,
      gradient: "from-amber-950/80 via-orange-950/60 to-zinc-900/90",
      borderGlow: "border-orange-500 shadow-orange-900/30",
      tags: ["Heavy Comp", "Tube Saturation", "Slapback Delay"],
    },
    {
      id: "whisper-pop",
      icon: <Wind className="w-5 h-5 text-emerald-300" />,
      name: t.presets.billieEilish.name,
      artist: t.presets.billieEilish.artist,
      desc: t.presets.billieEilish.desc,
      vibe: t.presets.billieEilish.vibe,
      gradient: "from-emerald-950/80 via-teal-950/60 to-zinc-900/90",
      borderGlow: "border-emerald-500 shadow-emerald-900/30",
      tags: ["Intimate Close-Mic", "12kHz Air", "Zero Reverb"],
    },
    {
      id: "melodic-arena",
      icon: <Sparkles className="w-5 h-5 text-cyan-300" />,
      name: t.presets.postMalone.name,
      artist: t.presets.postMalone.artist,
      desc: t.presets.postMalone.desc,
      vibe: t.presets.postMalone.vibe,
      gradient: "from-cyan-950/80 via-blue-950/60 to-zinc-900/90",
      borderGlow: "border-cyan-500 shadow-cyan-900/30",
      tags: ["Arena Hall", "Wide Stereo", "1/4 Note Delay"],
    },
    {
      id: "polished-pop",
      icon: <Disc3 className="w-5 h-5 text-pink-300" />,
      name: t.presets.taylorSwift.name,
      artist: t.presets.taylorSwift.artist,
      desc: t.presets.taylorSwift.desc,
      vibe: t.presets.taylorSwift.vibe,
      gradient: "from-pink-950/80 via-rose-950/60 to-zinc-900/90",
      borderGlow: "border-pink-500 shadow-pink-900/30",
      tags: ["Pristine Clear", "Silky Air EQ", "Top-40 Polish"],
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <span>{t.presets.title}</span>
          </h2>
          <p className="text-xs text-zinc-400">{t.presets.subtitle}</p>
        </div>
      </div>

      {/* Preset Cards Grid (5 signature artist cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {presetsList.map((preset) => {
          const isActive = activePresetId === preset.id;
          return (
            <div
              key={preset.id}
              onClick={() => onSelectPreset(preset.id)}
              className={`relative cursor-pointer rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between group select-none ${
                isActive
                  ? `bg-gradient-to-b ${preset.gradient} border-2 ${preset.borderGlow} shadow-xl scale-[1.02]`
                  : "bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700 hover:scale-[1.01]"
              }`}
            >
              {/* Active Pill Badge */}
              {isActive && (
                <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-white text-black shadow-md flex items-center gap-1">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  <span>{t.presets.activeBadge}</span>
                </div>
              )}

              {/* Top Details */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-zinc-800/80 border border-zinc-700/50 group-hover:scale-110 transition-transform">
                    {preset.icon}
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/40">
                    {preset.vibe}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-white tracking-wide">
                    {preset.name}
                  </h3>
                  <p className="text-xs font-medium text-violet-300/90">
                    {preset.artist}
                  </p>
                </div>

                <p className="text-[11px] text-zinc-300/80 line-clamp-3 leading-relaxed">
                  {preset.desc}
                </p>
              </div>

              {/* Tags Bottom */}
              <div className="pt-3 border-t border-zinc-800/60 mt-3 flex flex-wrap gap-1">
                {preset.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-black/40 text-zinc-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
