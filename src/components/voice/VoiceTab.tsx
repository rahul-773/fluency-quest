import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, RefreshCw, Check, Sparkles, UsersRound } from 'lucide-react';
import type { GameState } from '@/hooks/useGameState';
import { SCENARIOS } from '@/lib/voice';
import type { VoiceLine } from '@/lib/voice';
import { sfx } from '@/lib/sound';
import { useAudioVisualizer } from '@/hooks/useAudioVisualizer';
import Modal from '@/components/Modal';

const PeerPractice = lazy(() => import('@/components/voice/PeerPractice'));

interface VoiceTabProps {
  state: GameState;
}

// Minimal typings for the Web Speech API (not in TS lib by default)
interface SpeechRecognitionEventLike {
  results: {
    length: number;
    [index: number]: { 0: { transcript: string }; isFinal: boolean };
  };
  resultIndex: number;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const speechWindow = window as SpeechRecognitionWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

const accentColor: Record<string, string> = {
  green: '#4ade80',
  amber: '#fbbf24',
  pink: '#f472b6',
};
const accentText: Record<string, string> = {
  green: 'text-emerald-300',
  amber: 'text-amber-300',
  pink: 'text-pink-300',
};

export default function VoiceTab({ state }: VoiceTabProps) {
  const [voiceMode, setVoiceMode] = useState<'ai' | 'peer'>('ai');
  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0].id);
  const [callActive, setCallActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [lineIdx, setLineIdx] = useState(0);
  const [npcSpeaking, setNpcSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<{ word: string; status: 'good' | 'shaky' }[]>([]);
  const [showScore, setShowScore] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [mutedNpc, setMutedNpc] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const [micWarning, setMicWarning] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scenario = useMemo(() => SCENARIOS.find((s) => s.id === scenarioId)!, [scenarioId]);
  const lines = scenario.lines;
  const currentLine = lines[Math.min(lineIdx, lines.length - 1)];

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isSecureContext = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isSecureContext) {
      setMicWarning('HTTPS is required for microphone access and peer practice. Use your production host or localhost with secure transport.');
      return;
    }

    const permissionApi = (navigator as Navigator & {
      permissions?: { query?: (descriptor: { name: string }) => Promise<{ state: string }> };
    }).permissions;

    if (!permissionApi?.query) {
      setMicWarning(null);
      return;
    }

    void permissionApi.query({ name: 'microphone' })
      .then((permission) => {
        if (permission.state === 'denied') {
          setMicWarning('Microphone access is blocked. Allow microphone permission in your browser settings and refresh the page.');
        } else {
          setMicWarning(null);
        }
      })
      .catch(() => {
        setMicWarning(null);
      });
  }, []);

  useAudioVisualizer(canvasRef, {
    getActive: () => recording || npcSpeaking,
    color: accentColor[scenario.accent],
  });

  // Init / teardown recognition
  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setUnsupported(true);
      return;
    }
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e: SpeechRecognitionEventLike) => {
      let finalText = '';
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      if (finalText) setTranscript((prev) => (prev ? prev + ' ' : '') + finalText.trim());
      setInterim(interimText);
    };
    rec.onerror = () => {
      setRecording(false);
    };
    rec.onend = () => {
      setRecording(false);
    };
    rec.onstart = () => {
      setRecording(true);
    };
    recognitionRef.current = rec;

    return () => {
      try {
        rec.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, []);

  // Reset when scenario changes
  useEffect(() => {
    endCall();
    setTranscript('');
    setInterim('');
    setLineIdx(0);
    setFeedback([]);
    setSessionScore(0);
  }, [scenarioId]);

  function speakNpc(text: string, onDone?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onDone?.();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.98;
      u.pitch = 1.05;
      if (mutedNpc || !state.progress.soundOn) {
        // simulate timing without audio
        setNpcSpeaking(true);
        const dur = Math.max(900, text.length * 55);
        window.setTimeout(() => {
          setNpcSpeaking(false);
          onDone?.();
        }, dur);
        return;
      }
      u.onstart = () => setNpcSpeaking(true);
      u.onend = () => {
        setNpcSpeaking(false);
        onDone?.();
      };
      u.onerror = () => {
        setNpcSpeaking(false);
        onDone?.();
      };
      window.speechSynthesis.speak(u);
    } catch {
      setNpcSpeaking(false);
      onDone?.();
    }
  }

  function startCall() {
    sfx.start();
    setCallActive(true);
    setTranscript('');
    setFeedback([]);
    setLineIdx(0);
    // Greeting from NPC = line 0
    const first = lines[0];
    if (first.speaker === 'npc') {
      speakNpc(first.text, () => {
        // advance to next (user-target) line
        setLineIdx(1);
      });
    }
  }

  function endCall() {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setNpcSpeaking(false);
    setRecording(false);
    setCallActive(false);
  }

  function startListening() {
    if (unsupported) return;
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.start();
    } catch {
      // already started — restart
      try {
        rec.abort();
        setTimeout(() => rec.start(), 120);
      } catch {
        // ignore
      }
    }
  }

  function stopListening() {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setRecording(false);
  }

  function submitUtterance() {
    stopListening();
    const text = (transcript + ' ' + interim).trim().toLowerCase();
    const target = currentLine as VoiceLine;
    if (target.speaker !== 'user-target') return;

    // Color-code words from target vocab
    const found: { word: string; status: 'good' | 'shaky' }[] = [];
    let score = 0;
    for (const t of target.targets) {
      const ok = text.includes(t.word.toLowerCase());
      found.push({ word: t.word, status: ok ? 'good' : 'shaky' });
      if (ok) score += 1;
    }
    setFeedback(found);
    setSessionScore((s) => s + score);
    sfx.correct();

    // Advance: NPC replies with next npc line, or end if none
    const nextIdx = lineIdx + 1;
    setTranscript('');
    setInterim('');
    if (nextIdx >= lines.length) {
      // end call + score
      const totalTargets = lines.filter((l) => l.speaker === 'user-target').reduce((n, l) => n + l.targets.length, 0);
      const pct = totalTargets ? Math.round((sessionScore / totalTargets) * 100) : 0;
      state.recordVoiceScore(scenario.id, pct);
      sfx.reward();
      setCallActive(false);
      setShowScore(true);
      return;
    }
    // next line should be NPC -> speak, then advance to next user-target
    setLineIdx(nextIdx);
    const nextLine = lines[nextIdx];
    if (nextLine.speaker === 'npc') {
      speakNpc(nextLine.text, () => {
        const after = nextIdx + 1;
        if (after < lines.length) setLineIdx(after);
      });
    }
  }

  function repeatNpc() {
    if (currentLine.speaker === 'npc') {
      sfx.click();
      speakNpc(currentLine.text);
    }
  }

  if (voiceMode === 'peer') {
    return (
      <div className="space-y-4">
        <VoiceModeToggle mode={voiceMode} onChange={setVoiceMode} />
        {micWarning && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {micWarning}
          </div>
        )}
        <Suspense fallback={<div className="panel rounded-2xl p-6 text-center text-sm text-slate-400">Opening peer practice…</div>}>
          <PeerPractice />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <VoiceModeToggle mode={voiceMode} onChange={setVoiceMode} />
      {micWarning && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {micWarning}
        </div>
      )}
      {/* Scenario picker */}
      <div className="panel rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-lg font-bold text-white">Live Voice Roleplay</h2>
            <p className="text-sm text-slate-400">Practice real speech with NPC partners using your microphone.</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-2">
          {SCENARIOS.map((s) => {
            const sel = s.id === scenarioId;
            const best = state.progress.voiceBest[s.id] ?? 0;
            return (
              <button
                key={s.id}
                onClick={() => {
                  sfx.click();
                  setScenarioId(s.id);
                }}
                className={`text-left rounded-xl border p-3 transition ${
                  sel
                    ? `border-${s.accent === 'green' ? 'emerald' : s.accent === 'amber' ? 'amber' : 'pink'}-500/50 bg-slate-800/60`
                    : 'border-slate-700 bg-slate-800/30 hover:border-slate-500'
                }`}
              >
                <div className="text-xl mb-1">{s.emoji}</div>
                <div className="text-sm font-bold text-white">{s.title}</div>
                <div className="text-xs text-slate-400">
                  {s.npcName} · {s.npcRole}
                </div>
                {best > 0 && <div className="text-[11px] text-emerald-400 mt-1">Best: {best}%</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Call surface */}
      <div className="panel rounded-2xl overflow-hidden">
        {/* Avatar + visualizer header */}
        <div className="relative bg-gradient-to-b from-slate-800/40 to-transparent px-4 pt-6 pb-4">
          <div className="flex flex-col items-center">
            <div
              className={`relative w-24 h-24 rounded-full bg-slate-800 border-2 flex items-center justify-center text-5xl transition ${
                npcSpeaking
                  ? `border-${scenario.accent === 'green' ? 'emerald' : scenario.accent === 'amber' ? 'amber' : 'pink'}-500 animate-pulse-ring`
                  : 'border-slate-600'
              }`}
            >
              <span aria-hidden>{scenario.emoji}</span>
              {npcSpeaking && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-slate-900/90 px-2 py-0.5 rounded-full text-slate-300 font-display tracking-wide">
                  speaking
                </span>
              )}
            </div>
            <div className="mt-2 text-center">
              <div className="font-display font-bold text-white">{scenario.npcName}</div>
              <div className="text-xs text-slate-400">{scenario.npcRole}</div>
            </div>
          </div>

          {/* Visualizer */}
          <div className="mt-4 h-16 w-full">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
        </div>

        {/* Transcript / feedback area */}
        <div className="px-4 pb-4">
          <div className="rounded-xl border border-slate-700 bg-ink-900/60 p-4 min-h-[120px]">
            {unsupported ? (
              <div className="text-center text-sm text-amber-300/90 py-6">
                Your browser does not support speech recognition. Try Chrome or Edge to use live voice practice.
                You can still read the dialogue and hear NPC replies.
              </div>
            ) : !callActive ? (
              <div className="text-center text-sm text-slate-500 py-6">
                Press "Start Call" to begin. You will hear the NPC, then respond with your voice.
              </div>
            ) : (
              <div className="space-y-2 animate-fade-in">
                {currentLine.speaker === 'npc' && (
                  <div className="text-sm text-slate-300">
                    <span className={`font-bold ${accentText[scenario.accent]}`}>{scenario.npcName}: </span>
                    "{currentLine.text}"
                  </div>
                )}
                <div className="text-[11px] uppercase tracking-wider text-slate-500 mt-2">Your turn — try saying:</div>
                <div className="text-sm text-cyan-200 italic">"{currentLine.speaker === 'user-target' ? currentLine.text : ''}"</div>
                <div className="mt-2 text-sm text-white">
                  <span className="text-slate-500">You: </span>
                  {transcript} <span className="text-slate-400">{interim}</span>
                  {recording && <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse align-middle" />}
                </div>
                {feedback.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {feedback.map((f, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2 py-1 rounded-full border ${
                          f.status === 'good'
                            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                            : 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {f.status === 'good' ? <Check className="inline w-3 h-3 mr-1" /> : <Sparkles className="inline w-3 h-3 mr-1" />}
                        {f.word}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Target vocabulary cards */}
          {callActive && currentLine.speaker === 'user-target' && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currentLine.targets.map((t, i) => (
                <div key={i} className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2">
                  <div className="text-sm font-bold text-white">{t.word}</div>
                  <div className="text-[11px] text-slate-400">{t.hint}</div>
                </div>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {!callActive ? (
              <button
                onClick={startCall}
                className="flex items-center gap-2 rounded-xl bg-emerald-500/90 hover:bg-emerald-400 text-ink-900 font-bold px-5 py-2.5 transition"
              >
                <Phone className="w-4 h-4" /> Start Call
              </button>
            ) : (
              <>
                {!unsupported && (
                  recording ? (
                    <button
                      onClick={stopListening}
                      className="flex items-center gap-2 rounded-xl bg-rose-500/90 hover:bg-rose-400 text-white font-bold px-4 py-2.5 transition"
                    >
                      <MicOff className="w-4 h-4" /> Stop
                    </button>
                  ) : (
                    <button
                      onClick={startListening}
                      disabled={npcSpeaking}
                      className="flex items-center gap-2 rounded-xl bg-cyan-500/90 hover:bg-cyan-400 disabled:opacity-40 text-ink-900 font-bold px-4 py-2.5 transition"
                    >
                      <Mic className="w-4 h-4" /> Speak
                    </button>
                  )
                )}
                <button
                  onClick={submitUtterance}
                  disabled={unsupported}
                  className="flex items-center gap-2 rounded-xl bg-violet-500/90 hover:bg-violet-400 disabled:opacity-40 text-white font-bold px-4 py-2.5 transition"
                >
                  <Check className="w-4 h-4" /> Submit
                </button>
                <button
                  onClick={repeatNpc}
                  className="flex items-center gap-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold px-3 py-2.5 transition"
                  aria-label="Repeat NPC line"
                >
                  <RefreshCw className="w-4 h-4" /> Repeat
                </button>
                <button
                  onClick={() => setMutedNpc((m) => !m)}
                  className="flex items-center gap-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold px-3 py-2.5 transition"
                  aria-label={mutedNpc ? 'Unmute NPC voice' : 'Mute NPC voice'}
                >
                  {mutedNpc ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={endCall}
                  className="flex items-center gap-2 rounded-xl bg-rose-700/80 hover:bg-rose-600 text-white font-semibold px-4 py-2.5 transition ml-auto"
                >
                  <PhoneOff className="w-4 h-4" /> End
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Score modal */}
      <Modal open={showScore} onClose={() => setShowScore(false)} title="Roleplay Complete" accent="cyan">
        <div className="text-center py-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-cyan-500/15 glow-cyan flex items-center justify-center mb-3">
            <Sparkles className="w-8 h-8 text-cyan-300" />
          </div>
          <p className="text-sm text-slate-400">You matched vocabulary across the conversation.</p>
          <div className="font-display text-4xl font-bold text-cyan-300 mt-2">{sessionScore} hits</div>
          <p className="text-sm text-emerald-300 mt-2">+Gems awarded for practice</p>
          <button
            onClick={() => {
              sfx.click();
              setShowScore(false);
            }}
            className="mt-4 rounded-xl bg-slate-700 hover:bg-slate-600 px-5 py-2 text-sm font-semibold text-white"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}

function VoiceModeToggle({
  mode,
  onChange,
}: {
  mode: 'ai' | 'peer';
  onChange: (mode: 'ai' | 'peer') => void;
}) {
  return (
    <div className="panel flex w-full max-w-sm rounded-xl p-1" aria-label="Voice practice mode">
      <button
        type="button"
        onClick={() => {
          sfx.click();
          onChange('ai');
        }}
        aria-pressed={mode === 'ai'}
        className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
          mode === 'ai' ? 'bg-cyan-500/15 text-cyan-200 shadow-inner' : 'text-slate-400 hover:text-white'
        }`}
      >
        AI Solo
      </button>
      <button
        type="button"
        onClick={() => {
          sfx.click();
          onChange('peer');
        }}
        aria-pressed={mode === 'peer'}
        className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
          mode === 'peer' ? 'bg-cyan-500/15 text-cyan-200 shadow-inner' : 'text-slate-400 hover:text-white'
        }`}
      >
        <UsersRound className="h-4 w-4" />
        Peer Practice
      </button>
    </div>
  );
}
