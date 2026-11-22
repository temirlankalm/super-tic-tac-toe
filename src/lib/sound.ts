/**
 * Paper ASMR Sound Effects & Haptics Engine for Super Tic-Tac-Toe
 * Pure Web Audio API synthesis - zero external audio assets or npm dependencies.
 */

// Global audio context and shared noise buffer
let audioCtx: AudioContext | null = null;
let sharedNoiseBuffer: AudioBuffer | null = null;

// Master volume multiplier (30% volume - subtle and non-fatiguing ASMR)
const MASTER_VOLUME = 0.3;

/**
 * Lazy AudioContext initialization on first user gesture
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

/**
 * Generate 2 seconds of pink/textured noise for paper friction synthesis
 */
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (sharedNoiseBuffer && sharedNoiseBuffer.sampleRate === ctx.sampleRate) {
    return sharedNoiseBuffer;
  }

  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Pink noise generator (Paul Kellet's filtered white noise method)
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.153852;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }

  sharedNoiseBuffer = buffer;
  return buffer;
}

/**
 * 1. Pencil Scratch (Шорох карандаша по бумаге)
 * 4 organic variations with randomized pitch, stroke count and texture.
 */
export function playPencilScratch(variant?: number) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const v = variant !== undefined ? variant % 4 : Math.floor(Math.random() * 4);
  const now = ctx.currentTime;
  const noise = getNoiseBuffer(ctx);

  // Master gain for this sound
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(MASTER_VOLUME, now);
  masterGain.connect(ctx.destination);

  // Highpass to eliminate low-end rumble
  const hpFilter = ctx.createBiquadFilter();
  hpFilter.type = 'highpass';
  hpFilter.frequency.setValueAtTime(800, now);

  if (v === 1) {
    // Variation 1: Double stroke (like drawing two strokes of 'X')
    const strokeTimes = [0, 0.045];
    const strokeDurations = [0.038, 0.045];
    const frequencies = [2700, 3100];

    strokeTimes.forEach((delay, idx) => {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      const offset = Math.random() * 1.5;

      const bpFilter = ctx.createBiquadFilter();
      bpFilter.type = 'bandpass';
      bpFilter.frequency.setValueAtTime(frequencies[idx] + (Math.random() * 200 - 100), now + delay);
      bpFilter.Q.setValueAtTime(2.0, now + delay);

      const gain = ctx.createGain();
      const sStart = now + delay;
      const sDur = strokeDurations[idx];

      gain.gain.setValueAtTime(0.0001, sStart);
      gain.gain.linearRampToValueAtTime(0.32, sStart + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, sStart + sDur);

      src.connect(bpFilter);
      bpFilter.connect(hpFilter);
      hpFilter.connect(gain);
      gain.connect(masterGain);

      src.start(sStart, offset);
      src.stop(sStart + sDur);
    });
  } else {
    // Variations 0, 2, 3: Single textured stroke with distinct character
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const offset = Math.random() * 1.5;

    const bpFilter = ctx.createBiquadFilter();
    bpFilter.type = 'bandpass';

    const gain = ctx.createGain();
    let duration = 0.075;
    let baseFreq = 2600;

    if (v === 0) {
      // Crisp light tap/scratch
      baseFreq = 2900 + (Math.random() * 200 - 100);
      duration = 0.07;
      bpFilter.Q.setValueAtTime(2.4, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    } else if (v === 2) {
      // Smooth round stroke (like 'O' curve)
      baseFreq = 2300 + (Math.random() * 200 - 100);
      duration = 0.095;
      bpFilter.Q.setValueAtTime(1.8, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.28, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    } else {
      // Quick curved flick (pitch sweep downwards)
      baseFreq = 3400;
      duration = 0.08;
      bpFilter.Q.setValueAtTime(2.2, now);
      bpFilter.frequency.setValueAtTime(3400, now);
      bpFilter.frequency.exponentialRampToValueAtTime(2200, now + duration);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.36, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    }

    if (v !== 3) {
      bpFilter.frequency.setValueAtTime(baseFreq, now);
    }

    src.connect(bpFilter);
    bpFilter.connect(hpFilter);
    hpFilter.connect(gain);
    gain.connect(masterGain);

    src.start(now, offset);
    src.stop(now + duration);
  }
}

/**
 * 2. Clock Click (Аналоговый щелчок шахматных часов)
 * Low mechanical transient body + crisp switch micro-snap.
 */
export function playClockClick() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(MASTER_VOLUME * 1.1, now);
  masterGain.connect(ctx.destination);

  // 1. Mechanical body impulse (downward frequency sweep)
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(340, now);
  osc.frequency.exponentialRampToValueAtTime(90, now + 0.024);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0.0001, now);
  oscGain.gain.linearRampToValueAtTime(0.35, now + 0.001);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.024);

  osc.connect(oscGain);
  oscGain.connect(masterGain);

  osc.start(now);
  osc.stop(now + 0.025);

  // 2. High-frequency switch snap (micro noise burst)
  const noise = getNoiseBuffer(ctx);
  const snapSrc = ctx.createBufferSource();
  snapSrc.buffer = noise;

  const snapFilter = ctx.createBiquadFilter();
  snapFilter.type = 'bandpass';
  snapFilter.frequency.setValueAtTime(2600, now);
  snapFilter.Q.setValueAtTime(3.0, now);

  const snapGain = ctx.createGain();
  snapGain.gain.setValueAtTime(0.0001, now);
  snapGain.gain.linearRampToValueAtTime(0.2, now + 0.001);
  snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

  snapSrc.connect(snapFilter);
  snapFilter.connect(snapGain);
  snapGain.connect(masterGain);

  snapSrc.start(now, Math.random());
  snapSrc.stop(now + 0.016);
}

/**
 * 3. Sector Win (Захват сектора)
 * Confident multi-stroke shading/scratch flourish with deeper resonance.
 */
export function playSectorWin() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const noise = getNoiseBuffer(ctx);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(MASTER_VOLUME * 1.25, now);
  masterGain.connect(ctx.destination);

  // Triple layered sweep stroke
  const strokeDelays = [0, 0.045, 0.09];
  const freqs = [1800, 2200, 1600];

  strokeDelays.forEach((delay, idx) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(freqs[idx], now + delay);
    bp.Q.setValueAtTime(2.0, now + delay);

    const gain = ctx.createGain();
    const sStart = now + delay;
    const dur = 0.065;

    gain.gain.setValueAtTime(0.0001, sStart);
    gain.gain.linearRampToValueAtTime(0.38, sStart + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, sStart + dur);

    src.connect(bp);
    bp.connect(gain);
    gain.connect(masterGain);

    src.start(sStart, Math.random());
    src.stop(sStart + dur);
  });

  // Low subtle whoosh for weight
  const whooshOsc = ctx.createOscillator();
  whooshOsc.type = 'sine';
  whooshOsc.frequency.setValueAtTime(280, now);
  whooshOsc.frequency.exponentialRampToValueAtTime(140, now + 0.16);

  const whooshGain = ctx.createGain();
  whooshGain.gain.setValueAtTime(0.0001, now);
  whooshGain.gain.linearRampToValueAtTime(0.18, now + 0.015);
  whooshGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

  whooshOsc.connect(whooshGain);
  whooshGain.connect(masterGain);

  whooshOsc.start(now);
  whooshOsc.stop(now + 0.17);
}

/**
 * 4. Game Over / Victory Chime (Победа или завершение игры)
 * Soft, warm pentatonic chime with gentle harmonic partials and long decay.
 */
export function playGameOver(isTie = false) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(MASTER_VOLUME * 0.9, now);
  masterGain.connect(ctx.destination);

  if (isTie) {
    // Gentle 2-tone neutral chord for a draw: F4 -> C5
    const tieNotes = [349.23, 523.25];
    tieNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      const gain = ctx.createGain();
      const start = now + idx * 0.08;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.8);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(start);
      osc.stop(start + 0.85);
    });
    return;
  }

  // Pentatonic acoustic bell chime: C5, E5, G5, B5, D6
  const notes = [523.25, 659.25, 783.99, 987.77, 1174.66];
  const stagger = 0.065;

  notes.forEach((freq, idx) => {
    const noteStart = now + idx * stagger;
    const dur = 1.3 - idx * 0.1;

    // Fundamental tone
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, noteStart);

    // Subtle 2nd harmonic for bell warmth
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.002, noteStart);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.0001, noteStart);
    gain1.gain.linearRampToValueAtTime(0.22, noteStart + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.0001, noteStart + dur);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.0001, noteStart);
    gain2.gain.linearRampToValueAtTime(0.05, noteStart + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.0001, noteStart + dur * 0.6);

    osc1.connect(gain1);
    osc2.connect(gain2);

    gain1.connect(masterGain);
    gain2.connect(masterGain);

    osc1.start(noteStart);
    osc2.start(noteStart);

    osc1.stop(noteStart + dur);
    osc2.stop(noteStart + dur);
  });
}

/**
 * Tactile Haptic Vibration
 * Safe navigator.vibrate with pattern differentiation
 */
export function triggerHaptic(type: 'tap' | 'sector' | 'win') {
  if (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'vibrate' in navigator &&
    typeof navigator.vibrate === 'function'
  ) {
    try {
      if (type === 'tap') {
        navigator.vibrate(8);
      } else if (type === 'sector') {
        navigator.vibrate([15, 30, 25]);
      } else if (type === 'win') {
        navigator.vibrate([20, 35, 20, 35, 40]);
      }
    } catch {
      // Ignore vibration errors if disabled by user agent
    }
  }
}
