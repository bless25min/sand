import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { createGuildProfile } from '@expedition/simulation-core';
import { describe, expect, it } from 'vitest';

import {
  GUILD_SAVE_BACKUP_KEY,
  GUILD_SAVE_KEY,
  loadGuildSave,
  parseGuildSave,
  serializeGuildSave,
  storeGuildSave,
} from './guild-save';

const legacyProfile = (version: 1 | 2 | 3) => ({
  version,
  leaderId: 'lyra',
  party: ['brann', 'lyra', 'elin'].map((definitionId) => ({
    definitionId,
    level: 3,
    experience: 25,
    equipment: {},
  })),
  inventory: [],
  materials: { hunter_sinew: 4 },
  gold: 456,
  unlockedQuestIds: ['border_pack', 'moonroad_pursuit'],
  questRecords: { border_pack: { clears: 2 } },
  nextLootSeed: 7,
  selectedBuildId: 'retaliation',
  loadouts: { retaliation: ['brann_guard', 'lyra_mark'] },
  completedChallengeIds: [],
  discoveredEquipmentIds: [],
  discoveredRuleIds: [],
  forgeSequence: 0,
  progressionEvents: [],
});

describe('guild v5 save', () => {
  it('round-trips the six-hero profile without rewriting its random rolls', () => {
    const profile = { ...createGuildProfile(GUILD_GAME_CONTENT), gold: 987 };
    expect(parseGuildSave(serializeGuildSave(profile))).toEqual(profile);
  });

  it('maps a v4 high-scale skill and item into bounded v5 quality without losing IDs', () => {
    const current = createGuildProfile(GUILD_GAME_CONTENT);
    const sourceSkill = current.skillInventory[0]!;
    const v4 = {
      ...current,
      version: 4,
      skillInventory: [
        {
          ...sourceSkill,
          components: sourceSkill.components.map(({ qualityRank, ...component }) => {
            void qualityRank;
            return {
              ...component,
              power: 14,
              layerStrength: 5,
              triggerAddition: 12,
              repeatCount: 6,
            };
          }),
        },
        ...current.skillInventory.slice(1),
      ],
      inventory: [
        {
          id: 'legacy-rare',
          baseId: 'iron_blade',
          name: '舊稀有武器',
          slot: 'weapon',
          rarity: 'rare',
          mainStat: { stat: 'attack', value: 88 },
          affixes: [{ stat: 'attack', value: 30 }],
          sellValue: 1,
        },
      ],
    };

    const parsed = parseGuildSave(JSON.stringify(v4));

    expect(parsed?.version).toBe(5);
    expect(parsed?.skillInventory[0]?.id).toBe(sourceSkill.id);
    expect(parsed?.skillInventory[0]?.components[0]).toMatchObject({
      qualityRank: 5,
      power: 5,
      layerStrength: 5,
      triggerAddition: 5,
      repeatCount: 6,
    });
    expect(parsed?.inventory[0]).toMatchObject({
      id: 'legacy-rare',
      qualityRank: 3,
      mainStat: { value: 3 },
      affixes: [{ value: 3 }],
    });
  });

  it.each([1, 2, 3] as const)('migrates v%s progress and imports old cards', (version) => {
    const parsed = parseGuildSave(JSON.stringify(legacyProfile(version)));

    expect(parsed).toMatchObject({
      version: 5,
      gold: 456,
      unlockedQuestIds: ['border_pack', 'moonroad_pursuit'],
    });
    expect(parsed?.party).toHaveLength(6);
    expect(parsed?.materials.legacy_essence).toBe(135);
    expect(parsed?.skillInventory.some(({ id }) => id.includes('brann_guard'))).toBe(true);
  });

  it('backs up v3, writes migrated v5, and never overwrites the legacy source', () => {
    const source = JSON.stringify(legacyProfile(3));
    const values = new Map<string, string>([['expedition:guild-rpg:v3', source]]);
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };

    const loaded = loadGuildSave(storage);

    expect(loaded?.version).toBe(5);
    expect(values.get(GUILD_SAVE_BACKUP_KEY)).toBe(source);
    expect(JSON.parse(values.get(GUILD_SAVE_KEY)!)).toMatchObject({ version: 5 });
    expect(values.get('expedition:guild-rpg:v3')).toBe(source);
  });

  it('stores all new saves under v5 only', () => {
    const writes = new Map<string, string>();
    storeGuildSave(
      { setItem: (key, value) => writes.set(key, value) },
      createGuildProfile(GUILD_GAME_CONTENT),
    );
    expect([...writes.keys()]).toEqual([GUILD_SAVE_KEY]);
  });

  it.each(['', '{', 'null', '{"version":4}', '{"version":3,"party":[]}'])(
    'rejects malformed save %s',
    (value) => expect(parseGuildSave(value)).toBeUndefined(),
  );
});
