export type GuildMobilePage = 'quest' | 'party' | 'inventory';

export function wrapThumbIndex(index: number, length: number, delta: -1 | 1): number {
  if (length <= 0) return 0;
  return (((index + delta) % length) + length) % length;
}

export function pageSlice<T>(items: readonly T[], page: number, pageSize: number): readonly T[] {
  if (page < 0 || pageSize <= 0) return [];
  const start = Math.trunc(page) * Math.trunc(pageSize);
  return items.slice(start, start + Math.trunc(pageSize));
}
