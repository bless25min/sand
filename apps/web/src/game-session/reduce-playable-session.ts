import {
  GREYFANG_MATERIALS,
  HORNPLATE_SHIELD,
  HORNPLATE_SHIELD_RECIPE,
} from '@expedition/game-data';
import { craftEquipment, equipUnit, recoverLoot } from '@expedition/progression-core';
import {
  createSeededRandom,
  generateGreyfangLoot,
  resolveFixedOrder,
} from '@expedition/simulation-core';

import { createPlayableRematch } from './create-playable-rematch';
import { createPlayableSession } from './create-playable-session';
import type { PlayableSessionAction, PlayableSessionState } from './playable-session-types';

function withBattleResult(state: PlayableSessionState): PlayableSessionState {
  if (state.battle.outcome === 'VICTORY') {
    const lootFacts = state.battle.lootFacts;
    if (lootFacts === undefined) {
      throw new Error('victorious playable battle must provide loot facts');
    }
    return {
      ...state,
      phase: 'LOOT',
      army: state.battle.units,
      drops: generateGreyfangLoot({
        sourceId: state.battle.monsterGroup.id,
        defeatedWolves: lootFacts.defeatedWolves,
        defeatedHornedAlphas: lootFacts.defeatedHornedAlphas,
        position: state.battle.monsterGroup.position,
        random: createSeededRandom(`${state.seed}:loot`),
      }),
    };
  }

  if (state.battle.outcome === 'RETREATED' || state.battle.outcome === 'DEFEAT') {
    return { ...state, phase: 'BASE', army: state.battle.units };
  }

  return state;
}

export function reducePlayableSession(
  state: PlayableSessionState,
  action: PlayableSessionAction,
): PlayableSessionState {
  if (action.type === 'RESET_SESSION') return createPlayableSession(state.seed);

  if (action.type === 'SELECT_UNIT') {
    return state.battle.units.some((unit) => unit.id === action.unitId)
      ? { ...state, selectedUnitId: action.unitId }
      : state;
  }

  if (action.type === 'ISSUE_ORDER' && state.phase === 'BATTLE') {
    const order =
      action.action === 'CHANGE_FORMATION'
        ? {
            unitId: state.selectedUnitId,
            action: action.action,
            formation: action.formation,
          }
        : { unitId: state.selectedUnitId, action: action.action };
    return withBattleResult({
      ...state,
      previousBattle: state.battle,
      battle: resolveFixedOrder({
        battle: state.battle,
        order,
      }),
    });
  }

  if (action.type === 'RECOVER_LOOT' && state.phase === 'LOOT') {
    const recovery = recoverLoot({
      inventory: state.inventory,
      drops: state.drops,
      recoveryPosition: state.battle.monsterGroup.position,
      recoveryRadius: 3,
      materialDefinitions: GREYFANG_MATERIALS,
    });
    return {
      ...state,
      inventory: recovery.inventory,
      drops: recovery.remainingDrops,
      recoveredDropIds: [
        ...state.recoveredDropIds,
        ...recovery.recovered.map(({ dropId }) => dropId),
      ],
    };
  }

  if (action.type === 'RETURN_TO_BASE' && state.phase === 'LOOT') {
    return { ...state, phase: 'BASE' };
  }

  if (action.type === 'CRAFT_SHIELD' && state.phase === 'BASE') {
    const crafting = craftEquipment({
      inventory: state.inventory,
      recipe: HORNPLATE_SHIELD_RECIPE,
      equipmentInstanceId: `${state.seed}:hornplate-shield`,
    });
    return {
      ...state,
      inventory: crafting.inventory,
      craftedEquipment: crafting.equipmentInstance,
    };
  }

  if (
    action.type === 'EQUIP_SHIELD' &&
    state.phase === 'BASE' &&
    state.craftedEquipment !== undefined &&
    !state.shieldEquipped
  ) {
    const equipmentInstance = state.craftedEquipment;
    const army = state.army.map((unit) =>
      unit.id === 'ironwall-heavy'
        ? equipUnit({
            unit,
            equipmentInstance,
            definition: HORNPLATE_SHIELD,
          })
        : unit,
    );
    return { ...state, army, shieldEquipped: true };
  }

  if (action.type === 'START_REMATCH' && state.phase === 'BASE') {
    return createPlayableRematch(state);
  }

  return state;
}
