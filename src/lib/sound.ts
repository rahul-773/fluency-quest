// Lightweight WebAudio sound effects — no assets needed.
let ctx: AudioContext | null = null;

type WindowWithWebkitAudioContext = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      const AudioContextConstructor = window.AudioContext
        ?? (window as WindowWithWebkitAudioContext).webkitAudioContext;
      if (!AudioContextConstructor) return null;
      ctx = new AudioContextConstructor();
    } catch {
      return null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function setMuted(muted: boolean) {
  const c = getCtx();
  if (!c) return;
  if (muted) c.suspend().catch(() => {});
  else c.resume().catch(() => {});
}

function tone(freq: number, durationMs: number, type: OscillatorType = 'sine', gain = 0.06, whenOffsetMs = 0) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = c.currentTime + whenOffsetMs / 1000;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durationMs / 1000);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + durationMs / 1000 + 0.02);
}

export const sfx = {
  click() {
    tone(420, 70, 'triangle', 0.04);
  },
  tick() {
    tone(880, 40, 'square', 0.03);
  },
  correct() {
    tone(660, 90, 'triangle', 0.05);
    tone(880, 140, 'triangle', 0.05, 90);
  },
  wrong() {
    tone(180, 180, 'sawtooth', 0.05);
  },
  reward() {
    tone(523, 120, 'triangle', 0.05);
    tone(659, 120, 'triangle', 0.05, 110);
    tone(784, 220, 'triangle', 0.06, 220);
  },
  levelup() {
    tone(523, 120, 'triangle', 0.06);
    tone(659, 120, 'triangle', 0.06, 110);
    tone(784, 120, 'triangle', 0.06, 220);
    tone(1046, 260, 'triangle', 0.07, 330);
  },
  start() {
    tone(440, 80, 'square', 0.04);
    tone(660, 120, 'square', 0.04, 90);
  },
};
