import type { Vec2 } from '../primitives/vec2';

export type BattleEventType =
  | 'BATTLE_STARTED'
  | 'ORDER_ISSUED'
  | 'UNIT_MOVED'
  | 'FORMATION_CHANGED'
  | 'CONTACT_STARTED'
  | 'RANGED_VOLLEY_RESOLVED'
  | 'CASUALTIES_APPLIED'
  | 'MORALE_CHANGED'
  | 'UNIT_ROUTED'
  | 'BATTLE_ENDED';

export interface BattleEvent {
  readonly id: string;
  readonly tick: number;
  readonly type: BattleEventType;
  readonly sourceIds: readonly string[];
  readonly targetIds: readonly string[];
  readonly position?: Vec2;
  readonly causes: readonly string[];
  readonly effects: Readonly<Record<string, number | string | boolean>>;
  readonly visibility: 'PUBLIC' | 'PLAYER' | 'HIDDEN';
}
