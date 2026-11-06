import { Map, Mic, Swords, User } from 'lucide-react';
import type { TabId } from '@/components/Header';
import { sfx } from '@/lib/sound';

interface TabsProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; short: string; icon: typeof Map }[] = [
  { id: 'world', label: 'World Map', short: 'Map', icon: Map },
  { id: 'voice', label: 'Live Voice Roleplay', short: 'Voice', icon: Mic },
  { id: 'quiz', label: 'Quiz Arena', short: 'Arena', icon: Swords },
  { id: 'profile', label: 'Profile', short: 'Profile', icon: User },
];

export default function Tabs({ active, onChange }: TabsProps) {
  return (
    <nav className="sticky top-[104px] z-30 bg-ink-900/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-6xl mx-auto px-2 sm:px-6">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((t) => {
            const isActive = active === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => {
                  onChange(t.id);
                  sfx.click();
                }}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition ${
                  isActive ? 'text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : ''}`} />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.short}</span>
                {isActive && (
                  <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 shadow-neon" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
