import { createMonsterGroupState, createUnitState } from '@expedition/test-fixtures';
import { describe, expect, it } from 'vitest';

import { createGrid } from '../grid/create-grid';
import { projectBattlefield } from '../grid/project-battlefield';
import { detectContactZones } from './detect-contact-zones';

describe('detectContactZones', () => {
  it('returns no contact for a single-faction cell', () => {
    const units = [createUnitState({ position: { x: 0, y: 0 } })];
    const grid = projectBattlefield({
      grid: createGrid({ width: 1, height: 1 }),
      units,
      monsterGroups: [],
    });

    expect(detectContactZones({ grid, units, monsterGroups: [] })).toEqual([]);
  });

  it('creates a stable contact for overlapping hostile actors', () => {
    const units = [
      createUnitState({
        id: 'heavy-1',
        troopCount: 100,
        position: { x: 0, y: 0 },
      }),
    ];
    const monsterGroups = [
      createMonsterGroupState({
        id: 'wolves-1',
        troopCount: 20,
        position: { x: 0, y: 0 },
      }),
    ];
    const grid = projectBattlefield({
      grid: createGrid({ width: 1, height: 1 }),
      units,
      monsterGroups,
    });

    const first = detectContactZones({ grid, units, monsterGroups });
    const second = detectContactZones({ grid, units, monsterGroups });

    expect(first).toEqual(second);
    expect(first).toEqual([
      {
        id: 'contact-0-player-monsters',
        cellIndices: [0],
        attackingFactionId: 'player',
        defendingFactionId: 'monsters',
        attackingUnitIds: ['heavy-1'],
        defendingUnitIds: ['wolves-1'],
        contactNormal: { x: 1, y: 0 },
        width: 1,
        attackingPressure: 0,
        defendingPressure: 0,
        contactType: 'FRONTAL',
      },
    ]);
  });

  it('keeps only the two factions with greatest local density', () => {
    const units = [
      createUnitState({
        id: 'player-1',
        factionId: 'player',
        troopCount: 100,
        position: { x: 0, y: 0 },
      }),
      createUnitState({
        id: 'allies-1',
        factionId: 'allies',
        troopCount: 80,
        position: { x: 0, y: 0 },
      }),
    ];
    const monsterGroups = [
      createMonsterGroupState({
        id: 'wolves-1',
        troopCount: 20,
        position: { x: 0, y: 0 },
      }),
    ];
    const grid = projectBattlefield({
      grid: createGrid({ width: 1, height: 1 }),
      units,
      monsterGroups,
    });

    const [zone] = detectContactZones({ grid, units, monsterGroups });

    expect(zone?.attackingFactionId).toBe('player');
    expect(zone?.defendingFactionId).toBe('allies');
    expect(zone?.attackingUnitIds).toEqual(['player-1']);
    expect(zone?.defendingUnitIds).toEqual(['allies-1']);
    expect(zone?.attackingUnitIds).not.toContain('wolves-1');
    expect(zone?.defendingUnitIds).not.toContain('wolves-1');
  });
});
