import type { Vec2 } from '../primitives/vec2';
import type { ContactType } from './contact-type';

export interface ContactZone {
  readonly id: string;
  readonly cellIndices: readonly number[];
  readonly attackingFactionId: string;
  readonly defendingFactionId: string;
  readonly attackingUnitIds: readonly string[];
  readonly defendingUnitIds: readonly string[];
  readonly contactNormal: Vec2;
  readonly width: number;
  readonly attackingPressure: number;
  readonly defendingPressure: number;
  readonly contactType: ContactType;
}
