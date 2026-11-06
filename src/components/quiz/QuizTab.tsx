import { useEffect, useMemo, useRef, useState } from 'react';
import { Swords, Bot, User as UserIcon, Crown, Zap, Flame, ChevronRight, RotateCcw } from 'lucide-react';
import { QUIZ_QUESTIONS } from '@/lib/quiz';
import type { QuizQuestion } from '@/lib/quiz';
import type { GameState } from '@/hooks/useGameState';
import { sfx } from '@/lib/sound';
import { shuffle, clamp } from '@/lib/utils';
import Modal from '@/components/Modal';

interface QuizTabProps {
  state: GameState;
}

type Player = {
  id: string;
  name: string;
  isBot: boolean;
  score: number;
  streak: number;
  // bot skill 0..1 (probability of correct per question)
  skill: number;
  // latency per answer (ms) — bots answer over time
  latency: number;
  emoji: string;
};

const BOT_DEFS = [
  { id: 'bot1', name: 'Nova', skill: 0.62, latency: 4600, emoji: '🤖' },
  { id: 'bot2', name: 'Byte', skill: 0.74, latency: 5400, emoji: '👾' },
];

const QUESTION_TIME = 15;
const TOTAL_QUESTIONS = 8;

export default function QuizTab({ state }: QuizTabProps) {
  const [phase, setPhase] = useState<'lobby' | 'countdown' | 'playing' | 'results'>('lobby');
  const [countdown, setCountdown] = useState(3);
  const [qIndex, setQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [picked, setPicked] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [resolved, setResolved] = useState(false);
  const [showRound, setShowRound] = useState(false);

  const questions = useMemo<QuizQuestion[]>(() => shuffle(QUIZ_QUESTIONS).slice(0, TOTAL_QUESTIONS), []);
  const q = questions[qIndex];

  const timerRef = useRef<number | null>(null);

  // Reset on entering lobby
  useEffect(() => {
    if (phase === 'lobby') {
      setPlayers([
        { id: 'me', name: 'You', isBot: false, score: 0, streak: 0, skill: 1, latency: 0, emoji: '🧑' },
        ...BOT_DEFS.map((b) => ({ ...b, score: 0, streak: 0, isBot: true })),
      ]);
      setQIndex(0);
      setPicked(null);
      setResolved(false);
    }
  }, [phase]);

  // Countdown -> playing
  useEffect(() => {
    if (phase !== 'countdown') return;
    setCountdown(3);
    const iv = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(iv);
          setPhase('playing');
          sfx.start();
          return 0;
        }
        sfx.tick();
        return c - 1;
      });
    }, 800);
    return () => clearInterval(iv);
  }, [phase]);

  // Per-question timer
  useEffect(() => {
    if (phase !== 'playing' || resolved) return;
    setTimeLeft(QUESTION_TIME);
    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          sfx.wrong();
          resolve(-1, true);
          return 0;
        }
        if (t <= 4) sfx.tick();
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, qIndex, resolved]);

  // Bot behavior: each bot decides after its latency whether correct
  useEffect(() => {
    if (phase !== 'playing' || resolved) return;
    const timeouts = BOT_DEFS.map((b) => {
      const jitter = (Math.random() - 0.5) * 1400;
      const delay = clamp(b.latency + jitter, 1600, QUESTION_TIME * 1000 - 800);
      return window.setTimeout(() => {
        const correct = Math.random() < b.skill;
        setPlayers((prev) =>
          prev.map((p) => {
            if (p.id !== b.id) return p;
            const gain = correct ? 100 * (1 + p.streak * 0.25) : 0;
            const newStreak = correct ? p.streak + 1 : 0;
            return { ...p, score: Math.round(p.score + gain), streak: newStreak };
          })
        );
      }, delay);
    });
    return () => timeouts.forEach((t) => clearTimeout(t));
  }, [qIndex, phase, resolved]);

  function resolve(choice: number, timedOut: boolean) {
    if (resolved) return;
    setResolved(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const correctIdx = q.answer;
    const userCorrect = choice === correctIdx && !timedOut;
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.isBot) return p;
        const gain = userCorrect ? 100 * (1 + p.streak * 0.25) : 0;
        const newStreak = userCorrect ? p.streak + 1 : 0;
        return { ...p, score: Math.round(p.score + gain), streak: newStreak };
      })
    );
    if (userCorrect) sfx.correct();
    else sfx.wrong();

    // Brief reveal then advance
    window.setTimeout(() => {
      advance();
    }, 1400);
  }

  function advance() {
    if (qIndex + 1 >= questions.length) {
      // finalize
      setPlayers((prev) => {
        const me = prev.find((p) => !p.isBot)!;
        const bots = prev.filter((p) => p.isBot);
        const won = me.score >= Math.max(...bots.map((b) => b.score));
        state.recordQuizResult(won, me.score);
        sfx.reward();
        if (won) sfx.levelup();
        return prev;
      });
      setPhase('results');
      return;
    }
    setQIndex((i) => i + 1);
    setPicked(null);
    setResolved(false);
    setShowRound(true);
    window.setTimeout(() => setShowRound(false), 700);
  }

  function pick(i: number) {
    if (resolved) return;
    setPicked(i);
    sfx.click();
    resolve(i, false);
  }

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const userRank = sortedPlayers.findIndex((p) => !p.isBot) + 1;
  const userWon = phase === 'results' && userRank === 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="panel rounded-2xl p-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <Swords className="w-5 h-5 text-cyan-300" /> Quiz Arena
          </h2>
          <p className="text-sm text-slate-400">Solo practice against two AI opponents. 15s per question, streaks multiply your score.</p>
          <p className="mt-1 text-[11px] text-slate-500">Quiz opponents are simulated AI companions for practice purposes.</p>
        </div>
        {phase === 'lobby' && (
          <button
            onClick={() => {
              sfx.click();
              setPhase('countdown');
            }}
            className="rounded-xl bg-cyan-500/90 hover:bg-cyan-400 text-ink-900 font-bold px-5 py-2.5 transition flex items-center gap-2"
          >
            Start Practice <ChevronRight className="w-4 h-4" />
          </button>
        )}
        {(phase === 'playing' || phase === 'results') && (
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-slate-400">Question</div>
            <div className="font-display text-sm font-bold text-white">
              {Math.min(qIndex + 1, questions.length)} / {questions.length}
            </div>
          </div>
        )}
      </div>

      {/* Lobby state */}
      {phase === 'lobby' && (
        <div className="panel rounded-2xl p-6 animate-fade-in">
          <div className="grid sm:grid-cols-3 gap-3">
            {[{ id: 'me', name: 'You', emoji: '🧑', isBot: false }, ...BOT_DEFS.map((b) => ({ ...b, isBot: true }))].map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 text-center">
                <div className="text-3xl mb-1">{p.emoji}</div>
                <div className="text-sm font-bold text-white">{p.name}</div>
                <div className="text-[11px] text-slate-400">{p.isBot ? 'AI Opponent' : 'You'}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-400 mt-4">
            Ready to duel? Win XP and gems for each match.
          </p>
          <p className="text-center text-[11px] text-slate-500 mt-2">
            Local XP, gems, and quiz ranks are progress indicators only; no prizes or payouts are processed without server-side validation.
          </p>
        </div>
      )}

      {/* Countdown */}
      {phase === 'countdown' && (
        <div className="panel rounded-2xl p-10 text-center animate-pop-in">
          <div className="font-display text-7xl font-bold text-cyan-300 text-glow-cyan">{countdown || 'GO'}</div>
          <p className="text-slate-400 mt-3">Get ready...</p>
        </div>
      )}

      {/* Playing */}
      {phase === 'playing' && q && (
        <div className="space-y-4 animate-fade-in relative">
          {showRound && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <div className="font-display text-5xl font-bold text-cyan-300 animate-pop-in">Q{qIndex + 1}</div>
            </div>
          )}

          {/* Timer ring */}
          <div className="panel rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" stroke="#1e293b" strokeWidth="6" fill="none" />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke={timeLeft <= 4 ? '#fb7185' : '#22d3ee'}
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 28}
                    strokeDashoffset={(2 * Math.PI * 28 * (1 - timeLeft / QUESTION_TIME)).toFixed(2)}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className={`absolute inset-0 flex items-center justify-center font-display font-bold ${timeLeft <= 4 ? 'text-rose-300' : 'text-cyan-200'}`}>
                  {timeLeft}
                </div>
              </div>
              <div className="flex-1">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">Question</div>
                <p className="text-lg text-white font-medium">{q.prompt}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2 mt-4">
              {q.choices.map((c, i) => {
                let cls = 'border-slate-700 bg-slate-800/50 hover:border-slate-500';
                if (resolved) {
                  if (i === q.answer) cls = 'border-emerald-500 bg-emerald-500/15 glow-green';
                  else if (i === picked) cls = 'border-rose-500 bg-rose-500/15';
                  else cls = 'border-slate-700 bg-slate-800/30 opacity-60';
                }
                return (
                  <button
                    key={i}
                    onClick={() => pick(i)}
                    disabled={resolved}
                    className={`rounded-xl border px-4 py-3 text-left text-sm text-white transition ${cls} ${resolved ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <span className="mr-2 text-xs font-display text-slate-500">{String.fromCharCode(65 + i)}</span>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live leaderboard */}
          <div className="panel rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-300" /> Live Standings
              </h3>
              <span className="text-[11px] text-slate-400">Updates in real time</span>
            </div>
            <div className="space-y-2">
              {sortedPlayers.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                    p.isBot ? 'bg-slate-800/40' : 'bg-cyan-500/10 border border-cyan-500/30'
                  }`}
                >
                  <div className="w-6 text-center font-display font-bold text-slate-400">{i + 1}</div>
                  <div className="text-2xl">{p.emoji}</div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      {p.isBot ? <Bot className="w-3.5 h-3.5 text-slate-400" /> : <UserIcon className="w-3.5 h-3.5 text-cyan-300" />}
                      {p.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {p.streak > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-300">
                          <Flame className="w-3 h-3" /> {p.streak}x streak
                        </span>
                      ) : (
                        'no streak'
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold text-white">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    {p.score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {phase === 'results' && (
        <Modal open onClose={() => setPhase('lobby')} title="Match Results" accent={userWon ? 'green' : 'amber'}>
          <div className="text-center py-2">
            <div
              className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                userWon ? 'bg-emerald-500/15 glow-green' : 'bg-amber-500/15 glow-amber'
              }`}
            >
              {userWon ? <Crown className="w-8 h-8 text-emerald-300" /> : <Swords className="w-8 h-8 text-amber-300" />}
            </div>
            <h4 className="font-display text-xl font-bold text-white">
              {userWon ? 'Victory!' : `You finished #${userRank}`}
            </h4>
            <p className="text-sm text-slate-400 mt-1">
              {userWon ? '+60 XP · +10 Gems' : '+20 XP · +3 Gems for playing'}
            </p>
          </div>

          <div className="space-y-2 mt-4">
            {sortedPlayers.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  p.isBot ? 'bg-slate-800/40' : 'bg-cyan-500/10 border border-cyan-500/30'
                }`}
              >
                <div className="w-6 text-center font-display font-bold text-slate-400">{i + 1}</div>
                <div className="text-2xl">{p.emoji}</div>
                <div className="flex-1 text-sm font-bold text-white">{p.name}</div>
                <div className="flex items-center gap-1 text-sm font-bold text-white">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  {p.score}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => {
                sfx.click();
                setPhase('countdown');
              }}
              className="flex items-center gap-2 rounded-xl bg-cyan-500/90 hover:bg-cyan-400 text-ink-900 font-bold px-5 py-2 transition"
            >
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
            <button
              onClick={() => {
                sfx.click();
                setPhase('lobby');
              }}
              className="rounded-xl bg-slate-700 hover:bg-slate-600 px-5 py-2 text-sm font-semibold text-white transition"
            >
              Back to Lobby
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
