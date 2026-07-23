import type { Vec2 } from '../primitives/vec2';

export type MonsterBehaviorState =
  'IDLE' | 'HUNTING' | 'ENCIRCLING' | 'ENGAGED' | 'RETREATING' | 'ROUTING';

export interface MonsterGroupState {
  readonly id: string;
  readonly definitionId: string;
  readonly factionId: string;
  readonly troopCount: number;
  readonly initialTroopCount: number;
  readonly woundedCount: number;
  readonly deadCount: number;
  readonly routedCount: number;
  readonly missingCount: number;
  readonly capturedCount: number;
  readonly position: Vec2;
  readonly direction: Vec2;
  readonly targetPosition?: Vec2;
  readonly morale: number;
  readonly fatigue: number;
  readonly cohesion: number;
  readonly behaviorState: MonsterBehaviorState;
  readonly currentTargetId?: string;
  readonly abilityIds: readonly string[];
  readonly statusEffectIds: readonly string[];
}
