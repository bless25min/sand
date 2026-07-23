import { describe, expect, it } from 'vitest';

import { createMvpLoopSnapshot } from './create-mvp-loop-snapshot';

describe('createMvpLoopSnapshot', () => {
  it('replays the first loot-to-next-battle loop deterministically', () => {
    const first = createMvpLoopSnapshot();
    const replay = createMvpLoopSnapshot();

    expect(replay).toEqual(first);
    expect(first.drops.map((drop) => drop.materialId)).toEqual([
      'WOLF_PELT',
      'MONSTER_FANG',
      'HORN_PLATE',
    ]);
    expect(first.remainingDrops).toEqual([]);
    expect(first.craftedEquipment.definitionId).toBe('hornplate-heavy-shield');
    expect(first.equippedUnit.appearanceIds).toContain('HORNPLATE_SHIELD');
  });

  it('makes the next frontal battle safer but movement slower and visually distinct', () => {
    const snapshot = createMvpLoopSnapshot();

    expect(snapshot.after.frontalDefense).toBeGreaterThan(snapshot.before.frontalDefense);
    expect(snapshot.after.defendingPressure).toBeGreaterThan(snapshot.before.defendingPressure);
    expect(snapshot.after.distanceMoved).toBeLessThan(snapshot.before.distanceMoved);
    expect(snapshot.after.visualStyle).not.toEqual(snapshot.before.visualStyle);
    expect(snapshot.after.visualStyle.color).toBe(0xb69a5a);
  });
});
