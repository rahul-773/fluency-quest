import { useEffect, useRef } from 'react';

interface VisualizerOptions {
  getActive: () => boolean;
  color: string;
}

type WindowWithWebkitAudioContext = Window & {
  webkitAudioContext?: typeof AudioContext;
};

// Audio-reactive canvas bars. Uses an AnalyserNode when speech recognition
// provides an audio stream is hard; instead we simulate reactivity off mic
// activity via SpeechRecognition volume events where available, otherwise
// we generate a pleasing idle animation driven by time + a "speaking" flag.
export function useAudioVisualizer(canvasRef: React.RefObject<HTMLCanvasElement>, opts: VisualizerOptions) {
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Try to capture mic for genuine reactivity
  useEffect(() => {
    let cancelled = false;
    async function attachMic() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const AudioContextConstructor = window.AudioContext
          ?? (window as WindowWithWebkitAudioContext).webkitAudioContext;
        if (!AudioContextConstructor) {
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          return;
        }
        const ctx = new AudioContextConstructor();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        src.connect(analyser);
        analyserRef.current = analyser;
      } catch {
        // permission denied or unsupported — visualizer falls back to synthetic
        analyserRef.current = null;
      }
    }
    attachMic();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      analyserRef.current = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const w = (canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1));
      const h = (canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1));
      ctx.clearRect(0, 0, w, h);

      const active = opts.getActive();
      phaseRef.current += 0.05;
      const bars = 48;
      const gap = w / (bars * 2);
      const barWidth = gap;

      const analyser = analyserRef.current;
      const data = new Uint8Array(analyser ? analyser.frequencyBinCount : 0);
      if (analyser) analyser.getByteFrequencyData(data);

      for (let i = 0; i < bars; i++) {
        let amp: number;
        if (data.length && active) {
          amp = data[i % data.length] / 255;
        } else {
          // synthetic idle / active wave
          const base = active ? 0.5 : 0.18;
          const wave = Math.sin(phaseRef.current + i * 0.4) * 0.5 + 0.5;
          amp = base * wave + (active ? 0.25 * Math.random() : 0.04);
        }
        const barH = Math.max(2, amp * h * 0.85);
        const x = i * barWidth * 1.6 + barWidth * 0.4;
        const y = (h - barH) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barH);
        grad.addColorStop(0, opts.color);
        grad.addColorStop(1, 'rgba(8, 12, 24, 0.2)');
        ctx.fillStyle = grad;
        ctx.shadowColor = opts.color;
        ctx.shadowBlur = active ? 12 : 4;
        roundRect(ctx, x, y, barWidth, barH, barWidth / 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [canvasRef, opts]);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
