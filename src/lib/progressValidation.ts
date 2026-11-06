import type { PlayerProgress } from '@/hooks/useGameState';

const regionIds = new Set(['woods', 'metro', 'spires']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

function isScoreMap(value: unknown): value is Record<string, number> {
  return isRecord(value)
    && Object.entries(value).every(([key, score]) =>
      key.length > 0 && key.length <= 64 && isNonNegativeInteger(score));
}

export function isPlayerProgress(value: unknown): value is PlayerProgress {
  return isRecord(value)
    && isNonNegativeInteger(value.xp)
    && isNonNegativeInteger(value.gems)
    && isNonNegativeInteger(value.streak)
    && isScoreMap(value.completed)
    && Array.isArray(value.unlockedRegions)
    && value.unlockedRegions.every((region) => typeof region === 'string' && regionIds.has(region))
    && isScoreMap(value.voiceBest)
    && isNonNegativeInteger(value.quizWins)
    && isNonNegativeInteger(value.quizGames)
    && isNonNegativeInteger(value.quizBestScore)
    && typeof value.soundOn === 'boolean';
}
