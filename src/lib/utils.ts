// Minimal shuffling helpers (self-contained, no deps).
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
