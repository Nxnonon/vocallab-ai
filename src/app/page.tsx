"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getAudioMixer, PlaybackState } from "@/lib/audio/mixer";
import { PresetId, PRESETS, MacroSettings, DEFAULT_MACROS } from "@/lib/audio/presets";
import { createDemoStems } from "@/lib/audio/demoAudio";
import { Navbar } from "@/components/Navbar";
import { TrackUploadZone } from "@/components/TrackUploadZone";
import { WaveformTimeline } from "@/components/WaveformTimeline";
import { PresetSelector } from "@/components/PresetSelector";
import { MacroControls } from "@/components/MacroControls";
import { ExportModal } from "@/components/ExportModal";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";
import { SignalChainModal } from "@/components/SignalChainModal";
import {
  Sparkles,
  Download,
  Music2,
  Headphones,
  Sliders,
  Radio,
  Layers,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  const { t, language } = useLanguage();
  const mixer = getAudioMixer();

  // Audio Engine State
  const [vocalBuffer, setVocalBuffer] = useState<AudioBuffer | null>(null);
  const [beatBuffer, setBeatBuffer] = useState<AudioBuffer | null>(null);
  const [vocalName, setVocalName] = useState<string>("");
  const [beatName, setBeatName] = useState<string>("");
  const [playbackState, setPlaybackState] = useState<PlaybackState>("stopped");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(16);
  const [vocalOffset, setVocalOffset] = useState<number>(0);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [masterLevel, setMasterLevel] = useState<number>(0);
  const [vocalLevel, setVocalLevel] = useState<number>(0);

  // Track Mixers
  const [vocalVol, setVocalVol] = useState<number>(1.0);
  const [beatVol, setBeatVol] = useState<number>(1.0);
  const [vocalMuted, setVocalMuted] = useState<boolean>(false);
  const [beatMuted, setBeatMuted] = useState<boolean>(false);
  const [vocalSolo, setVocalSolo] = useState<boolean>(false);
  const [beatSolo, setBeatSolo] = useState<boolean>(false);

  // Presets & Macros
  const [activePresetId, setActivePresetId] = useState<PresetId>("midnight-rb");
  const [macros, setMacros] = useState<MacroSettings>({ ...DEFAULT_MACROS });

  // Plan & Modals
  const [isPro, setIsPro] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isProModalOpen, setIsProModalOpen] = useState<boolean>(false);
  const [isSignalChainOpen, setIsSignalChainOpen] = useState<boolean>(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState<boolean>(false);

  // Setup Audio Engine Event Listeners
  useEffect(() => {
    const removeListener = mixer.addListener({
      onTimeUpdate: (time, dur) => {
        setCurrentTime(time);
        setTotalDuration(dur);
      },
      onStateChange: (st) => {
        setPlaybackState(st);
      },
      onMeterUpdate: (vocal, master) => {
        setVocalLevel(vocal);
        setMasterLevel(master);
      },
      onTrackLoaded: (track, buffer) => {
        if (track === "vocal") {
          setVocalBuffer(buffer);
        } else {
          setBeatBuffer(buffer);
        }
      },
    });

    return () => {
      removeListener();
    };
  }, [mixer]);

  // Spacebar hotkey to toggle playback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        if (playbackState === "playing") {
          mixer.pause();
        } else {
          mixer.play();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playbackState, mixer]);

  // Handle Loading Demo Stems
  const handleLoadDemo = async () => {
    try {
      setIsLoadingDemo(true);
      const ctx = await mixer.initContext();
      const { vocalBuffer: demoVocal, beatBuffer: demoBeat } = await createDemoStems(ctx);

      mixer.setAudioBuffers(demoVocal, demoBeat);
      setVocalBuffer(demoVocal);
      setBeatBuffer(demoBeat);
      setVocalName("Demo_Lead_Vocal_Cmin.wav");
      setBeatName("Demo_Beat_Instrumental_120BPM.wav");
      setTotalDuration(mixer.getTotalDuration());
      mixer.setPreset(activePresetId);
      mixer.seek(0);
      setIsLoadingDemo(false);
    } catch (err) {
      console.error("Failed to load demo:", err);
      setIsLoadingDemo(false);
    }
  };

  // Upload track handler
  const handleUploadTrack = async (track: "vocal" | "beat", file: File) => {
    try {
      const buffer = await mixer.loadAudioFile(track, file);
      if (track === "vocal") {
        setVocalBuffer(buffer);
        setVocalName(file.name);
      } else {
        setBeatBuffer(buffer);
        setBeatName(file.name);
      }
      setTotalDuration(mixer.getTotalDuration());
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  const handleRemoveTrack = (track: "vocal" | "beat") => {
    if (track === "vocal") {
      mixer.setAudioBuffers(null, mixer.getBeatBuffer());
      setVocalBuffer(null);
      setVocalName("");
    } else {
      mixer.setAudioBuffers(mixer.getVocalBuffer(), null);
      setBeatBuffer(null);
      setBeatName("");
    }
    setTotalDuration(mixer.getTotalDuration());
  };

  // Track Mixer handlers
  const handleVolumeChange = (track: "vocal" | "beat", vol: number) => {
    if (track === "vocal") {
      setVocalVol(vol);
      mixer.setVocalVolume(vol);
    } else {
      setBeatVol(vol);
      mixer.setBeatVolume(vol);
    }
  };

  const handleToggleMute = (track: "vocal" | "beat") => {
    if (track === "vocal") {
      setVocalMuted(mixer.toggleVocalMute());
    } else {
      setBeatMuted(mixer.toggleBeatMute());
    }
  };

  const handleToggleSolo = (track: "vocal" | "beat") => {
    if (track === "vocal") {
      const s = mixer.toggleVocalSolo();
      setVocalSolo(s);
      if (s) setBeatSolo(false);
    } else {
      const s = mixer.toggleBeatSolo();
      setBeatSolo(s);
      if (s) setVocalSolo(false);
    }
  };

  // Offset handler
  const handleOffsetChange = (offset: number) => {
    setVocalOffset(offset);
    mixer.setVocalOffset(offset);
  };

  // Preset Selection
  const handleSelectPreset = (id: PresetId) => {
    setActivePresetId(id);
    mixer.setPreset(id);
  };

  // Macro adjustments
  const handleChangeMacro = (updated: Partial<MacroSettings>) => {
    const next = { ...macros, ...updated };
    setMacros(next);
    mixer.setMacros(next);
  };

  const handleResetMacros = () => {
    setMacros({ ...DEFAULT_MACROS });
    mixer.setMacros({ ...DEFAULT_MACROS });
  };

  const activePreset = PRESETS[activePresetId];

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b]">
      {/* 1. Global Navigation Bar */}
      <Navbar
        onLoadDemo={handleLoadDemo}
        isLoadingDemo={isLoadingDemo}
        onOpenProModal={() => setIsProModalOpen(true)}
        onOpenSignalChain={() => setIsSignalChainOpen(true)}
        isPro={isPro}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-7">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-violet-950/40 via-zinc-900/60 to-zinc-950 border border-violet-500/20 shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/30">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Studio-Grade Web Audio DSP</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {t.hero.title}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300/90 leading-relaxed">
              {t.hero.subtitle}
            </p>

            {/* If no audio loaded yet, prominent demo CTA */}
            {!vocalBuffer && !beatBuffer && (
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleLoadDemo}
                  disabled={isLoadingDemo}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black shadow-lg shadow-emerald-600/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>{isLoadingDemo ? "Generating Stems..." : t.navbar.loadDemo}</span>
                </button>
                <span className="text-xs text-zinc-400">
                  {t.hero.tryDemoNotice}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Feature B: Dual-Track Audio Uploader */}
        <section className="space-y-2">
          <TrackUploadZone
            vocalLoaded={!!vocalBuffer}
            beatLoaded={!!beatBuffer}
            vocalName={vocalName}
            beatName={beatName}
            vocalDuration={vocalBuffer?.duration || 0}
            beatDuration={beatBuffer?.duration || 0}
            vocalVol={vocalVol}
            beatVol={beatVol}
            vocalMuted={vocalMuted}
            beatMuted={beatMuted}
            vocalSolo={vocalSolo}
            beatSolo={beatSolo}
            onUpload={handleUploadTrack}
            onRemove={handleRemoveTrack}
            onVolumeChange={handleVolumeChange}
            onToggleMute={handleToggleMute}
            onToggleSolo={handleToggleSolo}
            onLoadDemo={handleLoadDemo}
            isLoadingDemo={isLoadingDemo}
          />
        </section>

        {/* Waveform Timeline & Transport */}
        <section className="space-y-2">
          <WaveformTimeline
            vocalBuffer={vocalBuffer}
            beatBuffer={beatBuffer}
            playbackState={playbackState}
            currentTime={currentTime}
            duration={totalDuration}
            vocalOffset={vocalOffset}
            isLooping={isLooping}
            masterLevel={masterLevel}
            vocalLevel={vocalLevel}
            onPlay={() => mixer.play()}
            onPause={() => mixer.pause()}
            onStop={() => mixer.stop()}
            onSeek={(time) => mixer.seek(time)}
            onOffsetChange={handleOffsetChange}
            onToggleLoop={() => {
              const next = !isLooping;
              setIsLooping(next);
              mixer.setLooping(next);
            }}
          />
        </section>

        {/* Feature C: Signature Artist Presets */}
        <section>
          <PresetSelector
            activePresetId={activePresetId}
            onSelectPreset={handleSelectPreset}
          />
        </section>

        {/* Feature D: Macro Controls */}
        <section>
          <MacroControls
            macros={macros}
            onChangeMacro={handleChangeMacro}
            onResetMacros={handleResetMacros}
            onOpenSignalChain={() => setIsSignalChainOpen(true)}
          />
        </section>

        {/* Floating / Sticky Master Export Bar */}
        {(vocalBuffer || beatBuffer) && (
          <div className="sticky bottom-6 z-30 flex items-center justify-between p-4 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/30 hidden sm:block">
                <Music2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    {activePreset.badge}
                  </span>
                  {macros.isBypassed && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      RAW BYPASS
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 hidden sm:block">
                  Mastered with 0 dBFS Peak Limiting & Parametric Web Audio DSP
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>{t.exportModal.title}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-500 space-y-1">
        <p>{t.footer.builtWith}</p>
        <p>{t.footer.copyright}</p>
      </footer>

      {/* Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        vocalBuffer={vocalBuffer || mixer.getVocalBuffer()}
        beatBuffer={beatBuffer || mixer.getBeatBuffer()}
        vocalOffset={vocalOffset}
        vocalGain={vocalMuted ? 0 : (beatSolo ? 0 : vocalVol)}
        beatGain={beatMuted ? 0 : (vocalSolo ? 0 : beatVol)}
        preset={activePreset}
        macros={macros}
        isPro={isPro}
        onOpenProModal={() => setIsProModalOpen(true)}
      />

      <ProUpgradeModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        isPro={isPro}
        onUpgradeSuccess={() => setIsPro(true)}
      />

      <SignalChainModal
        isOpen={isSignalChainOpen}
        onClose={() => setIsSignalChainOpen(false)}
        preset={activePreset}
      />
    </div>
  );
}
