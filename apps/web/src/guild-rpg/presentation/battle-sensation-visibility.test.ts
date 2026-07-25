import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from '../state/create-game-state';
import { guildRpgReducer } from '../state/game-reducer';
import { createBattleSensationModel } from './battle-sensation-model';

describe('playback battle sensation visibility', () => {
  it('does not expose a final boss phase before its event becomes visible', () => {
    const started = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    const state = {
      ...started,
      battle: {
        ...started.battle!,
        combo: {
          ...started.battle!.combo!,
          activatedBossPhaseIds: ['alpha-execution'],
        },
      },
    };

    const finalModel = createBattleSensationModel(state, GUILD_GAME_CONTENT);
    const hiddenModel = createBattleSensationModel(state, GUILD_GAME_CONTENT, {
      activatedBossPhaseIds: [],
    });

    expect(
      finalModel.enemies.find((enemy) => enemy.id === 'wolf_alpha')?.executionLabel,
    ).toBeDefined();
    expect(
      hiddenModel.enemies.find((enemy) => enemy.id === 'wolf_alpha')?.executionLabel,
    ).toBeUndefined();
  });
});
