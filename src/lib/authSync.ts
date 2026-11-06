import type { PlayerProgress } from '@/hooks/useGameState';
import { isPlayerProgress } from '@/lib/progressValidation';
import { loadRemoteProgress, saveRemoteProgress } from '@/lib/progressApi';
import { supabase } from '@/lib/supabaseClient';

export const GUEST_PROGRESS_STORAGE_KEY = 'fluencyquest.save.v1';

export function getGuestProgress(): PlayerProgress | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(GUEST_PROGRESS_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isPlayerProgress(parsed)) {
      console.warn('Guest progress has an invalid shape; it was not migrated.');
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn('Unable to read guest progress for migration.', error);
    return null;
  }
}

export function clearGuestProgress(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(GUEST_PROGRESS_STORAGE_KEY);
}

export async function syncGuestProgressToAccount(userId: string): Promise<boolean> {
  if (!userId || !supabase) return false;

  const progress = getGuestProgress();
  if (!progress) return false;

  try {
    const accountProgress = await loadRemoteProgress(userId);
    if (accountProgress) return false;

    await saveRemoteProgress(userId, progress);
    clearGuestProgress();
    return true;
  } catch (error) {
    console.warn('Guest migration failed; keeping local progress on this device.', error);
    return false;
  }
}
