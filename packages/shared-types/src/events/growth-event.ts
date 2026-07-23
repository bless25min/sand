export type GrowthEventType =
  | 'EXPERIENCE_AWARDED'
  | 'LEVEL_GAINED'
  | 'CLASS_CHANGED'
  | 'WOUNDED_TREATED'
  | 'REINFORCEMENTS_ADDED';

export interface GrowthEvent {
  readonly id: string;
  readonly unitId: string;
  readonly type: GrowthEventType;
  readonly causes: readonly string[];
  readonly effects: Readonly<Record<string, number | string | boolean>>;
}
