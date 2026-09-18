import { PresetConfig, MacroSettings } from "./presets";
import { makeDistortionCurve, createImpulseResponse, encodeWAV } from "./audioHelpers";
import { createDemoStems } from "./demoAudio";

export interface RenderOptions {
  vocalBuffer: AudioBuffer | null;
  beatBuffer: AudioBuffer | null;
  vocalOffset: number;
  preset: PresetConfig;
  macros: MacroSettings;
  isPro: boolean;
  vocalGain?: number;
  beatGain?: number;
  exportStemOnly?: boolean; // export only the processed vocal stem
  bitDepth?: 16 | 24;
  onProgress?: (progress: number) => void;
}

export async function renderAudio(options: RenderOptions): Promise<{
  blob: Blob;
  duration: number;
  renderedLength: number;
}> {
  const {
    vocalBuffer,
    beatBuffer,
    vocalOffset,
    preset,
    macros,
    isPro,
    vocalGain = 1.0,
    beatGain = 1.0,
    exportStemOnly = false,
    bitDepth = 16,
    onProgress,
  } = options;

  let effVocal = vocalBuffer;
  let effBeat = beatBuffer;

  // If buffers were not directly provided, check active mixer singleton
  if (!effVocal && !effBeat && typeof window !== "undefined") {
    try {
      const { getAudioMixer } = await import("./mixer");
      const mixer = getAudioMixer();
      if (mixer) {
        effVocal = mixer.getVocalBuffer();
        effBeat = mixer.getBeatBuffer();
      }
    } catch {}
  }

  // Only fall back to procedural demoAudio if NO user files have been uploaded
  const hasUserAudio = !!effVocal || !!effBeat;
  if (!hasUserAudio) {
    const AudioCtxClass =
      (typeof window !== "undefined"
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        : null) ||
      (typeof globalThis !== "undefined"
        ? (globalThis as unknown as { AudioContext: typeof AudioContext }).AudioContext
        : null);

    if (AudioCtxClass) {
      const tempCtx = new AudioCtxClass();
      const demo = await createDemoStems(tempCtx);
      effVocal = demo.vocalBuffer;
      effBeat = demo.beatBuffer;
      tempCtx.close().catch(() => {});
    }
  }

  if (!effVocal && !effBeat) {
    throw new Error("No audio loaded to export");
  }

  const sampleRate = 44100;

  // Track durations
  const vDur = effVocal ? effVocal.duration : 0;
  const bDur = effBeat && !exportStemOnly ? effBeat.duration : 0;

  // If the track lengths are different, set the rendered total duration to Math.max(vocalDuration, beatDuration)
  // Also account for user's positive vocalOffset so the vocal tail isn't cut off
  const offsetVocalTail = effVocal ? vDur + Math.max(0, vocalOffset) : 0;
  const rawTotalDuration = Math.max(vDur, bDur, offsetVocalTail, 1.0);

  // Free tier limit: first 30 seconds
  const renderDuration = isPro ? rawTotalDuration : Math.min(rawTotalDuration, 30.0);
  const totalFrames = Math.max(1, Math.floor(renderDuration * sampleRate));

  // Create Offline Audio Context
  const offlineCtx = new OfflineAudioContext(2, totalFrames, sampleRate);

  // 1. Pre-Master Attenuation Node (-3.5 dB = 0.67 linear) to prevent summing clipping
  const preMasterGain = offlineCtx.createGain();
  preMasterGain.gain.setValueAtTime(0.67, 0);

  // 2. Master Limiter Node (-1.0 dBFS threshold, 6.0 dB soft knee, 20:1 ratio)
  const masterLimiter = offlineCtx.createDynamicsCompressor();
  masterLimiter.threshold.setValueAtTime(-1.0, 0);
  masterLimiter.knee.setValueAtTime(6.0, 0);
  masterLimiter.ratio.setValueAtTime(20.0, 0);
  masterLimiter.attack.setValueAtTime(0.001, 0);
  masterLimiter.release.setValueAtTime(0.05, 0);

  // 3. Master Ceiling Node (-0.5 dBFS = 0.944 linear)
  const masterCeiling = offlineCtx.createGain();
  masterCeiling.gain.setValueAtTime(0.944, 0);

  // Connect Master chain
  preMasterGain.connect(masterLimiter);
  masterLimiter.connect(masterCeiling);
  masterCeiling.connect(offlineCtx.destination);

  // 4. Setup Vocal FX Chain in Offline Context
  if (effVocal) {
    const vocalSource = offlineCtx.createBufferSource();
    vocalSource.buffer = effVocal;

    const p = preset.params;
    const m = macros;

    // Filter nodes
    const highpass = offlineCtx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(p.highpassFreq, 0);

    const toneBoost = m.tone * 0.1;
    const lowShelf = offlineCtx.createBiquadFilter();
    lowShelf.type = "lowshelf";
    lowShelf.frequency.setValueAtTime(p.lowShelfFreq, 0);
    lowShelf.gain.setValueAtTime(p.lowShelfGain - toneBoost * 0.6, 0);

    const midPeak = offlineCtx.createBiquadFilter();
    midPeak.type = "peaking";
    midPeak.frequency.setValueAtTime(p.midFreq, 0);
    midPeak.gain.setValueAtTime(p.midGain + (toneBoost > 0 ? toneBoost * 0.3 : 0), 0);
    midPeak.Q.setValueAtTime(p.midQ, 0);

    const highShelf = offlineCtx.createBiquadFilter();
    highShelf.type = "highshelf";
    highShelf.frequency.setValueAtTime(p.highShelfFreq, 0);
    highShelf.gain.setValueAtTime(p.highShelfGain + toneBoost, 0);

    // Comp
    const comp = offlineCtx.createDynamicsCompressor();
    const punchMult = m.punch / 100;
    const targetThresh = Math.min(-6, p.compThreshold - (punchMult - 1) * 8);
    const targetRatio = Math.max(1.5, Math.min(16, p.compRatio * punchMult));
    comp.threshold.setValueAtTime(targetThresh, 0);
    comp.ratio.setValueAtTime(targetRatio, 0);
    comp.attack.setValueAtTime(p.compAttack / Math.max(0.5, punchMult), 0);
    comp.release.setValueAtTime(p.compRelease, 0);
    comp.knee.setValueAtTime(p.compKnee, 0);

    // Saturation (tamed for smooth analog warmth)
    const saturator = offlineCtx.createWaveShaper();
    saturator.oversample = "4x";
    const punchDriveAdd = (punchMult - 1) * 0.02;
    const effectiveDrive = Math.max(0, Math.min(0.25, p.saturationDrive + punchDriveAdd));
    saturator.curve = makeDistortionCurve(effectiveDrive) as Float32Array<ArrayBuffer>;

    // Delay
    const delay = offlineCtx.createDelay(2.0);
    delay.delayTime.setValueAtTime(p.delayTime, 0);
    const delayFeedback = offlineCtx.createGain();
    delayFeedback.gain.setValueAtTime(p.delayFeedback, 0);
    const delayFilter = offlineCtx.createBiquadFilter();
    delayFilter.type = "lowpass";
    delayFilter.frequency.setValueAtTime(3500, 0);
    const spaceMult = m.space / 100;
    const delayWet = offlineCtx.createGain();
    delayWet.gain.setValueAtTime(Math.max(0, Math.min(0.8, p.delayWet * spaceMult)), 0);

    // Reverb Convolver
    const convolver = offlineCtx.createConvolver();
    convolver.buffer = createImpulseResponse(offlineCtx, p.reverbDecay, 1.8);
    const reverbWet = offlineCtx.createGain();
    reverbWet.gain.setValueAtTime(Math.max(0, Math.min(0.8, p.reverbWet * spaceMult)), 0);

    // Vocal Output & Fader
    const wetSum = offlineCtx.createGain();
    const drySum = offlineCtx.createGain();

    if (m.isBypassed) {
      wetSum.gain.setValueAtTime(0, 0);
      drySum.gain.setValueAtTime(1, 0);
    } else {
      wetSum.gain.setValueAtTime(1, 0);
      drySum.gain.setValueAtTime(0, 0);
    }

    const vocalBalanceMult = Math.pow(10, m.vocalBalance / 20);
    const vocalFader = offlineCtx.createGain();
    vocalFader.gain.setValueAtTime(vocalGain * vocalBalanceMult, 0);

    // Connect Serial Chain
    highpass.connect(lowShelf);
    lowShelf.connect(midPeak);
    midPeak.connect(highShelf);
    highShelf.connect(comp);
    comp.connect(saturator);

    // Direct out
    saturator.connect(wetSum);

    // Delay parallel branch
    saturator.connect(delay);
    delay.connect(delayFilter);
    delayFilter.connect(delayWet);
    delayWet.connect(wetSum);
    delayFilter.connect(delayFeedback);
    delayFeedback.connect(delay);

    // Reverb parallel branch
    saturator.connect(convolver);
    convolver.connect(reverbWet);
    reverbWet.connect(wetSum);

    // Combine
    wetSum.connect(vocalFader);
    drySum.connect(vocalFader);
    vocalFader.connect(preMasterGain);

    // Connect raw source
    vocalSource.connect(highpass);
    vocalSource.connect(drySum);

    // Schedule source start with vocal offset
    if (vocalOffset >= 0) {
      // Shift vocal later by vocalOffset seconds
      vocalSource.start(vocalOffset, 0);
    } else {
      // Shift vocal earlier by starting at t=0 and seeking into the buffer
      const offsetIntoBuffer = -vocalOffset;
      if (offsetIntoBuffer < vDur) {
        vocalSource.start(0, offsetIntoBuffer);
      }
    }
  }

  // 5. Beat Track (if not stem only)
  if (effBeat && !exportStemOnly) {
    const beatSource = offlineCtx.createBufferSource();
    beatSource.buffer = effBeat;
    const beatFader = offlineCtx.createGain();
    beatFader.gain.setValueAtTime(beatGain, 0);
    beatSource.connect(beatFader);
    beatFader.connect(preMasterGain);
    beatSource.start(0, 0);
  }

  // Monitor progress simulation
  let progressInterval: ReturnType<typeof setInterval> | null = null;
  let simulatedProgress = 10;
  if (onProgress) {
    onProgress(simulatedProgress);
    progressInterval = setInterval(() => {
      simulatedProgress = Math.min(95, simulatedProgress + 15);
      onProgress(simulatedProgress);
    }, 120);
  }

  // Render
  const renderedBuffer = await offlineCtx.startRendering();

  if (progressInterval) clearInterval(progressInterval);
  if (onProgress) onProgress(100);

  // Encode to WAV with sample clamping
  const blob = encodeWAV(renderedBuffer, bitDepth);

  return {
    blob,
    duration: renderDuration,
    renderedLength: renderedBuffer.length,
  };
}

// Export both renderAudio and renderMasterTrack for seamless compatibility
export const renderMasterTrack = renderAudio;

export function downloadAudioBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 2000);
}
