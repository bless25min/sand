import { ARCHER, INFANTRY } from './legion-growth-fixtures';
import type { LegionGrowthSnapshot } from './legion-growth-types';
import { createUnitGrowthSnapshot } from './create-unit-growth-snapshot';

export type { LegionGrowthSnapshot, LegionGrowthUnitSnapshot } from './legion-growth-types';

export function createLegionGrowthSnapshot(): LegionGrowthSnapshot {
  return {
    units: [createUnitGrowthSnapshot(INFANTRY), createUnitGrowthSnapshot(ARCHER)],
  };
}
