"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { PresetConfig } from "@/lib/audio/presets";
import { X, Layers, Activity, ArrowRight, ShieldCheck } from "lucide-react";

interface SignalChainModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset: PresetConfig;
}

export const SignalChainModal: React.FC<SignalChainModalProps> = ({
  isOpen,
  onClose,
  preset,
}) => {
  const { language } = useLanguage();

  if (!isOpen) return null;

  const p = preset.params;

  const nodes = [
    {
      name: "High-Pass Filter (HPF)",
      type: "BiquadFilter (highpass)",
      value: `${p.highpassFreq} Hz (12 dB/oct)`,
      descEn: "Cuts sub-bass rumble, microphone handling noise, and AC hum below the vocal fundamentals.",
      descTh: "ตัดเสียงรบกวนความถี่ต่ำมาก (Sub-bass rumble) และเสียงกระแทกไมโครโฟน",
    },
    {
      name: "3-Band Parametric EQ",
      type: "BiquadFilter (lowshelf / peaking / highshelf)",
      value: `Low: ${p.lowShelfGain}dB @${p.lowShelfFreq}Hz | Mid: ${p.midGain}dB @${p.midFreq}Hz | High: ${p.highShelfGain}dB @${p.highShelfFreq}Hz`,
      descEn: "Sculpts vocal character: clears low-mid boxiness, adds vocal bite/presence, and opens high air frequencies.",
      descTh: "ปรับแต่งย่านเสียงร้อง 3 แบนด์: ลดเสียงบวมทึบ ดันย่านเสียงร้องให้พุ่ง และเพิ่มความสว่างใส (Air)",
    },
    {
      name: "Studio Dynamics Compressor",
      type: "DynamicsCompressorNode",
      value: `Thresh: ${p.compThreshold} dB | Ratio: ${p.compRatio}:1 | Atk: ${p.compAttack * 1000}ms | Rel: ${p.compRelease * 1000}ms`,
      descEn: "Controls dynamic swings, evens out vocal volume, and glues the vocal securely into the mix.",
      descTh: "ควบคุมไดนามิกและระดับความดังให้อยู่ในระดับที่คงที่ นุ่มนวล กลมกลืนเข้ากับดนตรี",
    },
    {
      name: "Harmonic Saturation & Drive",
      type: "WaveShaperNode (4x Oversampled)",
      value: `Drive: ${Math.round(p.saturationDrive * 100)}% (Soft Arctangent Curve)`,
      descEn: "Generates subtle even/odd tube and tape harmonics for warmth, grit, and analog presence.",
      descTh: "เติมฮาร์โมนิกให้อบอุ่น เสมือนผ่านปรีแอมป์หลอดหรือเทปอนาล็อก ให้เสียงร้องมีมิติและไม่แบน",
    },
    {
      name: "Stereo Echo & Delay",
      type: "DelayNode + Feedback Loop + Lowpass 3.5kHz",
      value: `Time: ${p.delayTime * 1000}ms | Feedback: ${Math.round(p.delayFeedback * 100)}% | Wet: ${Math.round(p.delayWet * 100)}%`,
      descEn: "Creates spatial rhythm echoes with analog high-cut tape damping.",
      descTh: "สร้างเสียงเอคโค่สะท้อนตามจังหวะ พร้อมฟิลเตอร์เสียงเทปอนาล็อกแบบคลาสสิก",
    },
    {
      name: "Acoustic Convolver Reverb",
      type: "ConvolverNode (Stereo Impulse Response)",
      value: `Decay: ${p.reverbDecay}s | Wet: ${Math.round(p.reverbWet * 100)}% (Algorithmic Room/Plate/Hall)`,
      descEn: "Places the vocalist inside an acoustic room, lush plate, or expansive arena hall.",
      descTh: "สร้างมิติเสียงสะท้อนของห้อง ทั้งแบบเพลทและฮอลล์ขนาดใหญ่ สมจริงเป็นธรรมชาติ",
    },
    {
      name: "Broadcast Master Limiter",
      type: "DynamicsCompressorNode (Peak Limiting)",
      value: "Ceiling: -0.5 dBFS | Ratio: 20:1 | Lookahead: 1ms",
      descEn: "Guarantees zero digital inter-sample clipping when combined with the instrumental beat.",
      descTh: "ระบบจำกัดระดับเสียงสูงสุด ป้องกันเสียงแตกพร่า (0 dBFS ceiling) เพื่อพร้อมสตรีมมิ่ง",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 space-y-5 text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 pr-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">
              {language === "th" ? "แผนผังสายสัญญาณเสียง (Web Audio FX Chain)" : "Web Audio FX Signal Chain Architecture"}
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            {language === "th"
              ? `พารามิเตอร์ของโหนดในพรีเซ็ตปัจจุบัน: ${preset.badge}`
              : `Real-time DSP node parameters calibrated for: ${preset.badge}`}
          </p>
        </div>

        {/* Chain Flow */}
        <div className="space-y-3 pt-2">
          {nodes.map((node, index) => (
            <div
              key={index}
              className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-1.5 transition-all hover:border-violet-500/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-300 font-mono text-[10px] font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-white tracking-wide">
                    {node.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/90 text-violet-300 border border-violet-500/20">
                  {node.value}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed pl-7">
                {language === "th" ? node.descTh : node.descEn}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
