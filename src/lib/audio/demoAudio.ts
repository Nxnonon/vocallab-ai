/**
 * High-quality synthetic demo stem generator
 * Allows users to immediately hear and test VocalLab AI without needing to upload files.
 */

export async function createDemoStems(audioCtx: AudioContext): Promise<{
  vocalBuffer: AudioBuffer;
  beatBuffer: AudioBuffer;
}> {
  const sampleRate = audioCtx.sampleRate;
  const duration = 16.0; // 8 bars at 120 BPM (2 seconds per bar)
  const totalSamples = Math.floor(sampleRate * duration);

  // 1. Generate BEAT (Instrumental)
  const beatBuffer = audioCtx.createBuffer(2, totalSamples, sampleRate);
  const beatL = beatBuffer.getChannelData(0);
  const beatR = beatBuffer.getChannelData(1);

  const bpm = 120;
  const beatInterval = 60 / bpm; // 0.5s per quarter note
  const barInterval = beatInterval * 4; // 2.0s per bar

  // Synthesize Drums & Chords into Beat Track
  for (let bar = 0; bar < 8; bar++) {
    const barStart = bar * barInterval;

    // Chords (C minor: Cm7 -> Abmaj7 -> Fm7 -> Bb7)
    let chordFreqs = [261.63, 311.13, 392.0, 466.16]; // Cm7
    if (bar % 4 === 1) chordFreqs = [207.65, 261.63, 311.13, 392.0]; // Abmaj7
    if (bar % 4 === 2) chordFreqs = [174.61, 207.65, 261.63, 311.13]; // Fm7
    if (bar % 4 === 3) chordFreqs = [233.08, 293.66, 349.23, 415.3]; // Bb7

    // Soft Rhodes / Pad layer
    const padSamples = Math.floor(barInterval * sampleRate);
    const padStartIdx = Math.floor(barStart * sampleRate);
    for (let i = 0; i < padSamples && padStartIdx + i < totalSamples; i++) {
      const t = i / sampleRate;
      const env = Math.sin((Math.PI * i) / padSamples) * 0.18;
      let pad = 0;
      for (const freq of chordFreqs) {
        pad += Math.sin(2 * Math.PI * freq * t) * 0.25;
        pad += Math.sin(2 * Math.PI * freq * 2 * t) * 0.08;
      }
      beatL[padStartIdx + i] += pad * env;
      beatR[padStartIdx + i] += pad * env * 0.95;
    }

    // 4 beats per bar
    for (let beat = 0; beat < 4; beat++) {
      const beatTime = barStart + beat * beatInterval;
      const beatIdx = Math.floor(beatTime * sampleRate);

      // KICK on beat 0 and 2.5 (syncopated)
      const kickTimes = [0, 2.5];
      for (const kt of kickTimes) {
        const kTime = barStart + kt * beatInterval;
        const kIdx = Math.floor(kTime * sampleRate);
        const kickLen = Math.floor(sampleRate * 0.35);
        for (let i = 0; i < kickLen && kIdx + i < totalSamples; i++) {
          const t = i / sampleRate;
          const pitch = 130 * Math.exp(-t * 22) + 42; // Pitch drop 808
          const env = Math.exp(-t * 9);
          const kickSample = Math.sin(2 * Math.PI * pitch * t) * env * 0.55;
          beatL[kIdx + i] += kickSample;
          beatR[kIdx + i] += kickSample;
        }
      }

      // SNARE / CLAP on beats 1 and 3 (2nd and 4th beat in musical counting)
      if (beat === 1 || beat === 3) {
        const snareLen = Math.floor(sampleRate * 0.25);
        for (let i = 0; i < snareLen && beatIdx + i < totalSamples; i++) {
          const t = i / sampleRate;
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 16) * 0.32;
          const tone = Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 28) * 0.35;
          beatL[beatIdx + i] += (noise + tone) * 0.8;
          beatR[beatIdx + i] += (noise + tone) * 0.85;
        }
      }

      // HI-HATS (8th notes and 16th rolls)
      for (let eighth = 0; eighth < 2; eighth++) {
        const hatTime = beatTime + eighth * (beatInterval / 2);
        const hatIdx = Math.floor(hatTime * sampleRate);
        const hatLen = Math.floor(sampleRate * 0.05);
        for (let i = 0; i < hatLen && hatIdx + i < totalSamples; i++) {
          const t = i / sampleRate;
          const hat = (Math.random() * 2 - 1) * Math.exp(-t * 85) * 0.12;
          // pan hi-hat slightly right
          beatL[hatIdx + i] += hat * 0.7;
          beatR[hatIdx + i] += hat * 1.0;
        }
      }
    }
  }

  // 2. Generate RAW VOCAL STEM (Melodic Lead line, dry, unmixed)
  const vocalBuffer = audioCtx.createBuffer(2, totalSamples, sampleRate);
  const vocalL = vocalBuffer.getChannelData(0);
  const vocalR = vocalBuffer.getChannelData(1);

  // Vocal melody notes in C Minor pentatonic: [frequency, startTime, duration]
  // Lyrics vibe: Catchy melodic phrase repeating across 4-bar blocks
  const melodyNotes: [number, number, number][] = [
    // Bar 1
    [311.13, 0.5, 0.4],  // Eb4 ("I")
    [293.66, 1.0, 0.35], // D4 ("hear")
    [261.63, 1.5, 0.75], // C4 ("you")
    // Bar 2
    [392.00, 2.5, 0.45], // G4 ("call-")
    [349.23, 3.0, 0.35], // F4 ("ing")
    [311.13, 3.5, 0.85], // Eb4 ("out")
    // Bar 3
    [261.63, 4.5, 0.35], // C4 ("in")
    [293.66, 5.0, 0.35], // D4 ("the")
    [311.13, 5.5, 0.7],  // Eb4 ("dark")
    // Bar 4
    [392.00, 6.5, 0.4],  // G4 ("tonight")
    [466.16, 7.0, 0.7],  // Bb4 ("yeah")
    // Bar 5-8 (repeat with expressive variation)
    [311.13, 8.5, 0.4],
    [293.66, 9.0, 0.35],
    [261.63, 9.5, 0.75],
    [392.00, 10.5, 0.45],
    [349.23, 11.0, 0.35],
    [311.13, 11.5, 0.85],
    [349.23, 12.5, 0.4],
    [392.00, 13.0, 0.4],
    [523.25, 13.5, 0.9], // High C5 climax
    [466.16, 14.5, 0.6],
    [392.00, 15.2, 0.5],
  ];

  for (const [freq, startTime, noteDur] of melodyNotes) {
    const startIdx = Math.floor(startTime * sampleRate);
    const noteSamples = Math.floor(noteDur * sampleRate);

    for (let i = 0; i < noteSamples && startIdx + i < totalSamples; i++) {
      const t = i / sampleRate;
      // Vibrato (5.5 Hz depth)
      const vibrato = Math.sin(2 * Math.PI * 5.5 * t) * (t > 0.15 ? 4.5 : 0.8);
      const pitch = freq + vibrato;

      // Vocal formant synthesis: fundamental + harmonic formants (glottal pulse)
      const h1 = Math.sin(2 * Math.PI * pitch * t);
      const h2 = Math.sin(2 * Math.PI * (pitch * 2) * t) * 0.6;
      const h3 = Math.sin(2 * Math.PI * (pitch * 3) * t) * 0.35;
      const h4 = Math.sin(2 * Math.PI * (pitch * 4) * t) * 0.22;
      const h5 = Math.sin(2 * Math.PI * (pitch * 5) * t) * 0.15;
      // Breath / aspiration component
      const breath = (Math.random() * 2 - 1) * 0.04;

      // ADSR envelope
      let env = 1.0;
      const attackSamples = sampleRate * 0.04;
      const releaseSamples = sampleRate * 0.08;
      if (i < attackSamples) {
        env = i / attackSamples;
      } else if (i > noteSamples - releaseSamples) {
        env = (noteSamples - i) / releaseSamples;
      }

      const vocalSample = (h1 + h2 + h3 + h4 + h5 + breath) * env * 0.35;

      vocalL[startIdx + i] += vocalSample;
      vocalR[startIdx + i] += vocalSample;
    }
  }

  return { vocalBuffer, beatBuffer };
}
