import { describe, expect, it } from 'vitest';

import { createPlayableSession } from './create-playable-session';
import { reducePlayableSession } from './reduce-playable-session';
import type { PlayableSessionState } from './playable-session-types';

function winFirstBattle(source = createPlayableSession()): PlayableSessionState {
  let state = source;

  for (let turn = 0; turn < 12 && state.phase === 'BATTLE'; turn += 1) {
    state = reducePlayableSession(state, { type: 'ISSUE_ORDER', action: 'ATTACK' });
  }

  return state;
}

describe('playable expedition session', () => {
  it('starts with four selectable units and a live Greyfang battle', () => {
    const state = createPlayableSession();

    expect(state.phase).toBe('BATTLE');
    expect(state.battleNumber).toBe(1);
    expect(state.battle.units).toHaveLength(4);
    expect(state.selectedUnitId).toBe('ironwall-heavy');
    expect(state.battle.monsterGroup.definitionId).toBe('greyfang-wolf');
  });

  it('routes a fixed order through the deterministic battle core', () => {
    const source = createPlayableSession();
    const state = reducePlayableSession(source, { type: 'ISSUE_ORDER', action: 'ADVANCE' });

    expect(source.battle.tick).toBe(0);
    expect(source.previousBattle).toBeUndefined();
    expect(state.previousBattle).toEqual(source.battle);
    expect(state.battle.tick).toBe(1);
    expect(state.battle.units[0]?.position).not.toEqual(source.battle.units[0]?.position);
  });

  it('turns a victory into positioned recoverable loot', () => {
    const state = winFirstBattle();

    expect(state.phase).toBe('LOOT');
    expect(state.battle.outcome).toBe('VICTORY');
    expect(state.drops.map((drop) => drop.materialId)).toEqual([
      'WOLF_PELT',
      'MONSTER_FANG',
      'HORN_PLATE',
    ]);
  });

  it('derives loot from the simulated defeated pack instead of fixed Web counts', () => {
    const source = createPlayableSession('single-wolf-loot');
    const selected = source.battle.units[0];
    if (selected === undefined) throw new Error('test requires a selected unit');

    let state: PlayableSessionState = {
      ...source,
      battle: {
        ...source.battle,
        monsterGroup: {
          ...source.battle.monsterGroup,
          troopCount: 1,
          initialTroopCount: 1,
          position: { ...selected.position },
        },
      },
    };
    for (let turn = 0; turn < 10 && state.phase === 'BATTLE'; turn += 1) {
      state = reducePlayableSession(state, { type: 'ISSUE_ORDER', action: 'ATTACK' });
    }

    expect(state.phase).toBe('LOOT');
    expect(state.drops.map((drop) => drop.materialId)).toEqual(['HORN_PLATE']);
  });

  it('lets the player recover, craft, equip, and enter a stronger rematch', () => {
    let state = winFirstBattle();
    expect(state.battle.lootFacts).toEqual({
      defeatedWolves: 24,
      defeatedHornedAlphas: 1,
    });
    state = reducePlayableSession(state, { type: 'RECOVER_LOOT' });
    expect(
      state.inventory.stacks.find((stack) => stack.materialId === 'MONSTER_FANG')?.quantity,
    ).toBeGreaterThanOrEqual(6);
    state = reducePlayableSession(state, { type: 'RETURN_TO_BASE' });
    state = reducePlayableSession(state, { type: 'CRAFT_SHIELD' });
    state = reducePlayableSession(state, { type: 'EQUIP_SHIELD' });

    const equippedHeavy = state.army.find((unit) => unit.id === 'ironwall-heavy');
    const originalHeavy = createPlayableSession().army.find((unit) => unit.id === 'ironwall-heavy');
    expect(state.phase).toBe('BASE');
    expect(state.craftedEquipment?.definitionId).toBe('hornplate-heavy-shield');
    expect(equippedHeavy?.appearanceIds).toContain('HORNPLATE_SHIELD');
    expect(equippedHeavy?.frontalDefense).toBeGreaterThan(originalHeavy?.frontalDefense ?? 0);
    expect(equippedHeavy?.mobility).toBeLessThan(originalHeavy?.mobility ?? 0);

    state = reducePlayableSession(state, { type: 'START_REMATCH' });

    expect(state.phase).toBe('BATTLE');
    expect(state.battleNumber).toBe(2);
    expect(state.battle.monsterGroup.initialTroopCount).toBeGreaterThan(1_200);
    expect(state.battle.units[0]?.appearanceIds).toContain('HORNPLATE_SHIELD');
    expect(state.recoveredDropIds).toEqual([]);
    expect(state.previousBattle).toBeUndefined();
  });

  it('resets the complete session to the same seed and initial state', () => {
    const progressed = reducePlayableSession(createPlayableSession(), {
      type: 'ISSUE_ORDER',
      action: 'ADVANCE',
    });

    expect(reducePlayableSession(progressed, { type: 'RESET_SESSION' })).toEqual(
      createPlayableSession(),
    );
  });
});
