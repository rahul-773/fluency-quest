import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import type { TabId } from '@/components/Header';
import Tabs from '@/components/Tabs';
import WorldTab from '@/components/world/WorldTab';
import VoiceTab from '@/components/voice/VoiceTab';
import QuizTab from '@/components/quiz/QuizTab';
import ProfileTab from '@/components/profile/ProfileTab';
import { useGameState } from '@/hooks/useGameState';
import { setMuted } from '@/lib/sound';
import { useAuth } from '@/hooks/useAuth';

export default function App() {
  const auth = useAuth();
  const state = useGameState(auth.user?.id ?? null);
  const [tab, setTab] = useState<TabId>('world');

  // sync global sound mute with user setting
  useEffect(() => {
    setMuted(!state.progress.soundOn);
  }, [state.progress.soundOn]);

  return (
    <div className="min-h-screen bg-app text-slate-100">
      <Header state={state} activeTab={tab} onToggleSound={state.toggleSound} />
      <Tabs active={tab} onChange={setTab} />

      {!auth.configured && (
        <div className="mx-auto mt-4 flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
          <p className="text-sm text-amber-200">
            Cloud accounts are not configured. Progress is saved only in this browser.
          </p>
          <button type="button" onClick={() => setTab('profile')}
            className="rounded-lg border border-amber-300/30 px-3 py-1.5 text-sm text-amber-100 hover:bg-amber-300/10">
            Account setup
          </button>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        {tab === 'world' && <WorldTab state={state} />}
        {tab === 'voice' && <VoiceTab state={state} />}
        {tab === 'quiz' && <QuizTab state={state} />}
        {tab === 'profile' && <ProfileTab state={state} auth={auth} onReset={state.resetProgress} />}
      </main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center">
        <p className="text-xs text-slate-600">
          FluencyQuest · Learn through quests, voice practice, and solo quiz rounds. XP, gems, and rankings are local progress indicators only; no prizes or payouts are processed without server-side validation.
        </p>
      </footer>
    </div>
  );
}
