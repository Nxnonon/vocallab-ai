"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  SlidersHorizontal,
  Volume2,
  Mic,
  Disc,
  Clock,
} from "lucide-react";
import { PlaybackState } from "@/lib/audio/mixer";

interface WaveformTimelineProps {
  vocalBuffer: AudioBuffer | null;
  beatBuffer: AudioBuffer | null;
  playbackState: PlaybackState;
  currentTime: number;
  duration: number;
  vocalOffset: number; // in seconds (-0.5 to +0.5)
  isLooping: boolean;
  masterLevel: number;
  vocalLevel: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onOffsetChange: (offset: number) => void;
  onToggleLoop: () => void;
}

export const WaveformTimeline: React.FC<WaveformTimelineProps> = ({
  vocalBuffer,
  beatBuffer,
  playbackState,
  currentTime,
  duration,
  vocalOffset,
  isLooping,
  masterLevel,
  vocalLevel,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onOffsetChange,
  onToggleLoop,
}) => {
  const { t } = useLanguage();
  const vocalCanvasRef = useRef<HTMLCanvasElement>(null);
  const beatCanvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [isDraggingSeek, setIsDraggingSeek] = useState(false);

  // Helper to draw waveform peaks onto a canvas
  const drawWaveform = useCallback(
    (
      canvas: HTMLCanvasElement | null,
      buffer: AudioBuffer | null,
      color: string,
      offsetSec: number = 0
    ) => {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (!buffer || duration <= 0) {
        // Draw empty grid lines
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        return;
      }

      // Pre-calculate peaks
      const channelData = buffer.getChannelData(0);
      const totalDur = duration;
      const startPx = (offsetSec / totalDur) * width;
      const trackWidth = (buffer.duration / totalDur) * width;

      const samplesPerPixel = Math.max(1, Math.floor(channelData.length / trackWidth));
      const midY = height / 2;

      ctx.fillStyle = color;

      for (let x = 0; x < trackWidth; x++) {
        const actualX = startPx + x;
        if (actualX < 0 || actualX > width) continue;

        let min = 1.0;
        let max = -1.0;
        const startSample = Math.floor(x * samplesPerPixel);
        const endSample = Math.min(channelData.length, startSample + samplesPerPixel);

        for (let j = startSample; j < endSample; j += 4) {
          const val = channelData[j];
          if (val < min) min = val;
          if (val > max) max = val;
        }

        if (max < min) {
          min = -0.05;
          max = 0.05;
        }

        const barHeight = Math.max(2, (max - min) * midY * 0.9);
        const y = midY - barHeight / 2;

        ctx.fillRect(actualX, y, 1.5, barHeight);
      }
    },
    [duration]
  );

  // Redraw waveforms on buffer or offset or size changes
  useEffect(() => {
    const handleResize = () => {
      if (vocalCanvasRef.current && beatCanvasRef.current && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        vocalCanvasRef.current.width = rect.width;
        vocalCanvasRef.current.height = 70;
        beatCanvasRef.current.width = rect.width;
        beatCanvasRef.current.height = 70;

        drawWaveform(vocalCanvasRef.current, vocalBuffer, "#a855f7", vocalOffset);
        drawWaveform(beatCanvasRef.current, beatBuffer, "#06b6d4", 0);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [vocalBuffer, beatBuffer, vocalOffset, duration, drawWaveform]);

  // Handle seeking click or drag on timeline
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || duration <= 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return "00:00.0";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6 space-y-4">
      {/* Top Bar: Playback Controls & Time Readout */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
        {/* Transport Buttons */}
        <div className="flex items-center gap-2">
          {playbackState === "playing" ? (
            <button
              onClick={onPause}
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30 transition-all hover:scale-105 active:scale-95"
              title={t.timeline.pause}
            >
              <Pause className="w-5 h-5 fill-current" />
            </button>
          ) : (
            <button
              onClick={onPlay}
              disabled={!vocalBuffer && !beatBuffer}
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              title={t.timeline.play}
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </button>
          )}

          <button
            onClick={onStop}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
            title={t.timeline.stop}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleLoop}
            className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all ${
              isLooping
                ? "bg-violet-950/60 text-violet-400 border border-violet-500/40"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
            title={t.timeline.loop}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Time Display */}
        <div className="flex items-center gap-2 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800/80 font-mono text-sm tracking-wider">
          <Clock className="w-4 h-4 text-violet-400" />
          <span className="text-white font-bold">{formatTime(currentTime)}</span>
          <span className="text-zinc-500">/</span>
          <span className="text-zinc-400">{formatTime(duration)}</span>
        </div>

        {/* Real-time Level Meters */}
        <div className="flex items-center gap-4 bg-zinc-950/60 px-3 py-1.5 rounded-xl border border-zinc-800/60">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-zinc-400 font-bold">VOCAL</span>
            <div className="w-16 h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-75"
                style={{ width: `${Math.min(100, vocalLevel * 140)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-zinc-400 font-bold">MASTER</span>
            <div className="w-16 h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  masterLevel > 0.85
                    ? "bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500"
                    : "bg-gradient-to-r from-emerald-500 to-cyan-400"
                }`}
                style={{ width: `${Math.min(100, masterLevel * 130)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dual Waveform Canvas Container with Synchronized Playhead */}
      <div
        ref={timelineRef}
        onClick={handleTimelineClick}
        className="relative cursor-pointer bg-zinc-950 rounded-xl p-2 border border-zinc-800/80 select-none overflow-hidden group shadow-inner"
      >
        {/* Synchronized Vertical Playhead Line */}
        <div
          className="absolute top-0 bottom-0 z-20 pointer-events-none transition-all duration-75"
          style={{ left: `${progressPercent}%` }}
        >
          <div className="w-0.5 h-full bg-white shadow-[0_0_10px_#fff]" />
          <div className="w-2.5 h-2.5 rounded-full bg-white -ml-1 -top-1 absolute shadow-md shadow-white/50" />
        </div>

        {/* Track 1: Vocal Waveform */}
        <div className="relative mb-2">
          <div className="absolute top-1 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900/80 text-[10px] font-semibold text-violet-300 border border-violet-500/20 backdrop-blur-sm pointer-events-none">
            <Mic className="w-3 h-3" />
            <span>{t.timeline.vocalTrackLabel}</span>
            {Math.abs(vocalOffset) > 0.001 && (
              <span className="text-[9px] text-violet-400 font-mono">
                ({vocalOffset > 0 ? `+${Math.round(vocalOffset * 1000)}ms` : `${Math.round(vocalOffset * 1000)}ms`})
              </span>
            )}
          </div>
          <canvas
            ref={vocalCanvasRef}
            className="w-full h-[70px] rounded-lg bg-zinc-900/40 block"
          />
        </div>

        {/* Track 2: Beat Waveform */}
        <div className="relative">
          <div className="absolute top-1 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900/80 text-[10px] font-semibold text-cyan-300 border border-cyan-500/20 backdrop-blur-sm pointer-events-none">
            <Disc className="w-3 h-3" />
            <span>{t.timeline.beatTrackLabel}</span>
          </div>
          <canvas
            ref={beatCanvasRef}
            className="w-full h-[70px] rounded-lg bg-zinc-900/40 block"
          />
        </div>

        {/* Hover Cue */}
        <div className="absolute bottom-1 right-2 text-[9px] text-zinc-400 opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none">
          {t.timeline.clickToSeek}
        </div>
      </div>

      {/* Vocal Timing Offset / Alignment Nudge Control */}
      <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-800/60">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-bold text-white tracking-wide">
              {t.timeline.offsetTitle}
            </span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
              {vocalOffset >= 0 ? `+${Math.round(vocalOffset * 1000)} ms` : `${Math.round(vocalOffset * 1000)} ms`}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">{t.timeline.offsetHint}</p>
        </div>

        {/* Slider & Nudge Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onOffsetChange(Math.max(-0.5, vocalOffset - 0.025))}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
            title="Nudge vocal 25ms earlier"
          >
            {t.timeline.nudgeBack}
          </button>

          <input
            type="range"
            min="-0.5"
            max="0.5"
            step="0.005"
            value={vocalOffset}
            onChange={(e) => onOffsetChange(parseFloat(e.target.value))}
            className="w-32 sm:w-44 accent-violet-500"
          />

          <button
            onClick={() => onOffsetChange(Math.min(0.5, vocalOffset + 0.025))}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
            title="Nudge vocal 25ms later"
          >
            {t.timeline.nudgeForward}
          </button>

          <button
            onClick={() => onOffsetChange(0)}
            disabled={Math.abs(vocalOffset) < 0.001}
            className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Reset vocal sync offset"
          >
            0ms
          </button>
        </div>
      </div>
    </div>
  );
};
