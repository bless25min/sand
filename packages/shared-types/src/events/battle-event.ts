import type { Vec2 } from '../primitives/vec2';

export type BattleEventType =
  | 'BATTLE_STARTED'
  | 'UNIT_MOVED'
  | 'CONTACT_STARTED'
  | 'CASUALTIES_APPLIED'
  | 'MORALE_CHANGED'
  | 'UNIT_ROUTED';

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
