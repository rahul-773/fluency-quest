import { useMemo } from 'react';
import * as Lucide from 'lucide-react';
import { REGIONS } from '@/lib/quests';
import type { Region } from '@/lib/quests';
import type { GameState } from '@/hooks/useGameState';
import { sfx } from '@/lib/sound';

interface WorldMapProps {
  state: GameState;
  onOpenRegion: (region: Region) => void;
}

export default function WorldMap({ state, onOpenRegion }: WorldMapProps) {
  const { progress } = state;

  const stats = useMemo(() => {
    const totalQuests = REGIONS.reduce((n, r) => n + r.quests.length, 0);
    const done = Object.keys(progress.completed).length;
    return { totalQuests, done, pct: Math.round((done / totalQuests) * 100) };
  }, [progress.completed]);

  // Build SVG connections (ordered by difficulty)
  const connections = useMemo(() => {
    const order: ('woods' | 'metro' | 'spires')[] = ['woods', 'metro', 'spires'];
    return order
      .map((id, i) => {
        if (i === order.length - 1) return null;
        const a = REGIONS.find((r) => r.id === id)!;
        const b = REGIONS.find((r) => r.id === order[i + 1])!;
        return { a, b };
      })
      .filter(Boolean) as { a: Region; b: Region }[];
  }, []);

  return (
    <div className="space-y-4">
      {/* Map banner / progress */}
      <div className="flex flex-wrap items-center justify-between gap-3 panel rounded-xl px-4 py-3">
        <div>
          <h2 className="font-display text-lg font-bold text-white">Quest Atlas</h2>
          <p className="text-sm text-slate-400">Tap an unlocked region to begin a quest.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-slate-400">Quests done</div>
            <div className="text-sm font-bold text-white">
              {stats.done}/{stats.totalQuests}
            </div>
          </div>
          <div className="w-36 h-2 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-700"
              style={{ width: `${stats.pct}%` }}
            />
          </div>
          <div className="text-sm font-bold text-cyan-300 font-display">{stats.pct}%</div>
        </div>
      </div>

      {/* Stylized map canvas */}
      <div className="relative panel rounded-2xl overflow-hidden">
        <div className="absolute inset-0 hud-grid opacity-60" />
        {/* Glowing horizon */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full bg-violet-600/10 blur-3xl" />

        <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full">
          {/* Decorative compass */}
          <div className="absolute top-4 right-4 text-slate-600 animate-spin-slow">
            <Lucide.Compass className="w-8 h-8" />
          </div>
          <div className="absolute bottom-4 left-4 text-slate-600/80 text-[11px] font-display tracking-widest">
            SECTOR · A1 — FLUENCY FRONTIER
          </div>

          {/* SVG connecting paths */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 62">
            <defs>
              <linearGradient id="pathGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#f472b6" stopOpacity="0.7" />
              </linearGradient>
            </defs>
            {connections.map(({ a, b }, i) => (
              <line
                key={i}
                x1={a.pos.x}
                y1={a.pos.y}
                x2={b.pos.x}
                y2={b.pos.y}
                stroke="url(#pathGrad)"
                strokeWidth="0.4"
                strokeDasharray="1.2 1.2"
                strokeLinecap="round"
              />
            ))}
          </svg>

          {/* Region nodes */}
          {REGIONS.map((region) => {
            const unlocked = progress.unlockedRegions.includes(region.id);
            const done = region.quests.filter((q) => progress.completed[q.id] !== undefined).length;
            const total = region.quests.length;
            const Icon = Lucide[region.icon];
            const accentBg: Record<string, string> = {
              green: 'from-emerald-400 to-green-600 shadow-neon-green',
              amber: 'from-amber-400 to-orange-600 shadow-neon-amber',
              pink: 'from-pink-400 to-rose-600 shadow-neon-pink',
            };
            const accentText: Record<string, string> = {
              green: 'text-emerald-300',
              amber: 'text-amber-300',
              pink: 'text-pink-300',
            };
            return (
              <button
                key={region.id}
                disabled={!unlocked}
                onClick={() => {
                  if (unlocked) {
                    sfx.click();
                    onOpenRegion(region);
                  }
                }}
                style={{ left: `${region.pos.x}%`, top: `${region.pos.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none"
                aria-label={`${region.name} — ${unlocked ? 'unlocked' : 'locked'}`}
              >
                <div className={`relative ${unlocked ? 'animate-float-slow' : 'opacity-50 grayscale'}`}>
                  {/* Pulse ring for current/unlocked incomplete */}
                  {unlocked && done < total && (
                    <span className="absolute inset-0 rounded-full animate-pulse-ring" />
                  )}
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${accentBg[region.accent]} flex items-center justify-center transition-transform group-hover:scale-110 ${unlocked ? '' : 'cursor-not-allowed'}`}
                  >
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-ink-900" />
                  </div>
                  {!unlocked && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center">
                      <Lucide.Lock className="w-3 h-3 text-slate-300" />
                    </div>
                  )}
                </div>
                {/* Label */}
                <div className="mt-1.5 text-center min-w-[120px] -translate-x-1/2 absolute left-1/2">
                  <div className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">{region.name}</div>
                  <div className={`text-[10px] font-display tracking-wider uppercase ${accentText[region.accent]}`}>
                    {region.difficulty}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {done}/{total} quests
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
