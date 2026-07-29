import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { EquipmentItem, GuildProfile } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { createSeededRandom } from '../../rng/seeded-random';
import { createGuildProfile } from '../profile/create-profile';
import { forgeEquipmentItem, previewForgeEquipmentItem } from './forge-equipment';
import { salvageSelectedEquipment, toggleEquipmentItemFlag } from './inventory-safety';

const item = (id: string, coreId = 'toxic-mist'): EquipmentItem => ({
  id,
  baseId: 'wolf_charm',
  name: `測試狼牙護符 ${id}`,
  slot: 'accessory',
  rarity: 'rare',
  qualityRank: 3,
  mainStat: { stat: 'speed', value: 3, sourceId: 'wolf_charm', label: '狼牙護符' },
  affixes: [{ stat: 'attack', value: 4, sourceId: 'savage', label: '兇猛' }],
  sellValue: 40,
  forgeMaterialId: 'scout_fang',
  coreId,
  coreStrength: 3,
  cores: [{ id: coreId, strength: 3 }],
});

function forgeProfile() {
  const base = createGuildProfile(GUILD_GAME_CONTENT);
  return {
    ...base,
    gold: 500,
    materials: { scout_fang: 10 },
    inventory: [item('target'), item('donor', 'lone-king-loop')],
  };
}

const stored = (profile: GuildProfile, id = 'target') =>
  profile.inventory.find((entry) => entry.id === id)!;

describe('v4 equipment forge', () => {
  it('calibrates within authored ranges instead of applying infinite linear upgrades', () => {
    const result = forgeEquipmentItem(
      forgeProfile(),
      'target',
      'calibrate',
      GUILD_GAME_CONTENT,
      createSeededRandom('calibrate'),
    );
    const range = GUILD_GAME_CONTENT.equipmentBases.find(
      ({ id }) => id === 'wolf_charm',
    )!.mainStatRoll;

    expect(stored(result.profile).mainStat.value).toBeGreaterThanOrEqual(range.min);
    expect(stored(result.profile).mainStat.value).toBeLessThanOrEqual(range.max);
    expect(stored(result.profile).forgeRank).toBeUndefined();
    expect(result.message).toMatch(/速度 3 → \d/);
  });

  it('makes core protection real and transplants the active modern core after unlocking', () => {
    const profile = forgeProfile();
    const modernProfile = {
      ...profile,
      inventory: profile.inventory.map((entry) =>
        entry.id === 'target'
          ? {
              ...entry,
              cores: [
                { id: 'toxic-mist', strength: 3 },
                { id: 'tide-relay', strength: 2 },
              ],
            }
          : entry,
      ),
    };
    const reforged = forgeEquipmentItem(
      modernProfile,
      'target',
      'reforge',
      GUILD_GAME_CONTENT,
      createSeededRandom('reforge'),
    );
    expect(stored(reforged.profile).affixes[0]?.sourceId).not.toBe('savage');

    const locked = forgeEquipmentItem(
      reforged.profile,
      'target',
      'lock',
      GUILD_GAME_CONTENT,
      createSeededRandom('lock'),
      { lockField: 'core' },
    );
    expect(locked.profile.forgeLocks.target).toContain('core');

    const blocked = forgeEquipmentItem(
      locked.profile,
      'target',
      'transplant',
      GUILD_GAME_CONTENT,
      createSeededRandom('transplant'),
      { sourceItemId: 'donor' },
    );
    expect(stored(blocked.profile).cores?.[0]?.id).toBe('toxic-mist');
    expect(blocked.profile.inventory.some(({ id }) => id === 'donor')).toBe(true);
    expect(blocked.message).toContain('核心已鎖定');

    const unlocked = forgeEquipmentItem(
      blocked.profile,
      'target',
      'lock',
      GUILD_GAME_CONTENT,
      createSeededRandom('unlock'),
      { lockField: 'core' },
    );
    expect(unlocked.profile.forgeLocks.target ?? []).not.toContain('core');
    expect(unlocked.profile.gold).toBe(blocked.profile.gold);
    expect(unlocked.profile.materials.scout_fang).toBe(blocked.profile.materials.scout_fang);

    const transplanted = forgeEquipmentItem(
      unlocked.profile,
      'target',
      'transplant',
      GUILD_GAME_CONTENT,
      createSeededRandom('transplant'),
      { sourceItemId: 'donor' },
    );
    expect(stored(transplanted.profile).coreId).toBe('lone-king-loop');
    expect(stored(transplanted.profile).cores).toEqual([
      { id: 'lone-king-loop', strength: 3 },
      { id: 'tide-relay', strength: 2 },
    ]);
    expect(transplanted.profile.inventory.some(({ id }) => id === 'donor')).toBe(false);
    expect(transplanted.profile.discoveredCoreIds).toContain('lone-king-loop');
    expect(transplanted.message).toContain('毒霧 → 孤王迴路');
  });

  it('salvages deliberately without auto-selling a full inventory', () => {
    const profile = {
      ...forgeProfile(),
      inventory: Array.from({ length: 30 }, (_, index) => item(`kept-${index}`)),
    };
    expect(profile.inventory).toHaveLength(30);

    const salvaged = forgeEquipmentItem(
      profile,
      'kept-0',
      'salvage',
      GUILD_GAME_CONTENT,
      createSeededRandom('salvage'),
    );
    expect(salvaged.profile.inventory).toHaveLength(29);
    expect(salvaged.profile.materials.scout_fang).toBe(11);
  });

  it('previews exact costs, material, and action results', () => {
    expect(
      previewForgeEquipmentItem(forgeProfile(), 'target', 'transplant', GUILD_GAME_CONTENT, {
        sourceItemId: 'donor',
      }),
    ).toMatchObject({
      materialId: 'scout_fang',
      resultLabel: expect.stringContaining('孤王迴路核心'),
    });

    const protectedProfile = forgeEquipmentItem(
      forgeProfile(),
      'target',
      'lock',
      GUILD_GAME_CONTENT,
      createSeededRandom('lock-preview'),
      { lockField: 'core' },
    ).profile;
    expect(
      previewForgeEquipmentItem(protectedProfile, 'target', 'lock', GUILD_GAME_CONTENT, {
        lockField: 'core',
      }),
    ).toMatchObject({
      cost: 0,
      resultLabel: '解除核心保護',
    });
  });

  it('locks, favorites, and batch-salvages only explicitly safe inventory items', () => {
    const profile = {
      ...forgeProfile(),
      inventory: [item('locked'), item('favorite'), item('safe')],
    };
    const locked = toggleEquipmentItemFlag(profile, 'locked', 'locked').profile;
    const protectedProfile = toggleEquipmentItemFlag(locked, 'favorite', 'favorite').profile;
    const salvaged = salvageSelectedEquipment(
      protectedProfile,
      ['locked', 'favorite', 'safe'],
      GUILD_GAME_CONTENT,
    );

    expect(salvaged.profile.inventory.map(({ id }) => id)).toEqual(['locked', 'favorite']);
    expect(salvaged.profile.materials.scout_fang).toBe(11);
    expect(salvaged.message).toContain('略過 2 件');
  });
});
