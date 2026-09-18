import { PresetConfig, PresetId, PRESETS, MacroSettings, DEFAULT_MACROS } from "./presets";
import { makeDistortionCurve, createImpulseResponse } from "./audioHelpers";

export type PlaybackState = "stopped" | "playing" | "paused";

export interface AudioEngineListener {
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onStateChange?: (state: PlaybackState) => void;
  onTrackLoaded?: (track: "vocal" | "beat", buffer: AudioBuffer) => void;
  onMeterUpdate?: (vocalLevel: number, masterLevel: number) => void;
}

export class AudioMixer {
  private ctx: AudioContext | null = null;

  // Track Buffers
  private vocalBuffer: AudioBuffer | null = null;
  private beatBuffer: AudioBuffer | null = null;

  // Active Sources
  private vocalSource: AudioBufferSourceNode | null = null;
  private beatSource: AudioBufferSourceNode | null = null;

  // Playback Timing
  private state: PlaybackState = "stopped";
  private startTime: number = 0;
  private pauseOffset: number = 0;
  private vocalOffset: number = 0; // seconds (-0.5 to +0.5)
  private isLooping: boolean = true;
  private animFrameId: number | null = null;

  // Track Mix Controls
  private vocalGainVal: number = 1.0;
  private beatGainVal: number = 1.0;
  private vocalMuted: boolean = false;
  private beatMuted: boolean = false;
  private vocalSolo: boolean = false;
  private beatSolo: boolean = false;

  // Vocal FX Chain Nodes
  private highpassNode: BiquadFilterNode | null = null;
  private lowShelfNode: BiquadFilterNode | null = null;
  private midPeakNode: BiquadFilterNode | null = null;
  private highShelfNode: BiquadFilterNode | null = null;
  private compNode: DynamicsCompressorNode | null = null;
  private saturatorNode: WaveShaperNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedbackNode: GainNode | null = null;
  private delayFilterNode: BiquadFilterNode | null = null;
  private delayWetNode: GainNode | null = null;
  private convolverNode: ConvolverNode | null = null;
  private reverbWetNode: GainNode | null = null;
  private wetSumGain: GainNode | null = null;
  private dryVocalGain: GainNode | null = null;
  private vocalFaderNode: GainNode | null = null;
  private vocalAnalyser: AnalyserNode | null = null;

  // Beat Chain Nodes
  private beatFaderNode: GainNode | null = null;

  // Master Nodes
  private preMasterGain: GainNode | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  private masterCeilingGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;

  // Current Parameters
  private currentPreset: PresetConfig = PRESETS["midnight-rb"];
  private currentMacros: MacroSettings = { ...DEFAULT_MACROS };

  // Listeners
  private listeners: Set<AudioEngineListener> = new Set();

  constructor() {
    // Lazy initialized on first user action to comply with browser autoplay policy
  }

  public addListener(listener: AudioEngineListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async initContext(): Promise<AudioContext> {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.setupMasterChain();
      this.setupVocalChain();
      this.setupBeatChain();
      this.applyPresetAndMacros();
    }

    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
    return this.ctx;
  }

  private setupMasterChain() {
    if (!this.ctx) return;

    // 1. Pre-Master Attenuation Node (-3.5 dB = 0.67 linear) for clean summing headroom
    this.preMasterGain = this.ctx.createGain();
    this.preMasterGain.gain.setValueAtTime(0.67, this.ctx.currentTime);

    // 2. Master Peak Limiter (-1.0 dBFS threshold, 6.0 dB soft knee, 20:1 ratio)
    this.masterLimiter = this.ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.setValueAtTime(-1.0, this.ctx.currentTime);
    this.masterLimiter.knee.setValueAtTime(6.0, this.ctx.currentTime);
    this.masterLimiter.ratio.setValueAtTime(20.0, this.ctx.currentTime);
    this.masterLimiter.attack.setValueAtTime(0.001, this.ctx.currentTime);
    this.masterLimiter.release.setValueAtTime(0.05, this.ctx.currentTime);

    // 3. Master Ceiling Gain Node (-0.5 dBFS = 0.944 linear)
    this.masterCeilingGain = this.ctx.createGain();
    this.masterCeilingGain.gain.setValueAtTime(0.944, this.ctx.currentTime);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 256;
    this.masterAnalyser.smoothingTimeConstant = 0.8;

    this.preMasterGain.connect(this.masterLimiter);
    this.masterLimiter.connect(this.masterCeilingGain);
    this.masterCeilingGain.connect(this.masterGain);
    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);
  }

  private setupVocalChain() {
    if (!this.ctx || !this.preMasterGain) return;

    // 1. High-pass filter
    this.highpassNode = this.ctx.createBiquadFilter();
    this.highpassNode.type = "highpass";

    // 2. 3-Band Parametric EQ
    this.lowShelfNode = this.ctx.createBiquadFilter();
    this.lowShelfNode.type = "lowshelf";

    this.midPeakNode = this.ctx.createBiquadFilter();
    this.midPeakNode.type = "peaking";

    this.highShelfNode = this.ctx.createBiquadFilter();
    this.highShelfNode.type = "highshelf";

    // 3. Compressor
    this.compNode = this.ctx.createDynamicsCompressor();

    // 4. Saturation
    this.saturatorNode = this.ctx.createWaveShaper();
    this.saturatorNode.oversample = "4x";

    // 5. Delay with feedback & damping filter
    this.delayNode = this.ctx.createDelay(2.0);
    this.delayFeedbackNode = this.ctx.createGain();
    this.delayFilterNode = this.ctx.createBiquadFilter();
    this.delayFilterNode.type = "lowpass";
    this.delayFilterNode.frequency.setValueAtTime(3500, this.ctx.currentTime);
    this.delayWetNode = this.ctx.createGain();

    // 6. Reverb
    this.convolverNode = this.ctx.createConvolver();
    this.reverbWetNode = this.ctx.createGain();

    // 7. Summing & Bypass crossfader
    this.wetSumGain = this.ctx.createGain();
    this.dryVocalGain = this.ctx.createGain();

    // 8. Track Fader & Analyser
    this.vocalFaderNode = this.ctx.createGain();
    this.vocalAnalyser = this.ctx.createAnalyser();
    this.vocalAnalyser.fftSize = 256;
    this.vocalAnalyser.smoothingTimeConstant = 0.8;

    // Connect Vocal Serial FX
    // highpass -> lowShelf -> midPeak -> highShelf -> comp -> saturator
    this.highpassNode.connect(this.lowShelfNode);
    this.lowShelfNode.connect(this.midPeakNode);
    this.midPeakNode.connect(this.highShelfNode);
    this.highShelfNode.connect(this.compNode);
    this.compNode.connect(this.saturatorNode);

    // Direct Dry out from saturator to wet sum
    this.saturatorNode.connect(this.wetSumGain);

    // Delay branch (parallel from saturator)
    this.saturatorNode.connect(this.delayNode);
    this.delayNode.connect(this.delayFilterNode);
    this.delayFilterNode.connect(this.delayWetNode);
    this.delayWetNode.connect(this.wetSumGain);
    // Delay feedback loop
    this.delayFilterNode.connect(this.delayFeedbackNode);
    this.delayFeedbackNode.connect(this.delayNode);

    // Reverb branch (parallel from saturator)
    this.saturatorNode.connect(this.convolverNode);
    this.convolverNode.connect(this.reverbWetNode);
    this.reverbWetNode.connect(this.wetSumGain);

    // Combine Processed Wet and Raw Dry into vocal fader
    this.wetSumGain.connect(this.vocalFaderNode);
    this.dryVocalGain.connect(this.vocalFaderNode);

    this.vocalFaderNode.connect(this.vocalAnalyser);
    this.vocalAnalyser.connect(this.preMasterGain);
  }

  private setupBeatChain() {
    if (!this.ctx || !this.preMasterGain) return;

    this.beatFaderNode = this.ctx.createGain();
    this.beatFaderNode.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.beatFaderNode.connect(this.preMasterGain);
  }

  // Set & Update Presets and Macros
  public setPreset(presetId: PresetId) {
    const preset = PRESETS[presetId];
    if (preset) {
      this.currentPreset = preset;
      this.applyPresetAndMacros();
    }
  }

  public setMacros(macros: Partial<MacroSettings>) {
    this.currentMacros = { ...this.currentMacros, ...macros };
    this.applyPresetAndMacros();
  }

  public getPreset(): PresetConfig {
    return this.currentPreset;
  }

  public getMacros(): MacroSettings {
    return this.currentMacros;
  }

  private applyPresetAndMacros() {
    if (
      !this.ctx ||
      !this.highpassNode ||
      !this.lowShelfNode ||
      !this.midPeakNode ||
      !this.highShelfNode
    ) {
      return;
    }

    const t = this.ctx.currentTime;
    const ramp = 0.05; // smooth parameter transitions to eliminate clicks
    const p = this.currentPreset.params;
    const m = this.currentMacros;

    // 1. Highpass
    this.highpassNode.frequency.setTargetAtTime(p.highpassFreq, t, ramp);

    // 2. EQ with Tone Macro
    // Tone macro (-50 to +50): shifts low shelf vs high shelf
    const toneBoost = m.tone * 0.1; // -5 dB to +5 dB
    this.lowShelfNode.frequency.setTargetAtTime(p.lowShelfFreq, t, ramp);
    this.lowShelfNode.gain.setTargetAtTime(p.lowShelfGain - toneBoost * 0.6, t, ramp);

    this.midPeakNode.frequency.setTargetAtTime(p.midFreq, t, ramp);
    this.midPeakNode.gain.setTargetAtTime(p.midGain + (toneBoost > 0 ? toneBoost * 0.3 : 0), t, ramp);
    this.midPeakNode.Q.setTargetAtTime(p.midQ, t, ramp);

    this.highShelfNode.frequency.setTargetAtTime(p.highShelfFreq, t, ramp);
    this.highShelfNode.gain.setTargetAtTime(p.highShelfGain + toneBoost, t, ramp);

    // 3. Compressor with Punch Macro
    // Punch macro (0 to 200%): scales ratio and brings threshold down
    const punchMult = m.punch / 100;
    const targetThresh = Math.min(-6, p.compThreshold - (punchMult - 1) * 8);
    const targetRatio = Math.max(1.5, Math.min(16, p.compRatio * punchMult));
    this.compNode?.threshold.setTargetAtTime(targetThresh, t, ramp);
    this.compNode?.ratio.setTargetAtTime(targetRatio, t, ramp);
    this.compNode?.attack.setTargetAtTime(p.compAttack / Math.max(0.5, punchMult), t, ramp);
    this.compNode?.release.setTargetAtTime(p.compRelease, t, ramp);
    this.compNode?.knee.setTargetAtTime(p.compKnee, t, ramp);

    // 4. Saturation (tamed for smooth analog warmth)
    if (this.saturatorNode) {
      const punchDriveAdd = (punchMult - 1) * 0.02;
      const effectiveDrive = Math.max(0, Math.min(0.25, p.saturationDrive + punchDriveAdd));
      this.saturatorNode.curve = makeDistortionCurve(effectiveDrive) as Float32Array<ArrayBuffer>;
    }

    // 5. Space Macro scaling Reverb & Delay Wet Levels
    const spaceMult = m.space / 100;
    const targetDelayWet = Math.max(0, Math.min(0.8, p.delayWet * spaceMult));
    const targetReverbWet = Math.max(0, Math.min(0.8, p.reverbWet * spaceMult));

    this.delayNode?.delayTime.setTargetAtTime(p.delayTime, t, ramp);
    this.delayFeedbackNode?.gain.setTargetAtTime(p.delayFeedback, t, ramp);
    this.delayWetNode?.gain.setTargetAtTime(targetDelayWet, t, ramp);

    this.reverbWetNode?.gain.setTargetAtTime(targetReverbWet, t, ramp);

    // Regenerate impulse response if decay changed significantly
    if (this.convolverNode && Math.abs(this.lastReverbDecay - p.reverbDecay) > 0.1) {
      this.convolverNode.buffer = createImpulseResponse(this.ctx, p.reverbDecay, 1.8);
      this.lastReverbDecay = p.reverbDecay;
    }

    // 6. A/B Bypass & Vocal Balance
    // Vocal Balance macro (-10 dB to +10 dB)
    const balanceGain = Math.pow(10, m.vocalBalance / 20);

    if (m.isBypassed) {
      // Pure Dry vocal
      this.wetSumGain?.gain.setTargetAtTime(0.0001, t, ramp);
      this.dryVocalGain?.gain.setTargetAtTime(1.0, t, ramp);
    } else {
      // Full Processed vocal
      this.wetSumGain?.gain.setTargetAtTime(1.0, t, ramp);
      this.dryVocalGain?.gain.setTargetAtTime(0.0001, t, ramp);
    }

    this.updateTrackGains(balanceGain);
  }

  private lastReverbDecay: number = 0;

  private updateTrackGains(balanceMultiplier: number = 1.0) {
    if (!this.ctx || !this.vocalFaderNode || !this.beatFaderNode) return;
    const t = this.ctx.currentTime;

    let effVocal = this.vocalGainVal * balanceMultiplier;
    let effBeat = this.beatGainVal;

    // Solo & Mute logic
    if (this.vocalSolo) {
      effBeat = 0;
    } else if (this.beatSolo) {
      effVocal = 0;
    }

    if (this.vocalMuted) effVocal = 0;
    if (this.beatMuted) effBeat = 0;

    this.vocalFaderNode.gain.setTargetAtTime(effVocal, t, 0.03);
    this.beatFaderNode.gain.setTargetAtTime(effBeat, t, 0.03);
  }

  // Load Audio Files
  public async loadAudioFile(track: "vocal" | "beat", file: File): Promise<AudioBuffer> {
    const ctx = await this.initContext();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    if (track === "vocal") {
      this.vocalBuffer = audioBuffer;
    } else {
      this.beatBuffer = audioBuffer;
    }

    this.notifyTrackLoaded(track, audioBuffer);
    return audioBuffer;
  }

  public setAudioBuffers(vocal: AudioBuffer | null, beat: AudioBuffer | null) {
    this.vocalBuffer = vocal;
    this.beatBuffer = beat;
    if (vocal) this.notifyTrackLoaded("vocal", vocal);
    if (beat) this.notifyTrackLoaded("beat", beat);
  }

  public getVocalBuffer(): AudioBuffer | null {
    return this.vocalBuffer;
  }

  public getBeatBuffer(): AudioBuffer | null {
    return this.beatBuffer;
  }

  public getTotalDuration(): number {
    const vocalLen = (this.vocalBuffer?.duration || 0) + Math.max(0, this.vocalOffset);
    const beatLen = this.beatBuffer?.duration || 0;
    return Math.max(vocalLen, beatLen, 1);
  }

  public setVocalOffset(offsetSeconds: number) {
    this.vocalOffset = offsetSeconds;
    if (this.state === "playing") {
      // Re-trigger sync playback at current position
      this.seek(this.getCurrentTime());
    }
  }

  public getVocalOffset(): number {
    return this.vocalOffset;
  }

  public setVocalVolume(vol: number) {
    this.vocalGainVal = vol;
    this.updateTrackGains();
  }

  public setBeatVolume(vol: number) {
    this.beatGainVal = vol;
    this.updateTrackGains();
  }

  public toggleVocalMute() {
    this.vocalMuted = !this.vocalMuted;
    this.updateTrackGains();
    return this.vocalMuted;
  }

  public toggleBeatMute() {
    this.beatMuted = !this.beatMuted;
    this.updateTrackGains();
    return this.beatMuted;
  }

  public toggleVocalSolo() {
    this.vocalSolo = !this.vocalSolo;
    if (this.vocalSolo) this.beatSolo = false;
    this.updateTrackGains();
    return this.vocalSolo;
  }

  public toggleBeatSolo() {
    this.beatSolo = !this.beatSolo;
    if (this.beatSolo) this.vocalSolo = false;
    this.updateTrackGains();
    return this.beatSolo;
  }

  public setLooping(loop: boolean) {
    this.isLooping = loop;
  }

  public getIsLooping(): boolean {
    return this.isLooping;
  }

  // Playback Control
  public async play() {
    const ctx = await this.initContext();
    if (this.state === "playing") return;

    this.stopSources();

    const startPos = this.pauseOffset;
    const now = ctx.currentTime;
    this.startTime = now - startPos;

    // 1. Play Beat
    if (this.beatBuffer && this.beatFaderNode) {
      this.beatSource = ctx.createBufferSource();
      this.beatSource.buffer = this.beatBuffer;
      this.beatSource.connect(this.beatFaderNode);

      if (startPos < this.beatBuffer.duration) {
        this.beatSource.start(0, startPos);
      }
    }

    // 2. Play Vocal with timing offset
    if (this.vocalBuffer && this.highpassNode && this.dryVocalGain) {
      this.vocalSource = ctx.createBufferSource();
      this.vocalSource.buffer = this.vocalBuffer;

      // Connect to both serial FX chain (highpass) and dry fader (for A/B comparison)
      this.vocalSource.connect(this.highpassNode);
      this.vocalSource.connect(this.dryVocalGain);

      // Calculate vocal start time relative to offset
      const vocalEffectivePos = startPos - this.vocalOffset;
      if (vocalEffectivePos >= 0) {
        if (vocalEffectivePos < this.vocalBuffer.duration) {
          this.vocalSource.start(0, vocalEffectivePos);
        }
      } else {
        // Delayed start (vocal offset is positive)
        const delayUntilStart = -vocalEffectivePos;
        this.vocalSource.start(now + delayUntilStart, 0);
      }
    }

    this.state = "playing";
    this.notifyStateChange("playing");
    this.startAnimationLoop();
  }

  public pause() {
    if (this.state !== "playing") return;
    this.pauseOffset = this.getCurrentTime();
    this.stopSources();
    this.state = "paused";
    this.notifyStateChange("paused");
  }

  public stop() {
    this.stopSources();
    this.pauseOffset = 0;
    this.state = "stopped";
    this.notifyStateChange("stopped");
    this.notifyTimeUpdate(0, this.getTotalDuration());
  }

  public seek(positionSeconds: number) {
    const duration = this.getTotalDuration();
    const clamped = Math.max(0, Math.min(duration, positionSeconds));
    this.pauseOffset = clamped;

    if (this.state === "playing") {
      this.play();
    } else {
      this.notifyTimeUpdate(clamped, duration);
    }
  }

  public getCurrentTime(): number {
    if (this.state !== "playing" || !this.ctx) {
      return this.pauseOffset;
    }
    const elapsed = this.ctx.currentTime - this.startTime;
    const duration = this.getTotalDuration();

    if (elapsed >= duration) {
      if (this.isLooping) {
        this.pauseOffset = 0;
        this.play();
        return 0;
      } else {
        this.stop();
        return 0;
      }
    }
    return elapsed;
  }

  public getState(): PlaybackState {
    return this.state;
  }

  private stopSources() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    try {
      if (this.vocalSource) {
        this.vocalSource.stop();
        this.vocalSource.disconnect();
        this.vocalSource = null;
      }
    } catch {}

    try {
      if (this.beatSource) {
        this.beatSource.stop();
        this.beatSource.disconnect();
        this.beatSource = null;
      }
    } catch {}
  }

  private startAnimationLoop() {
    const loop = () => {
      if (this.state !== "playing") return;

      const curTime = this.getCurrentTime();
      const dur = this.getTotalDuration();
      this.notifyTimeUpdate(curTime, dur);

      // Meter levels
      if (this.vocalAnalyser && this.masterAnalyser) {
        const vocalData = new Uint8Array(this.vocalAnalyser.frequencyBinCount);
        this.vocalAnalyser.getByteFrequencyData(vocalData);
        let vocalSum = 0;
        for (let i = 0; i < vocalData.length; i++) vocalSum += vocalData[i];
        const vocalLevel = vocalSum / (vocalData.length * 255);

        const masterData = new Uint8Array(this.masterAnalyser.frequencyBinCount);
        this.masterAnalyser.getByteFrequencyData(masterData);
        let masterSum = 0;
        for (let i = 0; i < masterData.length; i++) masterSum += masterData[i];
        const masterLevel = masterSum / (masterData.length * 255);

        this.notifyMeterUpdate(vocalLevel, masterLevel);
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  private notifyTimeUpdate(curTime: number, duration: number) {
    for (const l of this.listeners) {
      l.onTimeUpdate?.(curTime, duration);
    }
  }

  private notifyStateChange(state: PlaybackState) {
    for (const l of this.listeners) {
      l.onStateChange?.(state);
    }
  }

  private notifyTrackLoaded(track: "vocal" | "beat", buffer: AudioBuffer) {
    for (const l of this.listeners) {
      l.onTrackLoaded?.(track, buffer);
    }
  }

  private notifyMeterUpdate(vocal: number, master: number) {
    for (const l of this.listeners) {
      l.onMeterUpdate?.(vocal, master);
    }
  }
}

// Global Singleton for easy app-wide access
let globalMixer: AudioMixer | null = null;
export function getAudioMixer(): AudioMixer {
  if (!globalMixer) {
    globalMixer = new AudioMixer();
  }
  return globalMixer;
}
