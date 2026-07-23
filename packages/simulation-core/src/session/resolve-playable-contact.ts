import type {
  BattleEvent,
  ContactZone,
  MonsterGroupState,
  UnitState,
} from '@expedition/shared-types';

import { applyCasualtiesToUnit } from '../casualties/apply-casualties-to-unit';
import type { CombatSideSnapshot } from '../combat/combat-side-snapshot';
import { createUnitCombatSnapshot } from '../combat/create-unit-combat-snapshot';
import { resolveContact } from '../contact/resolve-contact';
import { createSeededRandom } from '../rng/seeded-random';

export interface ResolvePlayableContactInput {
  readonly seed: string;
  readonly tick: number;
  readonly unit: UnitState;
  readonly monster: MonsterGroupState;
}

export interface PlayableContactResult {
  readonly unit: UnitState;
  readonly monster: MonsterGroupState;
  readonly events: readonly BattleEvent[];
  readonly victory: boolean;
  readonly defeat: boolean;
}

function moraleState(morale: number): UnitState['moraleState'] {
  if (morale <= 0.2) return 'ROUTING';
  if (morale <= 0.4) return 'BREAKING';
  if (morale <= 0.6) return 'WAVERING';
  if (morale <= 0.8) return 'SHAKEN';
  return 'STEADY';
}

export function resolvePlayableContact(input: ResolvePlayableContactInput): PlayableContactResult {
  const attacker = createUnitCombatSnapshot({ unit: input.unit, contactType: 'FRONTAL' });
  const defender: CombatSideSnapshot = {
    factionId: input.monster.factionId,
    actorIds: [input.monster.id],
    troopCount: input.monster.troopCount,
    attack: 8,
    defense: 5,
    morale: input.monster.morale,
    cohesion: input.monster.cohesion,
    fatigue: input.monster.fatigue,
    formation: 'LOOSE',
  };
  const zone: ContactZone = {
    id: `contact:${input.unit.id}:${input.monster.id}`,
    cellIndices: [0],
    attackingFactionId: attacker.factionId,
    defendingFactionId: defender.factionId,
    attackingUnitIds: [input.unit.id],
    defendingUnitIds: [input.monster.id],
    contactNormal: input.unit.direction,
    width: 1,
    attackingPressure: 0,
    defendingPressure: 0,
    contactType: 'FRONTAL',
  };
  const resolution = resolveContact({
    zone,
    attacker,
    defender,
    tick: input.tick,
    random: createSeededRandom(`${input.seed}:${input.tick}:${input.unit.id}`),
  });
  const wounded = Math.ceil(resolution.attackerLosses * 0.55);
  const dead = resolution.attackerLosses - wounded;
  const remainingMorale = Math.max(
    0,
    input.unit.morale - resolution.attackerLosses / input.unit.initialTroopCount,
  );
  const casualtyUnit = applyCasualtiesToUnit(input.unit, {
    wounded,
    dead,
    routed: 0,
    missing: 0,
    captured: 0,
  });
  const defeat = casualtyUnit.troopCount === 0 || remainingMorale <= 0.2;
  const unit: UnitState = {
    ...casualtyUnit,
    morale: remainingMorale,
    moraleState: moraleState(remainingMorale),
    executionState: defeat ? 'ROUTING' : 'ENGAGED',
  };
  const monsterTroops = Math.max(0, input.monster.troopCount - resolution.defenderLosses);
  const monsterMorale = Math.max(
    0,
    input.monster.morale - 0.19 - (resolution.defenderLosses / input.monster.initialTroopCount) * 2,
  );
  const victory = monsterTroops === 0 || monsterMorale <= 0.22;
  const routedWolves = victory ? monsterTroops : 0;
  const monster: MonsterGroupState = {
    ...input.monster,
    troopCount: victory ? 0 : monsterTroops,
    deadCount: input.monster.deadCount + resolution.defenderLosses,
    routedCount: input.monster.routedCount + routedWolves,
    morale: monsterMorale,
    behaviorState: victory ? 'ROUTING' : 'ENGAGED',
  };

  return { unit, monster, events: resolution.events, victory, defeat };
}
