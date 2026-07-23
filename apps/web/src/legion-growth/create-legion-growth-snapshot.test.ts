import { describe, expect, it } from 'vitest';

import {
  createLegionGrowthSnapshot,
  type LegionGrowthUnitSnapshot,
} from './create-legion-growth-snapshot';

describe('createLegionGrowthSnapshot', () => {
  it('replays both growth paths deterministically', () => {
    const first = createLegionGrowthSnapshot();
    const units: readonly [LegionGrowthUnitSnapshot, LegionGrowthUnitSnapshot] = first.units;

    expect(createLegionGrowthSnapshot()).toEqual(first);
    expect(units).toHaveLength(2);
    expect(first.units.map((entry) => entry.after.classId)).toEqual([
      'heavy-shield-guard',
      'beast-hunter-marksman',
    ]);
    expect(first.units.every((entry) => entry.after.level === 2)).toBe(true);
    expect(first.units.every((entry) => entry.events.length > 0)).toBe(true);
  });

  it('uses the fixed awards and formation recovery fixtures', () => {
    const [infantry, archer] = createLegionGrowthSnapshot().units;

    expect(infantry?.experienceDetails.map(({ quantity, reason }) => [reason, quantity])).toEqual([
      ['BATTLE_PARTICIPATION', 1],
      ['FORMATION_HELD', 1],
      ['MONSTER_DEFEATED', 4],
    ]);
    expect(infantry).toMatchObject({
      experienceGained: 105,
      levelsGained: 1,
      treatedCount: 7,
      reinforcementCount: 8,
      before: { level: 1, experience: 0, troopCount: 80, woundedCount: 12 },
      after: { level: 2, experience: 5, troopCount: 95, woundedCount: 5 },
    });
    expect(archer?.experienceDetails.map(({ quantity, reason }) => [reason, quantity])).toEqual([
      ['BATTLE_PARTICIPATION', 1],
      ['COMMAND_COMPLETED', 2],
      ['MONSTER_DEFEATED', 3],
    ]);
    expect(archer).toMatchObject({
      experienceGained: 110,
      levelsGained: 1,
      treatedCount: 10,
      reinforcementCount: 10,
      before: { level: 1, experience: 0, troopCount: 75, woundedCount: 15 },
      after: { level: 2, experience: 10, troopCount: 95, woundedCount: 5 },
    });
  });

  it('calculates both attacking and defending pressure against greyfangs', () => {
    for (const unit of createLegionGrowthSnapshot().units) {
      expect(unit.beforeMetrics.attackingPressure).toBeGreaterThan(0);
      expect(unit.beforeMetrics.defendingPressure).toBeGreaterThan(0);
      expect(unit.afterMetrics.attackingPressure).toBeGreaterThan(0);
      expect(unit.afterMetrics.defendingPressure).toBeGreaterThan(0);
    }
  });

  it('makes infantry tougher and slower in the next battle', () => {
    const infantry = createLegionGrowthSnapshot().units[0];
    expect(infantry?.after.frontalDefense).toBeGreaterThan(infantry?.before.frontalDefense ?? 0);
    expect(infantry?.afterMetrics.defendingPressure).toBeGreaterThan(
      infantry?.beforeMetrics.defendingPressure ?? 0,
    );
    expect(infantry?.afterMetrics.distanceMoved).toBeLessThan(
      infantry?.beforeMetrics.distanceMoved ?? 0,
    );
  });

  it('makes archers hit harder and move farther with lower frontal defense', () => {
    const archer = createLegionGrowthSnapshot().units[1];
    expect(archer?.after.attack).toBeGreaterThan(archer?.before.attack ?? 0);
    expect(archer?.after.frontalDefense).toBeLessThan(archer?.before.frontalDefense ?? 0);
    expect(archer?.afterMetrics.attackingPressure).toBeGreaterThan(
      archer?.beforeMetrics.attackingPressure ?? 0,
    );
    expect(archer?.afterMetrics.distanceMoved).toBeGreaterThan(
      archer?.beforeMetrics.distanceMoved ?? 0,
    );
  });
});
