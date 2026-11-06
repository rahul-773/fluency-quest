import { useState } from 'react';
import { CheckCircle2, XCircle, Sparkles, ChevronRight, Trophy } from 'lucide-react';
import Modal from '@/components/Modal';
import type { Region, Quest } from '@/lib/quests';
import type { GameState } from '@/hooks/useGameState';
import { sfx } from '@/lib/sound';

interface QuestModalProps {
  region: Region;
  quest: Quest;
  state: GameState;
  onClose: () => void;
}

export default function QuestModal({ region, quest, state, onClose }: QuestModalProps) {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  const question = quest.questions[step];
  const isLast = step === quest.questions.length - 1;
  const alreadyDone = state.progress.completed[quest.id] !== undefined;

  const accentMap = {
    green: { modal: 'green' as const, text: 'text-emerald-300', ring: 'border-emerald-500/40', bg: 'bg-emerald-500/10' },
    amber: { modal: 'amber' as const, text: 'text-amber-300', ring: 'border-amber-500/40', bg: 'bg-amber-500/10' },
    pink: { modal: 'pink' as const, text: 'text-pink-300', ring: 'border-pink-500/40', bg: 'bg-pink-500/10' },
  };
  const accent = accentMap[region.accent];

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    const correct = i === question.answer;
    setAnswers((a) => [...a, correct]);
    if (correct) sfx.correct();
    else sfx.wrong();
  }

  function next() {
    if (picked === null) return;
    sfx.click();
    if (isLast) {
      const correctCount = [...answers].filter(Boolean).length;
      if (correctCount >= 2) {
        state.awardQuestXp(quest.id, quest.xp);
        sfx.reward();
      }
      setDone(true);
    } else {
      setStep((s) => s + 1);
      setPicked(null);
    }
  }

  const correctCount = answers.filter(Boolean).length;
  const passed = correctCount >= 2;

  return (
    <Modal open onClose={onClose} title={quest.title} accent={accent.modal} size="lg">
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-display tracking-wider uppercase ${accent.text}`}>
          {region.name}
        </span>
        <span className="text-xs text-slate-400">
          {alreadyDone ? 'Review' : `+${quest.xp} XP on completion`}
        </span>
      </div>
      <p className="text-sm text-slate-400 mb-4">{quest.blurb}</p>

      {/* Progress dots */}
      <div className="flex items-center gap-2 mb-4">
        {quest.questions.map((_, i) => {
          const stateCls =
            i < answers.length ? (answers[i] ? 'bg-emerald-400' : 'bg-rose-500') : i === step ? 'bg-cyan-400' : 'bg-slate-700';
          return <span key={i} className={`h-1.5 flex-1 rounded-full ${stateCls}`} />;
        })}
      </div>

      {!done ? (
        <div className="animate-fade-in">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
            Question {step + 1} of {quest.questions.length}
          </div>
          <p className="text-lg text-white font-medium mb-4">{question.prompt}</p>

          <div className="grid gap-2">
            {question.choices.map((c, i) => {
              const isPicked = picked === i;
              const isAnswer = i === question.answer;
              let cls = 'border-slate-700 bg-slate-800/50 hover:border-slate-500';
              if (picked !== null) {
                if (isAnswer) cls = 'border-emerald-500 bg-emerald-500/15 glow-green';
                else if (isPicked) cls = 'border-rose-500 bg-rose-500/15';
                else cls = 'border-slate-700 bg-slate-800/30 opacity-60';
              }
              return (
                <button
                  key={i}
                  onClick={() => pick(i)}
                  disabled={picked !== null}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${cls} ${picked === null ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <span className="text-sm text-white">{c}</span>
                  {picked !== null && isAnswer && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                  {picked !== null && isPicked && !isAnswer && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {picked !== null && (
            <div className={`mt-3 rounded-lg border ${accent.ring} ${accent.bg} p-3 animate-fade-in`}>
              <div className="flex items-start gap-2">
                <Sparkles className={`w-4 h-4 mt-0.5 ${accent.text}`} />
                <p className="text-sm text-slate-200">{question.explain}</p>
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={next}
              disabled={picked === null}
              className="flex items-center gap-2 rounded-xl bg-cyan-500/90 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-ink-900 transition"
            >
              {isLast ? 'Finish' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 animate-pop-in">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3">
            {passed ? (
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 glow-green flex items-center justify-center">
                <Trophy className="w-8 h-8 text-emerald-300" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-rose-300" />
              </div>
            )}
          </div>
          <h4 className="font-display text-xl font-bold text-white">
            {passed ? 'Quest Complete!' : 'Keep Practicing'}
          </h4>
          <p className="text-sm text-slate-400 mt-1">
            You answered {correctCount}/{quest.questions.length} correctly.
          </p>
          {passed ? (
            alreadyDone ? (
              <p className="text-sm text-slate-400 mt-1">Already completed — no extra XP this time.</p>
            ) : (
              <p className={`mt-1 text-sm font-bold ${accent.text}`}>+{quest.xp} XP earned · +5 Gems</p>
            )
          ) : (
            <p className="text-sm text-slate-400 mt-1">Score 2 of 3 to earn XP. Try again!</p>
          )}
          <button
            onClick={() => {
              sfx.click();
              onClose();
            }}
            className="mt-4 rounded-xl bg-slate-700 hover:bg-slate-600 px-5 py-2 text-sm font-semibold text-white transition"
          >
            Close
          </button>
        </div>
      )}
    </Modal>
  );
}
