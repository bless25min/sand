import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from '../state/create-game-state';
import { guildRpgReducer } from '../state/game-reducer';
import { createBattleSensationModel } from './battle-sensation-model';

describe('battle sensation model', () => {
  it('connects build fantasy, signature route, forecast, enemy pressure, and execution target', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    state = guildRpgReducer(state, {
      type: 'APPEND_COMBO_CARD',
      cardId: 'brann_brace',
    });
    state = {
      ...state,
      battle: {
        ...state.battle!,
        selectedTargetId: 'wolf_alpha',
        units: state.battle!.units.map((unit) =>
          unit.id === 'wolf_alpha' ? { ...unit, gauge: 90 } : unit,
        ),
      },
    };

    const model = createBattleSensationModel(state, GUILD_GAME_CONTENT);
    const boss = model.enemies.find((enemy) => enemy.id === 'wolf_alpha')!;

    expect(model.build.name).toBe('反擊壁壘');
    expect(model.build.fantasy).toContain('盾牆');
    expect(model.signature.completedCardIds).toEqual(['brann_brace']);
    expect(model.signature.nextCard?.id).toBe('brann_riposte');
    expect(model.preview.eventCount).toBeGreaterThan(0);
    expect(boss.pressureLabel).toBe('攻勢爆發');
    expect(boss.predictedTargetName).toBe('布蘭');
    expect(boss.guardedByNames).toEqual(['灰牙斥候', '灰牙獵手']);
    expect(model.executionTarget?.label).toBe('處刑目標');
    expect(model.executionTarget?.name).toBe('灰牙首領');
  });
});
