import { describe, expect, it } from 'vitest';

import { createCommandFeedback } from './create-command-feedback';
import { createPlayableSession } from './create-playable-session';
import { reducePlayableSession } from './reduce-playable-session';

function issue(action: 'ADVANCE' | 'HOLD' | 'ATTACK' | 'RETREAT') {
  const previous = createPlayableSession();
  const current = reducePlayableSession(previous, { type: 'ISSUE_ORDER', action });

  return createCommandFeedback({
    previousBattle: previous.battle,
    battle: current.battle,
    selectedUnitId: previous.selectedUnitId,
  });
}

describe('createCommandFeedback', () => {
  it('returns no feedback before the first order', () => {
    const state = createPlayableSession();

    expect(
      createCommandFeedback({
        battle: state.battle,
        selectedUnitId: state.selectedUnitId,
      }),
    ).toBeNull();
  });

  it('describes advance with a measured movement result', () => {
    const feedback = issue('ADVANCE');

    expect(feedback).toMatchObject({
      action: 'ADVANCE',
      label: '推進',
      tone: 'advance',
      playerTroopLoss: 0,
      monsterTroopLoss: 0,
    });
    expect(feedback?.distanceMoved).toBeGreaterThan(0);
    expect(feedback?.summary).toContain('推進');
  });

  it('distinguishes hold without inventing player movement', () => {
    const feedback = issue('HOLD');

    expect(feedback).toMatchObject({
      action: 'HOLD',
      label: '固守',
      tone: 'hold',
      distanceMoved: 0,
    });
    expect(feedback?.summary).toContain('固守');
  });

  it('reports formation changes by their new formation', () => {
    const previous = createPlayableSession();
    const current = reducePlayableSession(previous, {
      type: 'ISSUE_ORDER',
      action: 'CHANGE_FORMATION',
      formation: 'LINE',
    });
    const feedback = createCommandFeedback({
      previousBattle: previous.battle,
      battle: current.battle,
      selectedUnitId: previous.selectedUnitId,
    });

    expect(feedback).toMatchObject({
      action: 'CHANGE_FORMATION',
      label: '變換陣形',
      tone: 'formation',
      formation: 'LINE',
    });
    expect(feedback?.summary).toContain('橫列陣');
  });

  it('reports retreat as a distinct terminal action', () => {
    expect(issue('RETREAT')).toMatchObject({
      action: 'RETREAT',
      label: '撤退',
      tone: 'retreat',
      summary: expect.stringContaining('撤離'),
    });
  });

  it('turns an attack with losses into impact feedback and exact deltas', () => {
    const source = createPlayableSession();
    const previousUnit = source.battle.units[0];
    if (previousUnit === undefined) throw new Error('test requires one player unit');
    const battle = {
      ...source.battle,
      tick: 1,
      lastOrder: { unitId: previousUnit.id, action: 'ATTACK' } as const,
      units: [
        {
          ...previousUnit,
          troopCount: previousUnit.troopCount - 20,
          morale: previousUnit.morale - 0.04,
        },
        ...source.battle.units.slice(1),
      ],
      monsterGroup: {
        ...source.battle.monsterGroup,
        troopCount: source.battle.monsterGroup.troopCount - 100,
        morale: source.battle.monsterGroup.morale - 0.15,
      },
    };

    expect(
      createCommandFeedback({
        previousBattle: source.battle,
        battle,
        selectedUnitId: previousUnit.id,
      }),
    ).toMatchObject({
      action: 'ATTACK',
      label: '攻擊',
      tone: 'impact',
      playerTroopLoss: 20,
      monsterTroopLoss: 100,
      playerMoraleDelta: -4,
      monsterMoraleDelta: -15,
      summary: expect.stringContaining('灰牙 -100'),
    });
  });
});
