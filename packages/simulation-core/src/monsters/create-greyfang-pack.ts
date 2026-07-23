import type { MonsterGroupState, Vec2 } from '@expedition/shared-types';

export interface CreateGreyfangPackInput {
  readonly id: string;
  readonly leaderId: string;
  readonly troopCount: number;
  readonly position: Vec2;
  readonly factionId?: string;
}

const GREYFANG_ABILITY_IDS = ['PACK_ENCIRCLEMENT', 'GREYFANG_LEADER_AURA'] as const;

export function createGreyfangPack(input: CreateGreyfangPackInput): MonsterGroupState {
  if (!Number.isInteger(input.troopCount) || input.troopCount <= 0) {
    throw new Error('troopCount must be a positive integer');
  }

  return {
    id: input.id,
    definitionId: 'greyfang-wolf',
    factionId: input.factionId ?? 'monsters',
    leaderId: input.leaderId,
    troopCount: input.troopCount,
    initialTroopCount: input.troopCount,
    woundedCount: 0,
    deadCount: 0,
    routedCount: 0,
    missingCount: 0,
    capturedCount: 0,
    position: input.position,
    direction: { x: 0, y: 0 },
    morale: 0.8,
    fatigue: 0,
    cohesion: 0.35,
    behaviorState: 'IDLE',
    abilityIds: GREYFANG_ABILITY_IDS,
    statusEffectIds: [],
  };
}
