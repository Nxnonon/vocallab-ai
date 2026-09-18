"use client";

import React, { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { renderAudio, downloadAudioBlob } from "@/lib/audio/exporter";
import { getAudioMixer } from "@/lib/audio/mixer";
import { PresetConfig, MacroSettings } from "@/lib/audio/presets";
import {
  X,
  Download,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertCircle,
  FileAudio,
  ShieldCheck,
  Crown,
} from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  vocalBuffer: AudioBuffer | null;
  beatBuffer: AudioBuffer | null;
  vocalOffset: number;
  vocalGain?: number;
  beatGain?: number;
  preset: PresetConfig;
  macros: MacroSettings;
  isPro: boolean;
  onOpenProModal: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  vocalBuffer,
  beatBuffer,
  vocalOffset,
  vocalGain = 1.0,
  beatGain = 1.0,
  preset,
  macros,
  isPro,
  onOpenProModal,
}) => {
  const { t } = useLanguage();

  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [masterBlob, setMasterBlob] = useState<Blob | null>(null);
  const [stemBlob, setStemBlob] = useState<Blob | null>(null);
  const [renderDuration, setRenderDuration] = useState(0);
  const [bitDepth, setBitDepth] = useState<16 | 24>(16);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentVocal = vocalBuffer || (typeof window !== "undefined" ? getAudioMixer().getVocalBuffer() : null);
  const currentBeat = beatBuffer || (typeof window !== "undefined" ? getAudioMixer().getBeatBuffer() : null);

  if (!isOpen) return null;

  const handleStartRender = async () => {
    try {
      setIsRendering(true);
      setErrorMsg(null);
      setRenderProgress(10);

      // 1. Render Master (will use uploaded files or fallback to demo stems if none uploaded)
      const masterResult = await renderAudio({
        vocalBuffer: currentVocal,
        beatBuffer: currentBeat,
        vocalOffset,
        preset,
        macros,
        isPro,
        vocalGain,
        beatGain,
        bitDepth,
        onProgress: (p) => setRenderProgress(p),
      });

      setMasterBlob(masterResult.blob);
      setRenderDuration(masterResult.duration);

      // 2. Render Stem if vocal is present
      if (currentVocal) {
        const stemResult = await renderAudio({
          vocalBuffer: currentVocal,
          beatBuffer: null,
          vocalOffset,
          preset,
          macros,
          isPro,
          vocalGain,
          beatGain: 0,
          exportStemOnly: true,
          bitDepth,
        });
        setStemBlob(stemResult.blob);
      }

      setIsRendering(false);

      // Trigger confetti celebration
      try {
        const confetti = (await import("canvas-confetti")).default;
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    } catch (err: unknown) {
      setIsRendering(false);
      setErrorMsg(err instanceof Error ? err.message : "Failed to render audio");
    }
  };

  const handleDownloadMaster = () => {
    if (!masterBlob) return;
    const filename = `VocalLab_${preset.id}_Master_${bitDepth}bit.wav`;
    downloadAudioBlob(masterBlob, filename);
  };

  const handleDownloadStem = () => {
    if (!stemBlob) return;
    const filename = `VocalLab_${preset.id}_VocalStem_${bitDepth}bit.wav`;
    downloadAudioBlob(stemBlob, filename);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 space-y-5 text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 pr-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400">
              <Download className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">
              {t.exportModal.title}
            </h2>
          </div>
          <p className="text-xs text-zinc-400">{t.exportModal.subtitle}</p>
        </div>

        {/* Quality Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300">
            {t.exportModal.formatLabel}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setBitDepth(16)}
              className={`p-3 rounded-xl border text-left transition-all ${
                bitDepth === 16
                  ? "border-violet-500 bg-violet-950/40 text-white"
                  : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <div className="text-xs font-bold text-white">16-bit WAV (PCM)</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                Standard Red Book (44.1kHz)
              </div>
            </button>

            <button
              onClick={() => setBitDepth(24)}
              className={`p-3 rounded-xl border text-left transition-all ${
                bitDepth === 24
                  ? "border-violet-500 bg-violet-950/40 text-white"
                  : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>24-bit WAV Studio</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                  PRO
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                High-Resolution Master
              </div>
            </button>
          </div>
        </div>

        {/* Plan Limit / Safeguard Info */}
        <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">0 dBFS Master Peak Limiter active</span>
          </div>

          {isPro ? (
            <div className="flex items-center gap-2 text-amber-300 text-[11px] pt-1">
              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{t.exportModal.proFullLength}</span>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2 text-zinc-400 text-[11px] pt-1">
              <div className="flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{t.exportModal.freeLimitNote}</span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenProModal();
                }}
                className="text-violet-400 font-bold hover:underline shrink-0"
              >
                PRO
              </button>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Rendering Progress or Success State */}
        {isRendering && (
          <div className="space-y-2 py-3">
            <div className="flex items-center justify-between text-xs text-zinc-300 font-medium">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                {t.exportModal.renderingStatus}
              </span>
              <span className="font-mono font-bold text-violet-400">
                {renderProgress}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-emerald-400 transition-all duration-150"
                style={{ width: `${renderProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Download Buttons after completion */}
        {masterBlob && !isRendering ? (
          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{t.exportModal.completeStatus} ({renderDuration.toFixed(1)}s rendered)</span>
            </div>

            <button
              onClick={handleDownloadMaster}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>{t.exportModal.downloadWav}</span>
            </button>

            {stemBlob && (
              <button
                onClick={handleDownloadStem}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
              >
                <FileAudio className="w-3.5 h-3.5 text-violet-400" />
                <span>{t.exportModal.downloadStem}</span>
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={handleStartRender}
            disabled={isRendering || (!currentVocal && !currentBeat)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          >
            {isRendering ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.exportModal.renderingStatus}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>{t.exportModal.renderButton}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
