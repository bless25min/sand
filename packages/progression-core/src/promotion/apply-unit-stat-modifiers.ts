import type { UnitState, UnitStatModifiers } from '@expedition/shared-types';

const add = (base: number, delta = 0) => Number((base + delta).toFixed(4));

export function applyUnitStatModifiers(unit: UnitState, modifiers: UnitStatModifiers): UnitState {
  return {
    ...unit,
    attack: add(unit.attack, modifiers.attack),
    defense: add(unit.defense, modifiers.defense),
    frontalDefense: add(unit.frontalDefense, modifiers.frontalDefense),
    mobility: add(unit.mobility, modifiers.mobility),
    discipline: add(unit.discipline, modifiers.discipline),
    commandEfficiency: add(unit.commandEfficiency, modifiers.commandEfficiency),
  };
}
