import {
  GREYFANG_MATERIALS,
  HORNPLATE_SHIELD,
  HORNPLATE_SHIELD_RECIPE,
} from '@expedition/game-data';
import {
  resolveEquipmentVisualStyle,
  type VisualStyle,
  type VisualUnitSource,
} from '@expedition/pixi-renderer';
import {
  applyRetreatLoss,
  craftEquipment,
  createEmptyInventory,
  equipUnit,
  recoverLoot,
  type RecoveredLoot,
} from '@expedition/progression-core';
import type {
  ContactZone,
  EquipmentInstance,
  InventoryStack,
  LootDrop,
  UnitState,
} from '@expedition/shared-types';
import {
  calculateLocalPressure,
  calculateMovementStep,
  createSeededRandom,
  createUnitCombatSnapshot,
  generateGreyfangLoot,
  type CombatSideSnapshot,
} from '@expedition/simulation-core';

interface LoopBattleMetrics {
  readonly frontalDefense: number;
  readonly mobility: number;
  readonly equipmentWeight: number;
  readonly defendingPressure: number;
  readonly distanceMoved: number;
  readonly visualStyle: VisualStyle;
}

export interface MvpLoopSnapshot {
  readonly drops: readonly LootDrop[];
  readonly recovered: readonly RecoveredLoot[];
  readonly remainingDrops: readonly LootDrop[];
  readonly inventoryStacks: readonly InventoryStack[];
  readonly craftedEquipment: EquipmentInstance;
  readonly equippedUnit: UnitState;
  readonly before: LoopBattleMetrics;
  readonly after: LoopBattleMetrics;
}

const BASE_HEAVY_UNIT: UnitState = {
  id: 'ironwall-heavy',
  definitionId: 'heavy-infantry',
  factionId: 'expedition',
  name: '第一重盾團',
  unitType: 'HEAVY_INFANTRY',
  classId: 'heavy-infantry',
  level: 1,
  experience: 0,
  troopCount: 1_000,
  initialTroopCount: 1_000,
  woundedCount: 0,
  deadCount: 0,
  routedCount: 0,
  missingCount: 0,
  capturedCount: 0,
  position: { x: 215, y: 210 },
  direction: { x: 1, y: 0.08 },
  targetPosition: { x: 410, y: 225 },
  morale: 1,
  moraleState: 'STEADY',
  fatigue: 0,
  cohesion: 1,
  discipline: 0.9,
  commandEfficiency: 0.9,
  attack: 10,
  defense: 10,
  frontalDefense: 10,
  mobility: 2,
  carryingCapacity: 10,
  equipmentWeight: 0,
  formation: 'DENSE_BLOCK',
  executionState: 'MOVING',
  equipmentLoadoutId: 'starter-heavy',
  equipmentIds: [],
  appearanceIds: [],
  skillIds: [],
  passiveIds: [],
  statusEffectIds: [],
};

const FRONTAL_ZONE: ContactZone = {
  id: 'contact-greyfang-front',
  cellIndices: [0],
  attackingFactionId: 'greyfang',
  defendingFactionId: 'expedition',
  attackingUnitIds: ['greyfang-pack'],
  defendingUnitIds: [BASE_HEAVY_UNIT.id],
  contactNormal: { x: -1, y: 0 },
  width: 1,
  attackingPressure: 0,
  defendingPressure: 0,
  contactType: 'FRONTAL',
};

const GREYFANG_ATTACKER: CombatSideSnapshot = {
  factionId: 'greyfang',
  actorIds: ['greyfang-pack'],
  troopCount: 400,
  attack: 8,
  defense: 4,
  morale: 0.8,
  cohesion: 0.35,
  fatigue: 0,
  formation: 'LOOSE',
};

function visualSource(unit: UnitState): VisualUnitSource {
  return {
    id: unit.id,
    factionId: unit.factionId,
    troopCount: unit.troopCount,
    position: unit.position,
    targetPosition: unit.targetPosition ?? unit.position,
    direction: unit.direction,
    formation: unit.formation,
    executionState: unit.executionState,
    shape: 'SQUARE',
    color: 0x6fb6d9,
    pointScale: 0.32,
    appearanceIds: unit.appearanceIds,
  };
}

function battleMetrics(unit: UnitState): LoopBattleMetrics {
  const movement = calculateMovementStep({
    position: unit.position,
    target: { x: unit.position.x + 100, y: unit.position.y },
    mobility: unit.mobility,
    fatigue: unit.fatigue,
    formation: unit.formation,
    equipmentWeight: unit.equipmentWeight,
    carryingCapacity: unit.carryingCapacity,
    terrainMovementCost: 1,
    deltaSeconds: 1,
    mode: 'NORMAL',
  });
  const defender = createUnitCombatSnapshot({
    unit,
    contactType: 'FRONTAL',
  });
  const pressure = calculateLocalPressure({
    zone: FRONTAL_ZONE,
    attacker: GREYFANG_ATTACKER,
    defender,
  });

  return {
    frontalDefense: unit.frontalDefense,
    mobility: unit.mobility,
    equipmentWeight: unit.equipmentWeight,
    defendingPressure: pressure.defendingPressure,
    distanceMoved: movement.distanceMoved,
    visualStyle: resolveEquipmentVisualStyle(visualSource(unit)),
  };
}

export function createMvpLoopSnapshot(): MvpLoopSnapshot {
  const drops = generateGreyfangLoot({
    sourceId: 'greyfang-pack',
    defeatedWolves: 24,
    defeatedHornedAlphas: 1,
    position: { x: 640, y: 300 },
    random: createSeededRandom('greyfang-mvp-loot'),
  });
  const recovery = recoverLoot({
    inventory: createEmptyInventory(40),
    drops,
    recoveryPosition: { x: 640, y: 300 },
    recoveryRadius: 3,
    materialDefinitions: GREYFANG_MATERIALS,
  });
  const retreat = applyRetreatLoss({
    inventory: recovery.inventory,
    outcome: 'NORMAL',
  });
  const crafting = craftEquipment({
    inventory: retreat.inventory,
    recipe: HORNPLATE_SHIELD_RECIPE,
    equipmentInstanceId: 'equipment-hornplate-1',
  });
  const equippedUnit = equipUnit({
    unit: BASE_HEAVY_UNIT,
    equipmentInstance: crafting.equipmentInstance,
    definition: HORNPLATE_SHIELD,
  });

  return {
    drops,
    recovered: recovery.recovered,
    remainingDrops: recovery.remainingDrops,
    inventoryStacks: crafting.inventory.stacks,
    craftedEquipment: crafting.equipmentInstance,
    equippedUnit,
    before: battleMetrics(BASE_HEAVY_UNIT),
    after: battleMetrics(equippedUnit),
  };
}
