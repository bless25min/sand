import type { HuntRewards } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from './create-game-state';
import { guildRpgReducer } from './game-reducer';

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

describe('guild RPG reducer', () => {
  it('switches the active build only during guild preparation', () => {
    const initial = createGuildRpgState();
    const selected = guildRpgReducer(initial, {
      type: 'SET_BUILD',
      buildId: 'ricochet',
    });
    const invalid = guildRpgReducer(selected, {
      type: 'SET_BUILD',
      buildId: 'missing',
    });

    expect(selected.profile.selectedBuildId).toBe('ricochet');
    expect(invalid).toBe(selected);
    expect(
      guildRpgReducer(guildRpgReducer(selected, { type: 'START_QUEST', questId: 'border_pack' }), {
        type: 'SET_BUILD',
        buildId: 'retaliation',
      }).profile.selectedBuildId,
    ).toBe('ricochet');
  });

  it('composes and releases one complete command into rewards and replay', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });

    expect(state.screen).toBe('battle');
    expect(state.battle?.combo?.phase).toBe('composing');
    expect(state.battle?.combo?.availableCardIds).toHaveLength(12);

    for (const cardId of FULL_WIPE_COMMAND) {
      state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId });
    }
    expect(state.battle?.combo?.draft.cardIds).toEqual(FULL_WIPE_COMMAND);

    state = guildRpgReducer(state, { type: 'RELEASE_COMBO' });
    expect(state.screen).toBe('rewards');
    expect(state.rewards?.items.length).toBeGreaterThan(2);
    expect(state.rewards).toMatchObject({
      successful: true,
      axes: {
        chainWipe: true,
        annihilation: true,
        perfectAnnihilation: true,
      },
    });
    const huntRewards = state.rewards as HuntRewards;
    expect(huntRewards.axes.sharedOverflow).toBeGreaterThan(0);
    expect(
      huntRewards.items.every((item) => item.qualityScore >= huntRewards.axes.sharedOverflow),
    ).toBe(true);
    expect(state.profile.questRecords.border_pack?.clears).toBe(1);

    const [kept, ...sold] = state.rewards!.items;
    for (const [index, item] of [kept!, ...sold].entries()) {
      state = guildRpgReducer(state, {
        type: 'CHOOSE_ITEM',
        itemId: item.id,
        choice: index === 0 ? 'keep' : 'sell',
        adventurerId: 'lyra',
      });
    }

    expect(state.resolvedItemIds).toHaveLength(state.rewards!.items.length);
    expect(state.profile.inventory).toHaveLength(1);

    state = guildRpgReducer(state, { type: 'RETURN_GUILD' });
    expect(state.screen).toBe('guild');
    expect(state.profile.unlockedQuestIds).toContain('abandoned_mine');

    const replay = guildRpgReducer(state, { type: 'START_QUEST', questId: 'border_pack' });
    expect(replay.screen).toBe('battle');
    expect(replay.battle?.seed).not.toBe('border_pack-1');
    expect(replay.battle?.combo?.draft.cardIds).toEqual([]);
  });

  it('preserves the draft while enemies pressure composition and supports undo', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    const secondEnemy = state.battle!.units.filter((unit) => unit.side === 'enemies')[1]!;
    const heroHp = state.battle!.units.find((unit) => unit.side === 'heroes')!.currentHp;

    state = guildRpgReducer(state, { type: 'SELECT_TARGET', targetId: secondEnemy.id });
    state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId: 'brann_brace' });
    state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId: 'brann_riposte' });
    state = guildRpgReducer(state, { type: 'UNDO_COMBO_CARD' });
    state = guildRpgReducer(state, { type: 'SET_SPEED', speed: 2 });
    state = guildRpgReducer(state, { type: 'TICK', elapsedMs: 13_000 });

    expect(state.battle?.selectedTargetId).toBe(secondEnemy.id);
    expect(state.battle?.combo?.draft.cardIds).toEqual(['brann_brace']);
    expect(state.battle?.units.find((unit) => unit.side === 'heroes')!.currentHp).toBeLessThan(
      heroHp,
    );
    expect(state.battle?.combo?.events.at(-1)?.kind).toBe('enemy_pressure');
    expect(state.speed).toBe(2);

    state = { ...state, battle: { ...state.battle!, status: 'defeat' } };
    state = guildRpgReducer(state, { type: 'RETURN_GUILD' });
    expect(state.screen).toBe('guild');
  });

  it('moves a failed hunt to material-only rewards', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    state = {
      ...state,
      battle: {
        ...state.battle!,
        status: 'defeat',
        units: state.battle!.units.map((unit) =>
          unit.side === 'heroes' ? { ...unit, currentHp: 0 } : unit,
        ),
      },
    };
    state = guildRpgReducer(state, { type: 'TICK', elapsedMs: 0 });

    expect(state.screen).toBe('rewards');
    expect(state.rewards?.items).toEqual([]);
    expect(state.rewards?.materials?.length).toBeGreaterThan(0);
  });
});
