import { describe, expect, it } from 'vitest';

import type { SystemFragment } from '@expedition/shared-types';

import { loadFragment, saveFragment, type StoragePort } from './system-breaker-storage';

function createMemoryStorage(): StoragePort {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe('system breaker fragment storage', () => {
  it('stores one valid fragment and ignores malformed storage', () => {
    const storage = createMemoryStorage();
    const fragment: SystemFragment = {
      version: 1,
      moduleId: 'module-1',
      name: '脈衝核心',
      bonus: 1,
    };

    saveFragment(fragment, storage);
    expect(loadFragment(storage)).toEqual(fragment);
    storage.setItem('system-breaker-fragment', '{"version":9}');
    expect(loadFragment(storage)).toBeUndefined();
  });
});
