/**
 * Audio DSP Helper functions
 */

// Generate a smooth musical saturation curve for WaveShaperNode
// Uses softened non-linear transfer function with unity small-signal gain to prevent harsh harmonic clipping
export function makeDistortionCurve(amount: number = 0.03, samples: number = 44100): Float32Array {
  const curve = new Float32Array(samples);
  const drive = Math.max(0, Math.min(1.0, amount));

  // Clean linear pass-through for near-zero drive
  if (drive <= 0.001) {
    for (let i = 0; i < samples; i++) {
      curve[i] = (i * 2) / samples - 1;
    }
    return curve;
  }

  // Soft musical saturation transfer function using hyperbolic tangent (tanh)
  // Gentle slope prevents harsh odd harmonics, intermodulation distortion, and digital clipping
  const k = 1.0 + drive * 1.5;
  const norm = Math.tanh(k);

  for (let i = 0; i < samples; ++i) {
    const x = (i * 2) / samples - 1;
    const saturated = Math.tanh(k * x) / norm;
    // Blend saturated signal with linear x to preserve headroom and transparency
    curve[i] = (1 - drive * 0.4) * x + (drive * 0.4) * saturated;
  }
  return curve;
}

// Generate algorithmic stereo impulse response for ConvolverNode
export function createImpulseResponse(
  ctx: BaseAudioContext,
  duration: number = 2.5,
  decay: number = 2.0
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * duration));
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    // Exponential decay envelope
    const envelope = Math.exp(-t * (decay * 1.5));
    // Stereo decorrelation noise with slight lowpass smoothing
    const noiseL = (Math.random() * 2 - 1) * envelope;
    const noiseR = (Math.random() * 2 - 1) * envelope;

    // Add subtle pseudo early reflection spikes
    let earlyL = 0;
    let earlyR = 0;
    if (i < sampleRate * 0.08) {
      if (i % Math.floor(sampleRate * 0.012) === 0) earlyL += 0.25 * envelope;
      if (i % Math.floor(sampleRate * 0.019) === 0) earlyR += 0.25 * envelope;
    }

    left[i] = noiseL * 0.65 + earlyL;
    right[i] = noiseR * 0.65 + earlyR;
  }

  return impulse;
}

// High Quality WAV Encoder for AudioBuffer with strict sample clamping
export function encodeWAV(buffer: AudioBuffer, bitDepth: 16 | 24 = 16): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const numFrames = buffer.length;
  const dataSize = numFrames * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  /* RIFF chunk descriptor */
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");

  /* FMT sub-chunk */
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  /* DATA sub-chunk */
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Interleave channels & write PCM samples
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  if (bitDepth === 16) {
    for (let i = 0; i < numFrames; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        let sample = channels[ch][i];
        if (isNaN(sample)) sample = 0;
        // Hard clamp sample strictly between -1.0 and 1.0 to eliminate wrap-around distortion
        sample = Math.max(-1.0, Math.min(1.0, sample));
        // Convert to 16-bit signed integer with explicit integer boundary clamping
        const rawInt = sample < 0 ? sample * 32768 : sample * 32767;
        const intSample = Math.max(-32768, Math.min(32767, Math.round(rawInt)));
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }
  } else {
    // 24-bit PCM
    for (let i = 0; i < numFrames; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        let sample = channels[ch][i];
        if (isNaN(sample)) sample = 0;
        // Hard clamp sample strictly between -1.0 and 1.0 to eliminate wrap-around distortion
        sample = Math.max(-1.0, Math.min(1.0, sample));
        const rawInt = sample < 0 ? sample * 8388608 : sample * 8388607;
        const intSample = Math.max(-8388608, Math.min(8388607, Math.round(rawInt)));
        view.setUint8(offset, intSample & 0xff);
        view.setUint8(offset + 1, (intSample >> 8) & 0xff);
        view.setUint8(offset + 2, (intSample >> 16) & 0xff);
        offset += 3;
      }
    }
  }

  return new Blob([view], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
