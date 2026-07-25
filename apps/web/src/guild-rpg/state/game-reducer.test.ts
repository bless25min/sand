import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from './create-game-state';
import { guildRpgReducer } from './game-reducer';

describe('guild RPG reducer', () => {
  it('completes guild, battle, rewards, unlock, and replay as one loop', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });

    expect(state.screen).toBe('battle');

    for (let index = 0; index < 2_000 && state.screen === 'battle'; index += 1) {
      state = guildRpgReducer(state, { type: 'TICK', elapsedMs: 100 });
      if (state.battle?.pendingLeaderId) {
        state = guildRpgReducer(state, {
          type: 'USE_SKILL',
          skillId: 'focused_shot',
          targetId: state.battle.selectedTargetId!,
        });
      }
    }

    expect(state.screen).toBe('rewards');
    expect(state.rewards?.items).toHaveLength(2);
    expect(state.profile.questRecords.border_pack?.clears).toBe(1);

    const [kept, sold] = state.rewards!.items;
    state = guildRpgReducer(state, {
      type: 'CHOOSE_ITEM',
      itemId: kept!.id,
      choice: 'keep',
      adventurerId: 'lyra',
    });
    state = guildRpgReducer(state, {
      type: 'CHOOSE_ITEM',
      itemId: sold!.id,
      choice: 'sell',
      adventurerId: 'lyra',
    });

    expect(state.resolvedItemIds).toHaveLength(2);
    expect(state.profile.inventory).toHaveLength(1);

    state = guildRpgReducer(state, { type: 'RETURN_GUILD' });
    expect(state.screen).toBe('guild');
    expect(state.profile.unlockedQuestIds).toContain('abandoned_mine');

    const replay = guildRpgReducer(state, { type: 'START_QUEST', questId: 'border_pack' });
    expect(replay.screen).toBe('battle');
    expect(replay.battle?.seed).not.toBe('border_pack-1');
  });

  it('selects targets, toggles auto, changes display speed, and returns after defeat', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    const secondEnemy = state.battle!.units.filter((unit) => unit.side === 'enemies')[1]!;

    state = guildRpgReducer(state, { type: 'SELECT_TARGET', targetId: secondEnemy.id });
    state = guildRpgReducer(state, { type: 'TOGGLE_AUTO' });
    state = guildRpgReducer(state, { type: 'SET_SPEED', speed: 2 });

    expect(state.battle?.selectedTargetId).toBe(secondEnemy.id);
    expect(state.battle?.leaderAuto).toBe(true);
    expect(state.speed).toBe(2);

    state = { ...state, battle: { ...state.battle!, status: 'defeat' } };
    state = guildRpgReducer(state, { type: 'RETURN_GUILD' });
    expect(state.screen).toBe('guild');
  });
});
