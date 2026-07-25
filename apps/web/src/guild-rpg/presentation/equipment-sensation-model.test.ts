import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from '../state/create-game-state';
import { guildRpgReducer, type GuildRpgState } from '../state/game-reducer';
import { createEquipmentSensationModel } from './equipment-sensation-model';

const FULL_WIPE_COMMAND = [
  'brann_brace',
  'brann_riposte',
  'brann_sweep',
  'lyra_mark',
  'lyra_piercing_shot',
  'lyra_ricochet',
  'elin_prayer',
  'elin_overflow_bolt',
  'elin_radiant_burst',
] as const;

function reachRewards(): GuildRpgState {
  let state = guildRpgReducer(createGuildRpgState(), {
    type: 'START_QUEST',
    questId: 'border_pack',
  });
  for (const cardId of FULL_WIPE_COMMAND) {
    state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId });
  }
  state = guildRpgReducer(state, { type: 'RELEASE_COMBO' });
  state = guildRpgReducer(state, { type: 'ADVANCE_PLAYBACK', count: 1_000 });
  return guildRpgReducer(state, { type: 'COMPLETE_PLAYBACK' });
}

describe('equipment sensation model', () => {
  it('explains the enemy source, matching build, rule node, best owner, and full stat diff', () => {
    const state = reachRewards();
    const item = state.rewards!.items.find((candidate) => candidate.baseId === 'scout_charm')!;
    const model = createEquipmentSensationModel(item, state.profile, GUILD_GAME_CONTENT);

    expect(model.sourceEnemyName).toBe('灰牙斥候');
    expect(model.recommendedBuildNames).toEqual(['殲滅彈射']);
    expect(model.rules).toEqual([
      expect.objectContaining({ name: '長弓折射', description: expect.stringContaining('彈射') }),
    ]);
    expect(model.bestAdventurer).toMatchObject({ id: 'lyra', name: '萊拉' });
    expect(model.comparisons).toHaveLength(3);
    expect(model.comparisons.find((entry) => entry.adventurerId === 'lyra')?.statDiff).toEqual(
      expect.objectContaining({ speed: expect.any(Number) }),
    );

    const legacyItem = { ...item } as Record<string, unknown>;
    delete legacyItem.recommendedBuildIds;
    expect(
      createEquipmentSensationModel(
        legacyItem as unknown as typeof item,
        state.profile,
        GUILD_GAME_CONTENT,
      ).recommendedBuildNames,
    ).toEqual([]);
  });
});
