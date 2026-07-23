import type { BattleEvent, MonsterGroupState } from '@expedition/shared-types';

export interface ApplyGreyfangLeaderLossInput {
  readonly pack: MonsterGroupState;
  readonly tick: number;
}

export interface GreyfangLeaderLossResult {
  readonly monsterGroup: MonsterGroupState;
  readonly events: readonly BattleEvent[];
}

const LEADER_LOSS_STATUS = 'GREYFANG_LEADER_LOST';

function subtractClamped(value: number, amount: number): number {
  return Number(Math.max(0, value - amount).toFixed(2));
}

export function applyGreyfangLeaderLoss(
  input: ApplyGreyfangLeaderLossInput,
): GreyfangLeaderLossResult {
  if (input.pack.statusEffectIds.includes(LEADER_LOSS_STATUS)) {
    return {
      monsterGroup: input.pack,
      events: [],
    };
  }

  const moraleAfter = subtractClamped(input.pack.morale, 0.35);
  const cohesionAfter = subtractClamped(input.pack.cohesion, 0.15);
  const monsterGroup: MonsterGroupState = {
    ...input.pack,
    morale: moraleAfter,
    cohesion: cohesionAfter,
    behaviorState: moraleAfter <= 0.25 ? 'ROUTING' : 'RETREATING',
    statusEffectIds: [...input.pack.statusEffectIds, LEADER_LOSS_STATUS],
  };
  const event: BattleEvent = {
    id: `event-${input.pack.id}-leader-loss-${input.tick}`,
    tick: input.tick,
    type: 'MORALE_CHANGED',
    sourceIds: [input.pack.leaderId ?? `${input.pack.id}-leader`],
    targetIds: [input.pack.id],
    position: input.pack.position,
    causes: ['GREYFANG_LEADER_DEFEATED'],
    effects: {
      moraleBefore: input.pack.morale,
      moraleAfter,
      cohesionBefore: input.pack.cohesion,
      cohesionAfter,
    },
    visibility: 'PLAYER',
  };

  return {
    monsterGroup,
    events: [event],
  };
}
