import type { BattleEvent, MonsterGroupState, UnitState } from '@expedition/shared-types';

import { createSeededRandom } from '../rng/seeded-random';

const CONTACT_DISTANCE = 3;
const MAXIMUM_VOLLEY_DISTANCE = 35;

export interface RangedVolleyActors {
  readonly unit: UnitState;
  readonly monster: MonsterGroupState;
}

export interface ResolveRangedVolleyInput extends RangedVolleyActors {
  readonly seed: string;
  readonly tick: number;
}

export interface RangedVolleyResult {
  readonly monster: MonsterGroupState;
  readonly events: readonly BattleEvent[];
  readonly victory: boolean;
  readonly losses: number;
}

function distanceBetween(actors: RangedVolleyActors): number {
  return Math.hypot(
    actors.unit.position.x - actors.monster.position.x,
    actors.unit.position.y - actors.monster.position.y,
  );
}

export function isRangedVolleyAvailable(actors: RangedVolleyActors): boolean {
  const distance = distanceBetween(actors);
  return (
    actors.unit.unitType === 'ARCHER' &&
    distance > CONTACT_DISTANCE &&
    distance <= MAXIMUM_VOLLEY_DISTANCE
  );
}

export function resolveRangedVolley(input: ResolveRangedVolleyInput): RangedVolleyResult {
  if (!isRangedVolleyAvailable(input)) {
    throw new RangeError('archer volley requires a target outside contact and inside range');
  }

  const random = createSeededRandom(`${input.seed}:${input.tick}:${input.unit.id}:volley`);
  const formationScale = Math.sqrt(input.unit.troopCount / 100);
  const accuracyScale = 0.85 + random.next() * 0.3;
  const losses = Math.min(
    input.monster.troopCount,
    Math.max(1, Math.round(input.unit.attack * formationScale * accuracyScale)),
  );
  const remainingTroops = input.monster.troopCount - losses;
  const moraleLoss = Math.min(0.16, 0.04 + (losses / input.monster.initialTroopCount) * 1.5);
  const morale = Math.max(0, input.monster.morale - moraleLoss);
  const victory = remainingTroops === 0 || morale <= 0.22;
  const routed = victory ? remainingTroops : 0;
  const monster: MonsterGroupState = {
    ...input.monster,
    troopCount: victory ? 0 : remainingTroops,
    deadCount: input.monster.deadCount + losses,
    routedCount: input.monster.routedCount + routed,
    morale,
    behaviorState: victory ? 'ROUTING' : input.monster.behaviorState,
  };
  const event: BattleEvent = {
    id: `volley:${input.tick}:${input.unit.id}:${input.monster.id}`,
    tick: input.tick,
    type: 'RANGED_VOLLEY_RESOLVED',
    sourceIds: [input.unit.id],
    targetIds: [input.monster.id],
    position: input.monster.position,
    causes: ['ATTACK', 'ARCHER_VOLLEY'],
    effects: {
      losses,
      moraleBefore: input.monster.morale,
      moraleAfter: morale,
      distance: distanceBetween(input),
    },
    visibility: 'PLAYER',
  };

  return { monster, events: [event], victory, losses };
}
