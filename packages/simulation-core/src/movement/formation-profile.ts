import type { FormationType } from '@expedition/shared-types';

export interface FormationProfile {
  readonly speedMultiplier: number;
  readonly frontageMultiplier: number;
  readonly depthMultiplier: number;
  readonly fatigueMultiplier: number;
}

const FORMATION_PROFILES: Readonly<Record<FormationType, FormationProfile>> = Object.freeze({
  DENSE_BLOCK: Object.freeze({
    speedMultiplier: 0.75,
    frontageMultiplier: 0.65,
    depthMultiplier: 1.35,
    fatigueMultiplier: 1.1,
  }),
  LINE: Object.freeze({
    speedMultiplier: 0.9,
    frontageMultiplier: 1.5,
    depthMultiplier: 0.55,
    fatigueMultiplier: 1,
  }),
  COLUMN: Object.freeze({
    speedMultiplier: 1.1,
    frontageMultiplier: 0.55,
    depthMultiplier: 1.5,
    fatigueMultiplier: 0.9,
  }),
  LOOSE: Object.freeze({
    speedMultiplier: 1,
    frontageMultiplier: 1.35,
    depthMultiplier: 0.8,
    fatigueMultiplier: 0.95,
  }),
  SQUARE: Object.freeze({
    speedMultiplier: 0.55,
    frontageMultiplier: 1,
    depthMultiplier: 1.1,
    fatigueMultiplier: 1.25,
  }),
  WEDGE: Object.freeze({
    speedMultiplier: 0.95,
    frontageMultiplier: 0.8,
    depthMultiplier: 1.2,
    fatigueMultiplier: 1.05,
  }),
});

export function getFormationProfile(formation: FormationType): FormationProfile {
  return FORMATION_PROFILES[formation];
}
