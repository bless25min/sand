import type { BattleEvent } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { createPlayableSession } from './create-playable-session';
import type { CommandFeedback } from './create-command-feedback';
import { createBattlefieldHud } from './create-battlefield-hud';

describe('createBattlefieldHud', () => {
  it('turns live battle state into player-facing tactical information', () => {
    const session = createPlayableSession();
    const model = createBattlefieldHud({
      battle: session.battle,
      selectedUnitId: 'pinewatch-archers',
      feedback: null,
    });

    expect(model.objective).toBe('擊潰灰牙狼群');
    expect(model.selected).toMatchObject({
      name: '松望弓兵團',
      role: '遠射',
      formation: '橫列',
      troops: 800,
      moralePercent: 100,
      cohesionPercent: 90,
    });
    expect(model.enemy).toMatchObject({
      name: '灰牙狼群',
      intent: session.battle.monsterGroup.behaviorState,
      troops: 1_200,
    });
    expect(model.enemy.intentLabel.length).toBeGreaterThan(0);
    expect(model.impact).toBeNull();
  });

  it('labels a ranged-volley impact without inventing battle results', () => {
    const session = createPlayableSession();
    const rangedEvent: BattleEvent = {
      id: 'volley:1',
      tick: 1,
      type: 'RANGED_VOLLEY_RESOLVED',
      sourceIds: ['pinewatch-archers'],
      targetIds: ['greyfang-pack'],
      causes: ['ATTACK', 'ARCHER_VOLLEY'],
      effects: { losses: 41 },
      visibility: 'PLAYER',
    };
    const feedback: CommandFeedback = {
      action: 'ATTACK',
      label: '攻擊',
      tone: 'impact',
      summary: '箭雨命中。',
      distanceMoved: 0,
      playerTroopLoss: 0,
      monsterTroopLoss: 41,
      playerMoraleDelta: 0,
      monsterMoraleDelta: -5,
    };
    const model = createBattlefieldHud({
      battle: {
        ...session.battle,
        tick: 1,
        events: [...session.battle.events, rangedEvent],
      },
      selectedUnitId: 'pinewatch-archers',
      feedback,
    });

    expect(model.impact).toEqual({
      kind: 'volley',
      label: '箭雨命中',
      playerLoss: 0,
      enemyLoss: 41,
    });
  });
});
