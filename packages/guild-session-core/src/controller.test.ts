import { describe, expect, it, vi } from 'vitest';

import {
  GUILD_PREFERENCES_KEY,
  GUILD_SAVE_KEY,
  createGuildSessionController,
  type GuildSavePort,
} from './index';

const memoryPort = (): GuildSavePort & { values: Map<string, string> } => {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
};

describe('Guild session controller', () => {
  it('loads, reduces, persists, and notifies through a platform-neutral port', () => {
    const storage = memoryPort();
    const controller = createGuildSessionController(storage);
    const listener = vi.fn();
    const unsubscribe = controller.subscribe(listener);

    const next = controller.dispatch({ type: 'NAVIGATE', page: 'skills' });

    expect(next).toBe(controller.getState());
    expect(next.page).toBe('skills');
    expect(listener).toHaveBeenCalledOnce();
    expect(storage.values.has(GUILD_SAVE_KEY)).toBe(true);
    expect(storage.values.has(GUILD_PREFERENCES_KEY)).toBe(true);

    unsubscribe();
    controller.dispatch({ type: 'NAVIGATE', page: 'equipment' });
    expect(listener).toHaveBeenCalledOnce();
  });

  it('does not write or notify when the reducer rejects an unavailable command', () => {
    const storage = memoryPort();
    const controller = createGuildSessionController(storage);
    const listener = vi.fn();
    controller.subscribe(listener);

    const state = controller.getState();
    const next = controller.dispatch({
      type: 'USE_SKILL',
      skillId: 'missing',
      targetId: 'missing',
    });

    expect(next).toBe(state);
    expect(listener).not.toHaveBeenCalled();
    expect(storage.values.size).toBe(0);
  });
});
