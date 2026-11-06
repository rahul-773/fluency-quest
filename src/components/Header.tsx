import { Zap, Flame, Gem, Star, Volume2, VolumeX, Compass, TrendingUp } from 'lucide-react';
import type { GameState } from '@/hooks/useGameState';
import { sfx } from '@/lib/sound';

interface HeaderProps {
  state: GameState;
  activeTab: TabId;
  onToggleSound: () => void;
}

export type TabId = 'world' | 'voice' | 'quiz' | 'profile';

export default function Header({ state, onToggleSound }: HeaderProps) {
  const { progress, levelInfo, cefr } = state;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-ink-900/85 backdrop-blur-md">
      {/* Top row: logo + sound */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-3 pb-1">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-600 flex items-center justify-center shadow-neon">
              <Compass className="w-5 h-5 text-ink-900" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-wide leading-none text-white">
              Fluency<span className="text-cyan-400">Quest</span>
            </h1>
            <p className="text-[11px] text-slate-400 leading-none mt-0.5">English, leveled up</p>
          </div>
        </div>

        <button
          onClick={() => {
            onToggleSound();
            sfx.click();
          }}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500/60 hover:text-cyan-300 transition"
          aria-label={progress.soundOn ? 'Mute sounds' : 'Unmute sounds'}
        >
          {progress.soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden sm:inline">{progress.soundOn ? 'Sound on' : 'Muted'}</span>
        </button>
      </div>

      {/* Stat bar */}
      <div className="px-4 sm:px-6 pb-3 pt-1">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Level + CEFR */}
          <div className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5">
            <Star className="w-4 h-4 text-cyan-300" />
            <div className="leading-tight">
              <div className="text-[10px] uppercase tracking-wider text-cyan-300/80">Level</div>
              <div className="text-sm font-bold text-white font-display">
                L{levelInfo.level} <span className="text-cyan-300">·</span> {cefr}
              </div>
            </div>
          </div>

          {/* XP with progress bar */}
          <div className="flex-1 min-w-[140px] rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-1.5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> XP
              </span>
              <span className="text-white font-semibold">
                {progress.xp} / {levelInfo.next === progress.xp ? 'MAX' : levelInfo.next}
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-700"
                style={{ width: `${levelInfo.progress}%` }}
              />
            </div>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-1.5">
            <Flame className="w-4 h-4 text-orange-400" />
            <div className="leading-tight">
              <div className="text-[10px] uppercase tracking-wider text-orange-300/80">Streak</div>
              <div className="text-sm font-bold text-white">{progress.streak} days</div>
            </div>
          </div>

          {/* Gems */}
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
            <Gem className="w-4 h-4 text-emerald-400" />
            <div className="leading-tight">
              <div className="text-[10px] uppercase tracking-wider text-emerald-300/80">Gems</div>
              <div className="text-sm font-bold text-white">{progress.gems}</div>
            </div>
          </div>

          {/* Rank title (hidden on small) */}
          <div className="hidden md:flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-1.5">
            <TrendingUp className="w-4 h-4 text-violet-300" />
            <div className="leading-tight">
              <div className="text-[10px] uppercase tracking-wider text-violet-300/80">Rank</div>
              <div className="text-sm font-bold text-white">{levelInfo.title}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
