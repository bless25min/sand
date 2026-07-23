import { describe, expect, it } from 'vitest';

import { createGreyfangPack } from './create-greyfang-pack';

describe('createGreyfangPack', () => {
  it('creates a low-cohesion pack with its leader and abilities', () => {
    const pack = createGreyfangPack({
      id: 'greyfang-pack-1',
      leaderId: 'greyfang-alpha-1',
      troopCount: 24,
      position: { x: 8, y: 5 },
    });

    expect(pack).toMatchObject({
      id: 'greyfang-pack-1',
      definitionId: 'greyfang-wolf',
      factionId: 'monsters',
      leaderId: 'greyfang-alpha-1',
      troopCount: 24,
      initialTroopCount: 24,
      position: { x: 8, y: 5 },
      morale: 0.8,
      cohesion: 0.35,
      behaviorState: 'IDLE',
    });
    expect(pack.abilityIds).toEqual(['PACK_ENCIRCLEMENT', 'GREYFANG_LEADER_AURA']);
  });

  it('rejects packs without surviving troops', () => {
    expect(() =>
      createGreyfangPack({
        id: 'greyfang-pack-1',
        leaderId: 'greyfang-alpha-1',
        troopCount: 0,
        position: { x: 0, y: 0 },
      }),
    ).toThrow('troopCount');
  });
});
