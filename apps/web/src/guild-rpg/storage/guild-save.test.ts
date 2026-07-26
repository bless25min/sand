import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { createGuildProfile } from '@expedition/simulation-core';
import { describe, expect, it } from 'vitest';

import { loadGuildSave, parseGuildSave, serializeGuildSave, storeGuildSave } from './guild-save';

describe('guild save', () => {
  it('migrates a version-two campaign save into the complete version-three defaults', () => {
    const current = createGuildProfile(GUILD_GAME_CONTENT);
    const legacy = {
      ...current,
      version: 2,
      loadouts: undefined,
      completedChallengeIds: undefined,
      discoveredEquipmentIds: undefined,
      discoveredRuleIds: undefined,
      forgeSequence: undefined,
      progressionEvents: undefined,
      questRecords: { border_pack: { clears: 3, bestOverkill: 444 } },
    };

    const parsed = parseGuildSave(JSON.stringify(legacy));

    expect(parsed?.version).toBe(3);
    expect(parsed?.questRecords.border_pack?.clears).toBe(3);
    expect(Object.values(parsed?.loadouts ?? {})).toHaveLength(4);
    expect(Object.values(parsed?.loadouts ?? {}).every((cards) => cards.length === 8)).toBe(true);
    expect(parsed?.completedChallengeIds).toEqual([]);
    expect(parsed?.forgeSequence).toBe(0);
  });

  it('grants the launch forge reserve and binds legacy equipment to an authored material', () => {
    const current = createGuildProfile(GUILD_GAME_CONTENT);
    const legacy = {
      ...current,
      version: 2,
      gold: 40,
      inventory: [
        {
          id: 'legacy-iron-blade',
          baseId: 'iron_blade',
          name: '巡境鐵刃',
          slot: 'weapon',
          rarity: 'rare',
          mainStat: { stat: 'attack', value: 12 },
          affixes: [],
          sellValue: 24,
        },
      ],
      loadouts: undefined,
      completedChallengeIds: undefined,
      discoveredEquipmentIds: undefined,
      discoveredRuleIds: undefined,
      forgeSequence: undefined,
      progressionEvents: undefined,
    };

    const parsed = parseGuildSave(JSON.stringify(legacy));

    expect(parsed?.gold).toBe(200);
    expect(parsed?.inventory[0]).toMatchObject({ forgeMaterialId: 'hunter_sinew' });
  });

  it('repairs a saved eight-card loadout when it removes a signature or tag source', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const broken = {
      ...profile,
      loadouts: {
        ...profile.loadouts,
        command_storm: profile.loadouts.command_storm!.map((cardId) =>
          cardId === 'lyra_mark' ? 'lyra_killshot' : cardId,
        ),
      },
    };

    const parsed = parseGuildSave(JSON.stringify(broken));
    const defaultCards = GUILD_GAME_CONTENT.builds.find(
      (build) => build.id === 'command_storm',
    )!.defaultCardIds;

    expect(parsed?.loadouts.command_storm).toEqual(defaultCards);
  });

  it('falls back to the version-two key and writes all future saves to version three', () => {
    const current = createGuildProfile(GUILD_GAME_CONTENT);
    const legacy = JSON.stringify({
      ...current,
      version: 2,
      loadouts: undefined,
      completedChallengeIds: undefined,
      discoveredEquipmentIds: undefined,
      discoveredRuleIds: undefined,
      forgeSequence: undefined,
      progressionEvents: undefined,
    });
    const writes = new Map<string, string>();
    const loaded = loadGuildSave({
      getItem: (key) => (key === 'expedition:guild-rpg:v2' ? legacy : null),
    });

    expect(loaded?.version).toBe(3);
    storeGuildSave({ setItem: (key, value) => writes.set(key, value) }, loaded!);
    expect(writes.has('expedition:guild-rpg:v3')).toBe(true);
    expect(writes.has('expedition:guild-rpg:v2')).toBe(false);
  });

  it('round-trips a version-three profile', () => {
    const profile = { ...createGuildProfile(GUILD_GAME_CONTENT), gold: 987 };
    expect(parseGuildSave(serializeGuildSave(profile))).toEqual(profile);
  });

  it('migrates a version-one profile without losing progress', () => {
    const current = createGuildProfile(GUILD_GAME_CONTENT);
    const legacy = JSON.stringify({
      ...current,
      version: 1,
      materials: undefined,
      selectedBuildId: undefined,
      gold: 321,
    });

    expect(parseGuildSave(legacy)).toMatchObject({
      version: 3,
      materials: {},
      selectedBuildId: 'retaliation',
      gold: 321,
    });
  });

  it('fills newly inserted campaign steps instead of trapping an existing save', () => {
    const current = createGuildProfile(GUILD_GAME_CONTENT);
    const legacyProgress = serializeGuildSave({
      ...current,
      unlockedQuestIds: ['border_pack', 'abandoned_mine', 'dragon_shrine'],
      questRecords: {
        border_pack: { clears: 2 },
        abandoned_mine: { clears: 1 },
        dragon_shrine: { clears: 1 },
      },
    });

    expect(parseGuildSave(legacyProgress)?.unlockedQuestIds).toEqual([
      'border_pack',
      'moonroad_pursuit',
      'red_fang_den',
      'abandoned_mine',
      'blast_gallery',
      'iron_throne',
      'dragon_shrine',
      'ashen_aisle',
    ]);
  });

  it.each(['', '{', 'null', '{"version":2}', '{"version":1,"party":[]}'])(
    'recovers from invalid save %s',
    (value) => {
      expect(parseGuildSave(value)).toBeUndefined();
    },
  );

  it('rejects malformed nested equipment instead of crashing the guild screen', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const malformed = JSON.stringify({
      ...profile,
      inventory: [{ id: 'broken', slot: 'helmet' }],
    });

    expect(parseGuildSave(malformed)).toBeUndefined();
  });
});
