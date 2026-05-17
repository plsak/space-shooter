import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "spaceshooter_sound_enabled";

type SoundType =
  | "shoot"
  | "explosion"
  | "meteorExplosion"
  | "playerHit"
  | "gameOver";

function getInitialSoundEnabled(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

export function useSoundEffects() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    getInitialSoundEnabled,
  );
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(soundEnabled));
    } catch {
      // ignore
    }
  }, [soundEnabled]);

  const getCtx = useCallback((): AudioContext | null => {
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new AudioContext();
      } catch {
        return null;
      }
    }
    // Resume if suspended (autoplay policy)
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  const playShoot = useCallback((ctx: AudioContext) => {
    const now = ctx.currentTime;

    // Layer 1: High-freq square wave sweeping down fast — the "laser" character
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "square";
    osc1.frequency.setValueAtTime(2200, now);
    osc1.frequency.exponentialRampToValueAtTime(320, now + 0.08);
    gain1.gain.setValueAtTime(0.0, now);
    gain1.gain.linearRampToValueAtTime(0.5, now + 0.004); // sharp attack
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Layer 2: Mid-freq sine for body/punch
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(600, now);
    osc2.frequency.exponentialRampToValueAtTime(80, now + 0.12);
    gain2.gain.setValueAtTime(0.0, now);
    gain2.gain.linearRampToValueAtTime(0.45, now + 0.005);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.14);

    // Layer 3: Short noise crack at attack for cannon punch
    const crackDuration = 0.012;
    const bufferSize = Math.floor(ctx.sampleRate * crackDuration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.setValueAtTime(2000, now);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + crackDuration);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSource.start(now);
  }, []);

  const playExplosion = useCallback((ctx: AudioContext) => {
    const now = ctx.currentTime;
    const duration = 0.45;

    // White noise burst
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.setValueAtTime(800, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, now + duration);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSource.start(now);

    // Low-frequency thump
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + duration);
    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }, []);

  const playMeteorExplosion = useCallback((ctx: AudioContext) => {
    const now = ctx.currentTime;
    const duration = 1.8;

    // Layer 1: Chest-thumping initial thump — very brief 60 Hz sine burst at t=0
    const thump = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thump.type = "sine";
    thump.frequency.setValueAtTime(70, now);
    thump.frequency.exponentialRampToValueAtTime(30, now + 0.05);
    thumpGain.gain.setValueAtTime(0.0, now);
    thumpGain.gain.linearRampToValueAtTime(1.2, now + 0.003); // very sharp attack
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    thump.connect(thumpGain);
    thumpGain.connect(ctx.destination);
    thump.start(now);
    thump.stop(now + 0.05);

    // Layer 2: Strong sub-bass — sine decaying from 90 Hz to 25 Hz over full duration
    const subBass = ctx.createOscillator();
    const subBassGain = ctx.createGain();
    subBass.type = "sine";
    subBass.frequency.setValueAtTime(90, now);
    subBass.frequency.exponentialRampToValueAtTime(25, now + duration);
    subBassGain.gain.setValueAtTime(0.0, now);
    subBassGain.gain.linearRampToValueAtTime(0.9, now + 0.01); // sharp attack
    subBassGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    subBass.connect(subBassGain);
    subBassGain.connect(ctx.destination);
    subBass.start(now);
    subBass.stop(now + duration);

    // Layer 3: Heavy bandpass noise — sweeping from 800 Hz down to 60 Hz
    const bufSize = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const dat = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      dat[i] = Math.random() * 2 - 1;
    }
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(800, now);
    bp.frequency.exponentialRampToValueAtTime(60, now + duration);
    bp.Q.setValueAtTime(2.5, now);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.75, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    noiseSrc.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSrc.start(now);

    // Layer 4: High-freq crack burst at t=0 — shatter impact character
    const crackDur = 0.03;
    const crackBufSize = Math.floor(ctx.sampleRate * crackDur);
    const crackBuf = ctx.createBuffer(1, crackBufSize, ctx.sampleRate);
    const crackDat = crackBuf.getChannelData(0);
    for (let i = 0; i < crackBufSize; i++) {
      crackDat[i] = Math.random() * 2 - 1;
    }
    const crackSrc = ctx.createBufferSource();
    crackSrc.buffer = crackBuf;
    const crackHp = ctx.createBiquadFilter();
    crackHp.type = "highpass";
    crackHp.frequency.setValueAtTime(3500, now);
    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0.45, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + crackDur);
    crackSrc.connect(crackHp);
    crackHp.connect(crackGain);
    crackGain.connect(ctx.destination);
    crackSrc.start(now);

    // Layer 5: Low sawtooth rumble — full duration for rolling debris feel
    const rumble = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    rumble.type = "sawtooth";
    rumble.frequency.setValueAtTime(50, now);
    rumble.frequency.exponentialRampToValueAtTime(18, now + duration);
    rumbleGain.gain.setValueAtTime(0.28, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    rumble.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);
    rumble.start(now);
    rumble.stop(now + duration);
  }, []);

  const playPlayerHit = useCallback((ctx: AudioContext) => {
    const now = ctx.currentTime;
    const duration = 0.22;

    const osc = ctx.createOscillator();
    const distortion = ctx.createWaveShaper();
    const gain = ctx.createGain();

    // Simple distortion curve
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = ((Math.PI + 200) * x) / (Math.PI + 200 * Math.abs(x));
    }
    distortion.curve = curve;

    osc.type = "sine";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(180, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(80, now + duration);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(distortion);
    distortion.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }, []);

  const playGameOver = useCallback((ctx: AudioContext) => {
    const now = ctx.currentTime;
    // Descending tone sequence
    const notes = [440, 330, 261, 196];
    const noteDuration = 0.18;
    const gap = 0.02;

    notes.forEach((freq, index) => {
      const startTime = now + index * (noteDuration + gap);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0, startTime);
      gain.gain.linearRampToValueAtTime(0.22, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + noteDuration);
    });
  }, []);

  const playSoundEffect = useCallback(
    (type: SoundType) => {
      if (!soundEnabled) return;
      const ctx = getCtx();
      if (!ctx) return;

      switch (type) {
        case "shoot":
          playShoot(ctx);
          break;
        case "explosion":
          playExplosion(ctx);
          break;
        case "meteorExplosion":
          playMeteorExplosion(ctx);
          break;
        case "playerHit":
          playPlayerHit(ctx);
          break;
        case "gameOver":
          playGameOver(ctx);
          break;
      }
    },
    [
      soundEnabled,
      getCtx,
      playShoot,
      playExplosion,
      playMeteorExplosion,
      playPlayerHit,
      playGameOver,
    ],
  );

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  return { playSoundEffect, soundEnabled, toggleSound };
}

export type { SoundType };
