import type { FormationType } from '@expedition/shared-types';

export interface CombatSideSnapshot {
  readonly factionId: string;
  readonly actorIds: readonly string[];
  readonly troopCount: number;
  readonly attack: number;
  readonly defense: number;
  readonly morale: number;
  readonly cohesion: number;
  readonly fatigue: number;
  readonly formation: FormationType;
}
