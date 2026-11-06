import type { PlayerProgress } from '@/hooks/useGameState';
import type { Json } from '@/lib/database.types';
import { supabase } from '@/lib/supabaseClient';
import { isPlayerProgress } from '@/lib/progressValidation';

export async function loadRemoteProgress(userId: string): Promise<PlayerProgress | null> {
  if (!supabase) throw new Error('Cloud progress is not configured.');
  const { data, error } = await supabase
    .from('player_progress')
    .select('progress')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  if (!isPlayerProgress(data.progress)) {
    throw new Error('The saved progress data is invalid. It was not loaded.');
  }
  return data.progress;
}

export async function saveRemoteProgress(userId: string, progress: PlayerProgress): Promise<void> {
  if (!supabase) throw new Error('Cloud progress is not configured.');
  const progressData: Json = {
    xp: progress.xp,
    gems: progress.gems,
    streak: progress.streak,
    completed: progress.completed,
    unlockedRegions: progress.unlockedRegions,
    voiceBest: progress.voiceBest,
    quizWins: progress.quizWins,
    quizGames: progress.quizGames,
    quizBestScore: progress.quizBestScore,
    soundOn: progress.soundOn,
  };
  const { error } = await supabase
    .from('player_progress')
    .upsert(
      { user_id: userId, progress: progressData },
      { onConflict: 'user_id' },
    );

  if (error) throw error;
}
