# VocalLab AI - Auto-Vocal Mixing & Preset Platform

> Professional studio-grade vocal mixing and mastering web application running entirely client-side via the Web Audio API, Next.js, and TypeScript.

---

## 🌟 Key Features

### 1. Dual-Track Audio Architecture & Synchronization
- **Lead Vocal Stem**: Drag-and-drop or browse unmixed raw vocals (`.wav` or `.mp3`).
- **Beat / Backing Track**: Master instrumental backing track (`.wav` or `.mp3`).
- **One-Click Demo Generator**: Instant procedural synthesis of a punchy 120 BPM trap/R&B beat and melodic vocal phrase in C minor for immediate testing.
- **Dual-Track Waveform Timeline**: High-DPI HTML5 canvas rendering with synchronized playhead, seeking, and looping.
- **Vocal Timing Offset / Nudge**: Real-time alignment slider (`-500ms` to `+500ms`) with `±25ms` nudge buttons and sync reset.

### 2. Studio Web Audio DSP Signal Chain
```
Input Source
   │
   ▼
High-Pass Filter (80–115 Hz, 12 dB/oct)
   │
   ▼
3-Band Parametric EQ (Low-Shelf, Mid-Peaking with Q, High-Shelf Air)
   │
   ▼
Dynamics Compressor (Threshold, Ratio, Attack, Release, Knee)
   │
   ▼
Harmonic Saturation & Drive (WaveShaper with 4x Oversampling)
   │
   ├─── Parallel Reverb (ConvolverNode with Algorithmic Stereo Impulse Responses)
   ├─── Parallel Delay (DelayNode with 3.5kHz Lowpass Tape Damping & Feedback Loop)
   │
   ▼
Wet / Dry Crossfader (A/B Bypass comparison)
   │
   ▼
Vocal Track Fader (Solo / Mute / Level)
   │
   ▼
Master Peak Limiter (0 dBFS Ceiling Protection)
   │
   ▼
Stereo Output / Destination
```

### 3. 5 Signature Artist Presets (Bilingual EN / TH)
1. **"Midnight R&B" (The Weeknd style)**
   - *EN*: Smooth high-end EQ, warm low-mid, lush Plate Reverb (decay ~2.8s, wet 35%), subtle ping-pong delay.
   - *TH*: เสียงร้องนุ่มลึก มีมิติ Reverb หางยาวและกว้างสไตล์ R&B ยามค่ำคืน เติม Delay ปลายคำบางเบา
2. **"Rodeo Trap" (Travis Scott style)**
   - *EN*: Fast attack/release heavy compression, subtle drive/saturation, aggressive 3kHz presence boost, slapback delay.
   - *TH*: เสียงร้องพุ่งแน่น คมชัด บีบอัดเสียงหนักแน่น เติมความดิบ (Saturation) และ Slapback Delay แบบชาวแทร็ป
3. **"Whisper Pop" (Billie Eilish style)**
   - *EN*: Dry, upfront, intimate close-mic feel. High-air boost (12kHz+), tight dynamics control, near-zero reverb.
   - *TH*: เสียงกระซิบคมชัดแนบหู เน้นเสียงลมหายใจและความเป็นธรรมชาติ ไม่ใส่เสียงสะท้อน (Dry & Intimate)
4. **"Melodic Arena" (Post Malone style)**
   - *EN*: Wide spatial stereo effect/doubler feel, Arena Hall Reverb (decay ~3.2s), synced 1/4 note delay.
   - *TH*: มิติเสียงกว้างขวางเหมือนร้องในสเตเดียม เสียงสะท้อนแบบ Arena Hall พร้อมเสียงเอคโค่ตามจังหวะ
5. **"Polished Pop" (Taylor Swift style)**
   - *EN*: Ultra-clean and bright EQ, balanced compression to sit vocals right on top of the mix, silky plate reverb.
   - *TH*: เสียงร้องใส สว่าง ลอยเด่นเหนือเสียงดนตรีอย่างลงตัว มิกซ์เคลียร์สะอาดสไตล์เพลงป็อปกระแสหลัก

### 4. Macro Knobs & A/B Bypass
- **Vocal Balance**: -10 dB to +10 dB ratio balance.
- **Tone (Air / Warmth)**: -50 to +50 EQ balance.
- **Space (Reverb & Echo)**: 0% to 200% wetness scale.
- **Punch (Dynamics & Comp)**: 0% to 200% compression intensity.
- **A/B Bypass**: Instant dry vs. wet comparison.

### 5. High-Fidelity WAV Export Engine
- Powered by `OfflineAudioContext` for fast rendering.
- 0 dBFS Master Peak Limiter preventing digital clipping.
- Download combined Master WAV or isolated Processed Vocal Stem.
- Confetti celebration upon export completion.

### 6. Internationalization (i18n)
- Seamless bilingual switching between **English (🇺🇸 EN)** and **Thai (🇹🇭 TH)** across all buttons, descriptions, modals, tooltips, and signal chain diagrams.

### 7. Monetization Hooks
- Free Tier vs. PRO Tier badges.
- 30s preview export on Free tier; full-duration studio export on PRO.
- Integrated payment mockup supporting **PromptPay QR**, **Credit Card (Stripe)**, and **Omise**.

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Or build and run production server
npm run build
npm run start
```

Access the app at `http://localhost:3000`.
