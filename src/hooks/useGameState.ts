import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadRemoteProgress, saveRemoteProgress } from '@/lib/progressApi';
import { supabase } from '@/lib/supabaseClient';
import { isPlayerProgress } from '@/lib/progressValidation';

export const STORAGE_KEY = 'fluencyquest.save.v1';

export interface PlayerProgress {
  xp: number;
  gems: number;
  streak: number;
  // completed quest ids -> last awarded xp
  completed: Record<string, number>;
  // unlocked regions
  unlockedRegions: RegionId[];
  // per-scenario best score
  voiceBest: Record<string, number>;
  // quiz stats
  quizWins: number;
  quizGames: number;
  quizBestScore: number;
  // settings
  soundOn: boolean;
}

import type { RegionId } from '@/lib/quests';

export const DEFAULT_PROGRESS: PlayerProgress = {
  xp: 450,
  gems: 120,
  streak: 5,
  completed: {},
  unlockedRegions: ['woods', 'metro', 'spires'],
  voiceBest: {},
  quizWins: 0,
  quizGames: 0,
  quizBestScore: 0,
  soundOn: true,
};

export function levelFromXp(xp: number): { level: number; title: string; next: number; into: number; progress: number } {
  const thresholds = [
    { xp: 0, title: 'Novice', level: 0 },
    { xp: 200, title: 'Apprentice', level: 1 },
    { xp: 450, title: 'Wayfarer', level: 2 },
    { xp: 750, title: 'Trailblazer', level: 3 },
    { xp: 1050, title: 'Linguist', level: 4 },
    { xp: 1400, title: 'Scholar', level: 5 },
    { xp: 1800, title: 'Eloquence Master', level: 6 },
  ];
  let current = thresholds[0];
  let next = thresholds[1];
  for (let i = 0; i < thresholds.length - 1; i++) {
    if (xp >= thresholds[i].xp && xp < thresholds[i + 1].xp) {
      current = thresholds[i];
      next = thresholds[i + 1];
      break;
    }
    if (xp >= thresholds[thresholds.length - 1].xp) {
      current = thresholds[thresholds.length - 1];
      next = { xp: thresholds[thresholds.length - 1].xp, title: 'Max', level: thresholds[thresholds.length - 1].level };
    }
  }
  const into = Math.max(0, xp - current.xp);
  const span = Math.max(1, next.xp - current.xp);
  const progress = next.title === 'Max' ? 100 : Math.min(100, Math.round((into / span) * 100));
  return { level: current.level, title: current.title, next: next.xp, into, progress };
}

export function cefrLevel(xp: number): string {
  if (xp < 200) return 'A2';
  if (xp < 750) return 'B1';
  if (xp < 1400) return 'B2';
  if (xp < 1800) return 'C1';
  return 'C2';
}

export type ProgressSyncStatus = 'local' | 'loading' | 'syncing' | 'synced' | 'error';

export function useGameState(userId: string | null = null) {
  const [progress, setProgress] = useState<PlayerProgress>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isPlayerProgress(parsed)) return parsed;
        console.error('Saved FluencyQuest progress has an invalid shape; using a fresh save.');
      }
    } catch (error) {
      console.error('Unable to read saved FluencyQuest progress from this browser.', error);
    }
    return DEFAULT_PROGRESS;
  });
  const [readyUserId, setReadyUserId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<ProgressSyncStatus>(userId && supabase ? 'loading' : 'local');
  const [syncAttempt, setSyncAttempt] = useState(0);
  const changeVersionRef = useRef(0);

  useEffect(() => {
    if (!userId || !supabase) {
      setReadyUserId(null);
      setSyncStatus('local');
      return;
    }

    let cancelled = false;
    const activeUserId = userId;
    const changeVersion = changeVersionRef.current;
    setSyncStatus('loading');

    async function load() {
      let loaded = false;
      try {
        const remoteProgress = await loadRemoteProgress(activeUserId);
        if (cancelled) return;
        loaded = true;
        if (remoteProgress && changeVersionRef.current === changeVersion) {
          setProgress(remoteProgress);
        }
      } catch (error) {
        console.error('Unable to load saved progress from Supabase.', error);
        if (!cancelled) setSyncStatus('error');
      } finally {
        if (!cancelled) {
          if (loaded) setReadyUserId(activeUserId);
          setSyncStatus((status) => status === 'error' ? status : 'synced');
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [syncAttempt, userId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      console.error('Unable to save FluencyQuest progress in this browser.');
    }
  }, [progress]);

  useEffect(() => {
    if (!userId || readyUserId !== userId || !supabase) return;
    let cancelled = false;
    setSyncStatus('syncing');
    void saveRemoteProgress(userId, progress).then(() => {
      if (!cancelled) setSyncStatus('synced');
    }).catch((error: unknown) => {
      console.error('Unable to sync saved progress with Supabase.', error);
      if (!cancelled) setSyncStatus('error');
    });
    return () => {
      cancelled = true;
    };
  }, [progress, readyUserId, userId]);

  const awardQuestXp = useCallback((questId: string, xp: number) => {
    changeVersionRef.current += 1;
    setProgress((p) => {
      if (p.completed[questId] !== undefined) return p; // no re-award
      return {
        ...p,
        xp: p.xp + xp,
        gems: p.gems + 5,
        completed: { ...p.completed, [questId]: xp },
      };
    });
  }, []);

  const recordVoiceScore = useCallback((scenarioId: string, score: number) => {
    changeVersionRef.current += 1;
    setProgress((p) => {
      const prev = p.voiceBest[scenarioId] ?? 0;
      return {
        ...p,
        voiceBest: { ...p.voiceBest, [scenarioId]: Math.max(prev, score) },
        gems: p.gems + Math.max(0, Math.round(score / 4)),
      };
    });
  }, []);

  const recordQuizResult = useCallback((won: boolean, score: number) => {
    changeVersionRef.current += 1;
    setProgress((p) => ({
      ...p,
      quizGames: p.quizGames + 1,
      quizWins: p.quizWins + (won ? 1 : 0),
      quizBestScore: Math.max(p.quizBestScore, score),
      xp: p.xp + (won ? 60 : 20),
      gems: p.gems + (won ? 10 : 3),
    }));
  }, []);

  const toggleSound = useCallback(() => {
    changeVersionRef.current += 1;
    setProgress((p) => ({ ...p, soundOn: !p.soundOn }));
  }, []);

  const resetProgress = useCallback(() => {
    changeVersionRef.current += 1;
    setProgress(DEFAULT_PROGRESS);
  }, []);

  const retrySync = useCallback(() => {
    setReadyUserId(null);
    setSyncStatus('loading');
    setSyncAttempt((attempt) => attempt + 1);
  }, []);

  const levelInfo = useMemo(() => levelFromXp(progress.xp), [progress.xp]);

  return {
    progress,
    syncStatus,
    levelInfo,
    cefr: cefrLevel(progress.xp),
    awardQuestXp,
    recordVoiceScore,
    recordQuizResult,
    toggleSound,
    resetProgress,
    retrySync,
  };
}

export type GameState = ReturnType<typeof useGameState>;
