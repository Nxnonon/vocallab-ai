export type PresetId =
  | "midnight-rb"
  | "rodeo-trap"
  | "whisper-pop"
  | "melodic-arena"
  | "polished-pop";

export interface PresetConfig {
  id: PresetId;
  nameKey: "theWeeknd" | "travisScott" | "billieEilish" | "postMalone" | "taylorSwift";
  color: string;
  badge: string;
  iconName: string;
  bpmHint: number;
  params: {
    // High-pass filter
    highpassFreq: number; // 80 - 120 Hz
    // 3-Band Parametric EQ
    lowShelfFreq: number; // 200 - 350 Hz
    lowShelfGain: number; // dB (-6 to +6)
    midFreq: number; // 2000 - 4000 Hz
    midGain: number; // dB (-6 to +8)
    midQ: number; // 0.7 - 2.5
    highShelfFreq: number; // 8000 - 13000 Hz
    highShelfGain: number; // dB (-3 to +8)
    // Compressor
    compThreshold: number; // dB (-36 to -10)
    compRatio: number; // 2 to 8
    compAttack: number; // seconds (0.002 to 0.05)
    compRelease: number; // seconds (0.05 to 0.3)
    compKnee: number; // dB (0 to 12)
    // Saturation / Drive
    saturationDrive: number; // 0.0 to 1.0
    // Delay
    delayTime: number; // seconds (0.05 to 0.6)
    delayFeedback: number; // 0.0 to 0.6
    delayWet: number; // 0.0 to 0.5
    // Reverb
    reverbDecay: number; // seconds (0.5 to 4.0)
    reverbWet: number; // 0.0 to 0.6
  };
}

export interface MacroSettings {
  vocalBalance: number; // -10 to +10 dB (0 is neutral)
  tone: number; // -50 to +50 (negative = warmer, positive = brighter)
  space: number; // 0 to 200% (100 is preset default)
  punch: number; // 0 to 200% (100 is preset default)
  isBypassed: boolean; // A/B comparison
}

export const DEFAULT_MACROS: MacroSettings = {
  vocalBalance: 0,
  tone: 0,
  space: 100,
  punch: 100,
  isBypassed: false,
};

export const PRESETS: Record<PresetId, PresetConfig> = {
  "midnight-rb": {
    id: "midnight-rb",
    nameKey: "theWeeknd",
    color: "from-purple-600 via-indigo-600 to-blue-500",
    badge: "The Weeknd Style",
    iconName: "Moon",
    bpmHint: 118,
    params: {
      highpassFreq: 90,
      lowShelfFreq: 240,
      lowShelfGain: 2.5,
      midFreq: 3000,
      midGain: 1.2,
      midQ: 1.2,
      highShelfFreq: 11000,
      highShelfGain: 3.2,
      compThreshold: -20,
      compRatio: 3.5,
      compAttack: 0.02,
      compRelease: 0.16,
      compKnee: 8,
      saturationDrive: 0.04,
      delayTime: 0.32,
      delayFeedback: 0.28,
      delayWet: 0.22,
      reverbDecay: 2.8,
      reverbWet: 0.35,
    },
  },
  "rodeo-trap": {
    id: "rodeo-trap",
    nameKey: "travisScott",
    color: "from-amber-600 via-orange-600 to-red-600",
    badge: "Travis Scott Style",
    iconName: "Flame",
    bpmHint: 140,
    params: {
      highpassFreq: 115,
      lowShelfFreq: 300,
      lowShelfGain: -1.8,
      midFreq: 3300,
      midGain: 4.5,
      midQ: 1.8,
      highShelfFreq: 9500,
      highShelfGain: 4.2,
      compThreshold: -26,
      compRatio: 6.0,
      compAttack: 0.005,
      compRelease: 0.06,
      compKnee: 4,
      saturationDrive: 0.08,
      delayTime: 0.09, // slapback
      delayFeedback: 0.2,
      delayWet: 0.25,
      reverbDecay: 1.3,
      reverbWet: 0.16,
    },
  },
  "whisper-pop": {
    id: "whisper-pop",
    nameKey: "billieEilish",
    color: "from-emerald-500 via-teal-600 to-cyan-700",
    badge: "Billie Eilish Style",
    iconName: "Wind",
    bpmHint: 105,
    params: {
      highpassFreq: 85,
      lowShelfFreq: 220,
      lowShelfGain: 1.2,
      midFreq: 3800,
      midGain: 1.5,
      midQ: 1.0,
      highShelfFreq: 12500,
      highShelfGain: 6.5, // ultra air boost
      compThreshold: -24,
      compRatio: 4.2,
      compAttack: 0.008,
      compRelease: 0.09,
      compKnee: 6,
      saturationDrive: 0.01, // super clean
      delayTime: 0.08,
      delayFeedback: 0.05,
      delayWet: 0.03, // almost zero delay
      reverbDecay: 0.6,
      reverbWet: 0.05, // very dry & intimate
    },
  },
  "melodic-arena": {
    id: "melodic-arena",
    nameKey: "postMalone",
    color: "from-cyan-500 via-blue-600 to-indigo-700",
    badge: "Post Malone Style",
    iconName: "Sparkles",
    bpmHint: 128,
    params: {
      highpassFreq: 95,
      lowShelfFreq: 250,
      lowShelfGain: 0.5,
      midFreq: 2800,
      midGain: 2.8,
      midQ: 1.4,
      highShelfFreq: 10500,
      highShelfGain: 3.8,
      compThreshold: -22,
      compRatio: 3.8,
      compAttack: 0.015,
      compRelease: 0.13,
      compKnee: 7,
      saturationDrive: 0.05,
      delayTime: 0.38, // 1/4 note delay
      delayFeedback: 0.36,
      delayWet: 0.3,
      reverbDecay: 3.2, // arena hall
      reverbWet: 0.42,
    },
  },
  "polished-pop": {
    id: "polished-pop",
    nameKey: "taylorSwift",
    color: "from-pink-500 via-rose-500 to-amber-400",
    badge: "Taylor Swift Style",
    iconName: "Disc3",
    bpmHint: 122,
    params: {
      highpassFreq: 100,
      lowShelfFreq: 260,
      lowShelfGain: -0.5,
      midFreq: 3500,
      midGain: 2.2,
      midQ: 1.3,
      highShelfFreq: 11500,
      highShelfGain: 4.8,
      compThreshold: -18,
      compRatio: 3.0,
      compAttack: 0.012,
      compRelease: 0.15,
      compKnee: 9,
      saturationDrive: 0.02,
      delayTime: 0.22,
      delayFeedback: 0.16,
      delayWet: 0.14,
      reverbDecay: 2.2,
      reverbWet: 0.26,
    },
  },
};
