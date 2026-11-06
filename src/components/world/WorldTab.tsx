import { useState } from 'react';
import * as Lucide from 'lucide-react';
import WorldMap from '@/components/world/WorldMap';
import QuestModal from '@/components/world/QuestModal';
import type { GameState } from '@/hooks/useGameState';
import type { Region, Quest } from '@/lib/quests';
import { sfx } from '@/lib/sound';

interface WorldTabProps {
  state: GameState;
}

export default function WorldTab({ state }: WorldTabProps) {
  const [openRegion, setOpenRegion] = useState<Region | null>(null);
  const [openQuest, setOpenQuest] = useState<Quest | null>(null);

  return (
    <div className="space-y-4">
      <WorldMap state={state} onOpenRegion={(r) => setOpenRegion(r)} />

      {/* Quest list for opened region */}
      {openRegion && (
        <RegionPanel
          region={openRegion}
          state={state}
          onClose={() => setOpenRegion(null)}
          onPick={(q) => {
            sfx.click();
            setOpenQuest(q);
          }}
        />
      )}

      {openQuest && openRegion && (
        <QuestModal
          region={openRegion}
          quest={openQuest}
          state={state}
          onClose={() => setOpenQuest(null)}
        />
      )}
    </div>
  );
}

function RegionPanel({
  region,
  state,
  onClose,
  onPick,
}: {
  region: Region;
  state: GameState;
  onClose: () => void;
  onPick: (q: Quest) => void;
}) {
  const Icon = Lucide[region.icon];
  const accentText: Record<string, string> = {
    green: 'text-emerald-300',
    amber: 'text-amber-300',
    pink: 'text-pink-300',
  };
  const accentBorder: Record<string, string> = {
    green: 'border-emerald-500/30',
    amber: 'border-amber-500/30',
    pink: 'border-pink-500/30',
  };
  return (
    <div className={`panel rounded-2xl border ${accentBorder[region.accent]} p-4 animate-fade-in`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
            <Icon className={`w-5 h-5 ${accentText[region.accent]}`} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">{region.name}</h3>
            <p className="text-xs text-slate-400">{region.tagline}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-sm"
          aria-label="Close region panel"
        >
          <Lucide.X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {region.quests.map((q, i) => {
          const done = state.progress.completed[q.id] !== undefined;
          return (
            <button
              key={q.id}
              onClick={() => onPick(q)}
              className="text-left rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-cyan-500/50 p-3 transition group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-display tracking-wider uppercase text-slate-500">
                  Quest {i + 1}
                </span>
                {done ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <Lucide.Check className="w-3 h-3" /> Done
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-cyan-300">+{q.xp} XP</span>
                )}
              </div>
              <div className="text-sm font-bold text-white group-hover:text-cyan-200 transition">{q.title}</div>
              <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{q.blurb}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
