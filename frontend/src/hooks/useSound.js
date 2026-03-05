import { Howl, Howler } from 'howler';
import { useGameStore } from '../store/gameStore';

// We generate sounds programmatically using Web Audio API
// so no external audio files are needed
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function beep(freq = 440, duration = 0.15, type = 'sine', volume = 0.3, delay = 0) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.05);
  } catch (e) { /* silent fail */ }
}

export const Sounds = {
  buzz() {
    beep(150, 0.18, 'sawtooth', 0.6);
    beep(100, 0.25, 'square', 0.4, 0.1);
  },
  correct() {
    beep(523, 0.1, 'sine', 0.3);
    beep(659, 0.1, 'sine', 0.3, 0.12);
    beep(784, 0.2, 'sine', 0.3, 0.24);
  },
  wrong() {
    beep(200, 0.08, 'sawtooth', 0.4);
    beep(150, 0.2, 'square', 0.35, 0.1);
  },
  tick() { beep(880, 0.05, 'sine', 0.12); },
  tickFast() { beep(1100, 0.04, 'sine', 0.18); },
  countdown() {
    [0, 0.9, 1.8].forEach(d => beep(660, 0.12, 'sine', 0.4, d));
    beep(880, 0.3, 'sine', 0.6, 2.7);
  },
  roundStart() {
    beep(392, 0.15, 'sine', 0.3);
    beep(523, 0.15, 'sine', 0.3, 0.18);
    beep(659, 0.15, 'sine', 0.3, 0.36);
    beep(784, 0.3, 'sine', 0.4, 0.54);
  },
  gameOver() {
    [0, 0.2, 0.4, 0.7, 1.0].forEach((d, i) => {
      beep([523, 587, 659, 698, 784][i], 0.18, 'sine', 0.35, d);
    });
  },
  pass() { beep(440, 0.08, 'sine', 0.2); beep(330, 0.12, 'sine', 0.2, 0.1); }
};

export function useAudio() {
  const isMuted = useGameStore(s => s.isMuted);
  return {
    play: (sound) => { if (!isMuted && Sounds[sound]) Sounds[sound](); }
  };
}
