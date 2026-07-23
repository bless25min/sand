import type { FormationType } from '@expedition/shared-types';

export interface FormationCombatModifier {
  readonly attackMultiplier: number;
  readonly defenseMultiplier: number;
}

const MODIFIERS: Readonly<Record<FormationType, FormationCombatModifier>> = Object.freeze({
  DENSE_BLOCK: Object.freeze({
    attackMultiplier: 1.1,
    defenseMultiplier: 1.1,
  }),
  LINE: Object.freeze({
    attackMultiplier: 0.95,
    defenseMultiplier: 0.95,
  }),
  COLUMN: Object.freeze({
    attackMultiplier: 0.85,
    defenseMultiplier: 0.85,
  }),
  LOOSE: Object.freeze({
    attackMultiplier: 0.9,
    defenseMultiplier: 0.9,
  }),
  SQUARE: Object.freeze({
    attackMultiplier: 1.05,
    defenseMultiplier: 1.05,
  }),
  WEDGE: Object.freeze({
    attackMultiplier: 1.15,
    defenseMultiplier: 0.9,
  }),
});

export function getFormationCombatModifier(formation: FormationType): FormationCombatModifier {
  return MODIFIERS[formation];
}
