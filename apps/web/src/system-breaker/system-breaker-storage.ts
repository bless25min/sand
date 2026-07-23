import type { SystemFragment } from '@expedition/shared-types';

const STORAGE_KEY = 'system-breaker-fragment';

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function loadFragment(storage: StoragePort): SystemFragment | undefined {
  try {
    const value = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null') as Partial<SystemFragment>;
    if (
      value.version !== 1 ||
      typeof value.moduleId !== 'string' ||
      typeof value.name !== 'string' ||
      typeof value.bonus !== 'number'
    )
      return undefined;
    return value as SystemFragment;
  } catch {
    return undefined;
  }
}

export function saveFragment(fragment: SystemFragment, storage: StoragePort): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(fragment));
}
