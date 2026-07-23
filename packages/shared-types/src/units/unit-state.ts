import type { Vec2 } from '../primitives/vec2';
import type { FormationType } from './formation-type';
import type { MoraleState } from './morale-state';

export type UnitType = 'HEAVY_INFANTRY' | 'ARCHER' | 'CAVALRY' | 'HERO_TEAM';

export type UnitExecutionState = 'IDLE' | 'MOVING' | 'ENGAGED' | 'RETREATING' | 'ROUTING';

export interface UnitState {
  readonly id: string;
  readonly definitionId: string;
  readonly factionId: string;
  readonly name: string;
  readonly unitType: UnitType;
  readonly classId: string;
  readonly level: number;
  readonly experience: number;
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
  readonly moraleState: MoraleState;
  readonly fatigue: number;
  readonly cohesion: number;
  readonly discipline: number;
  readonly commandEfficiency: number;
  readonly attack: number;
  readonly defense: number;
  readonly frontalDefense: number;
  readonly mobility: number;
  readonly carryingCapacity: number;
  readonly equipmentWeight: number;
  readonly formation: FormationType;
  readonly executionState: UnitExecutionState;
  readonly commanderId?: string;
  readonly equipmentLoadoutId: string;
  readonly equipmentIds: readonly string[];
  readonly appearanceIds: readonly string[];
  readonly skillIds: readonly string[];
  readonly passiveIds: readonly string[];
  readonly statusEffectIds: readonly string[];
}
