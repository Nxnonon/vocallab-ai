"use client";

import React, { useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Mic, Disc, UploadCloud, CheckCircle2, Volume2, VolumeX, Trash2, RefreshCw, Sparkles } from "lucide-react";

interface TrackUploadZoneProps {
  vocalLoaded: boolean;
  beatLoaded: boolean;
  vocalName: string;
  beatName: string;
  vocalDuration: number;
  beatDuration: number;
  vocalVol: number;
  beatVol: number;
  vocalMuted: boolean;
  beatMuted: boolean;
  vocalSolo: boolean;
  beatSolo: boolean;
  onUpload: (track: "vocal" | "beat", file: File) => void;
  onRemove: (track: "vocal" | "beat") => void;
  onVolumeChange: (track: "vocal" | "beat", vol: number) => void;
  onToggleMute: (track: "vocal" | "beat") => void;
  onToggleSolo: (track: "vocal" | "beat") => void;
  onLoadDemo: () => void;
  isLoadingDemo: boolean;
}

export const TrackUploadZone: React.FC<TrackUploadZoneProps> = ({
  vocalLoaded,
  beatLoaded,
  vocalName,
  beatName,
  vocalDuration,
  beatDuration,
  vocalVol,
  beatVol,
  vocalMuted,
  beatMuted,
  vocalSolo,
  beatSolo,
  onUpload,
  onRemove,
  onVolumeChange,
  onToggleMute,
  onToggleSolo,
  onLoadDemo,
  isLoadingDemo,
}) => {
  const { t } = useLanguage();
  const vocalInputRef = useRef<HTMLInputElement>(null);
  const beatInputRef = useRef<HTMLInputElement>(null);

  const [vocalDragOver, setVocalDragOver] = useState(false);
  const [beatDragOver, setBeatDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent, track: "vocal" | "beat") => {
    e.preventDefault();
    if (track === "vocal") setVocalDragOver(false);
    else setBeatDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.includes("audio") || file.name.endsWith(".wav") || file.name.endsWith(".mp3")) {
        onUpload(track, file);
      }
    }
  };

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Lead Vocal Card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setVocalDragOver(true);
        }}
        onDragLeave={() => setVocalDragOver(false)}
        onDrop={(e) => handleDrop(e, "vocal")}
        className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-300 ${
          vocalDragOver
            ? "border-2 border-dashed border-violet-400 bg-violet-950/30 scale-[1.01]"
            : vocalLoaded
            ? "border border-violet-500/30 bg-zinc-900/70 shadow-lg shadow-violet-950/20"
            : "border border-dashed border-zinc-700/80 bg-zinc-900/40 hover:border-violet-500/50 hover:bg-zinc-900/60"
        }`}
      >
        <input
          ref={vocalInputRef}
          type="file"
          accept="audio/*,.wav,.mp3"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onUpload("vocal", e.target.files[0]);
            }
          }}
        />

        {/* Card Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${vocalLoaded ? "bg-violet-600 text-white shadow-md shadow-violet-600/30" : "bg-zinc-800 text-zinc-400"}`}>
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
                {t.upload.vocalTitle}
                {vocalLoaded && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {t.upload.vocalReady}
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-400">{t.upload.vocalDesc}</p>
            </div>
          </div>

          {vocalLoaded && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => vocalInputRef.current?.click()}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title={t.upload.replace}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onRemove("vocal")}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                title={t.upload.remove}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Content State */}
        {vocalLoaded ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80">
              <div className="truncate pr-2 font-medium text-zinc-200">
                {vocalName || "Vocal_Take_01.wav"}
              </div>
              <div className="text-zinc-400 flex items-center gap-2 shrink-0">
                <span>{formatSeconds(vocalDuration)}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {t.upload.vocalType}
                </span>
              </div>
            </div>

            {/* Quick Track Controls: Gain, Mute, Solo */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1 flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.01"
                  value={vocalVol}
                  onChange={(e) => onVolumeChange("vocal", parseFloat(e.target.value))}
                  className="flex-1 accent-violet-500"
                />
                <span className="text-[11px] font-mono text-zinc-400 w-10 text-right">
                  {Math.round(vocalVol * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToggleMute("vocal")}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                    vocalMuted
                      ? "bg-rose-600 text-white shadow-sm shadow-rose-600/30"
                      : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                  title={t.upload.mute}
                >
                  M
                </button>
                <button
                  onClick={() => onToggleSolo("vocal")}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                    vocalSolo
                      ? "bg-amber-500 text-black shadow-sm shadow-amber-500/30"
                      : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                  title={t.upload.solo}
                >
                  S
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => vocalInputRef.current?.click()}
            className="cursor-pointer py-6 flex flex-col items-center justify-center text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-800/80 group-hover:bg-violet-950/60 border border-zinc-700/60 group-hover:border-violet-500/40 flex items-center justify-center mb-2 transition-all group-hover:scale-110">
              <UploadCloud className="w-5 h-5 text-zinc-400 group-hover:text-violet-400 transition-colors" />
            </div>
            <p className="text-xs font-semibold text-zinc-200 group-hover:text-violet-300 transition-colors">
              {t.upload.vocalDrop}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">.wav or .mp3</p>
          </div>
        )}
      </div>

      {/* 2. Beat / Instrumental Card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setBeatDragOver(true);
        }}
        onDragLeave={() => setBeatDragOver(false)}
        onDrop={(e) => handleDrop(e, "beat")}
        className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-300 ${
          beatDragOver
            ? "border-2 border-dashed border-cyan-400 bg-cyan-950/30 scale-[1.01]"
            : beatLoaded
            ? "border border-cyan-500/30 bg-zinc-900/70 shadow-lg shadow-cyan-950/20"
            : "border border-dashed border-zinc-700/80 bg-zinc-900/40 hover:border-cyan-500/50 hover:bg-zinc-900/60"
        }`}
      >
        <input
          ref={beatInputRef}
          type="file"
          accept="audio/*,.wav,.mp3"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onUpload("beat", e.target.files[0]);
            }
          }}
        />

        {/* Card Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${beatLoaded ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30" : "bg-zinc-800 text-zinc-400"}`}>
              <Disc className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
                {t.upload.beatTitle}
                {beatLoaded && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {t.upload.beatReady}
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-400">{t.upload.beatDesc}</p>
            </div>
          </div>

          {beatLoaded && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => beatInputRef.current?.click()}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title={t.upload.replace}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onRemove("beat")}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                title={t.upload.remove}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Content State */}
        {beatLoaded ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80">
              <div className="truncate pr-2 font-medium text-zinc-200">
                {beatName || "Beat_Instrumental_120BPM.wav"}
              </div>
              <div className="text-zinc-400 flex items-center gap-2 shrink-0">
                <span>{formatSeconds(beatDuration)}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {t.upload.beatType}
                </span>
              </div>
            </div>

            {/* Quick Track Controls: Gain, Mute, Solo */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1 flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.01"
                  value={beatVol}
                  onChange={(e) => onVolumeChange("beat", parseFloat(e.target.value))}
                  className="flex-1 accent-cyan-500"
                />
                <span className="text-[11px] font-mono text-zinc-400 w-10 text-right">
                  {Math.round(beatVol * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToggleMute("beat")}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                    beatMuted
                      ? "bg-rose-600 text-white shadow-sm shadow-rose-600/30"
                      : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                  title={t.upload.mute}
                >
                  M
                </button>
                <button
                  onClick={() => onToggleSolo("beat")}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                    beatSolo
                      ? "bg-amber-500 text-black shadow-sm shadow-amber-500/30"
                      : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                  title={t.upload.solo}
                >
                  S
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => beatInputRef.current?.click()}
            className="cursor-pointer py-6 flex flex-col items-center justify-center text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-800/80 group-hover:bg-cyan-950/60 border border-zinc-700/60 group-hover:border-cyan-500/40 flex items-center justify-center mb-2 transition-all group-hover:scale-110">
              <UploadCloud className="w-5 h-5 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
            </div>
            <p className="text-xs font-semibold text-zinc-200 group-hover:text-cyan-300 transition-colors">
              {t.upload.beatDrop}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">.wav or .mp3</p>
          </div>
        )}
      </div>
    </div>
  );
};
