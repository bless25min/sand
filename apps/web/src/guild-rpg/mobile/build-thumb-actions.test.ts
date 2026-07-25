import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { describe, expect, it, vi } from 'vitest';

import { createBuildThumbActions } from './build-thumb-actions';

describe('mobile Build actions', () => {
  it('wraps engine browsing and activates the focused Build from the primary slot', () => {
    const dispatch = vi.fn();
    let index = 0;
    const actions = createBuildThumbActions({
      build: GUILD_GAME_CONTENT.builds[1]!,
      buildCount: GUILD_GAME_CONTENT.builds.length,
      activeBuildId: 'retaliation',
      dispatch,
      setBuildIndex: (update) => {
        index = typeof update === 'function' ? update(index) : update;
      },
    });

    actions.find((action) => action.id === 'previous-build')?.onPress();
    expect(index).toBe(2);
    actions.find((action) => action.id === 'next-build')?.onPress();
    expect(index).toBe(0);
    const activate = actions.find((action) => action.id === 'activate-build');
    expect(activate).toMatchObject({ slot: 'primary', tone: 'primary', disabled: false });
    activate?.onPress();
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_BUILD', buildId: 'ricochet' });
    actions.find((action) => action.id === 'settings')?.onPress();
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_SETTINGS_OPEN', open: true });
  });

  it('keeps the active Build visibly selected and disables redundant activation', () => {
    const build = GUILD_GAME_CONTENT.builds[0]!;
    const actions = createBuildThumbActions({
      build,
      buildCount: GUILD_GAME_CONTENT.builds.length,
      activeBuildId: build.id,
      dispatch: vi.fn(),
      setBuildIndex: vi.fn(),
    });

    expect(actions.find((action) => action.id === 'activate-build')).toMatchObject({
      disabled: true,
      selected: true,
      label: '目前 Build',
    });
  });
});
