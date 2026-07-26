import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { EquipmentItem, GuildBattleState } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { createSeededRandom } from '../../rng/seeded-random';
import { equipStoredItem } from '../equipment/equip-stored-item';
import { resolveItemChoice } from '../equipment/resolve-item-choice';
import { applyQuestRewards } from '../rewards/apply-rewards';
import { generateQuestRewards } from '../rewards/generate-rewards';
import { createGuildProfile } from './create-profile';

const item = (id: string, slot: EquipmentItem['slot'] = 'weapon'): EquipmentItem => ({
  id,
  baseId: slot === 'weapon' ? 'iron_blade' : 'guard_plate',
  name: `測試裝備 ${id}`,
  slot,
  rarity: 'rare',
  mainStat: { stat: slot === 'weapon' ? 'attack' : 'defense', value: 8 },
  affixes: [],
  sellValue: 18,
  coreId: 'molten-armor',
  coreStrength: 3,
});

const finishedBattle = (status: 'victory' | 'defeat'): GuildBattleState => ({
  questId: 'border_pack',
  seed: 'reward',
  elapsedMs: 25_000,
  sequence: 20,
  status,
  units: [],
  leaderAuto: false,
  events: [],
});

describe('v4 guild profile and rewards', () => {
  it('starts a six-hero loot RPG with no level or Build state', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    expect(profile).toMatchObject({ version: 4, leaderId: 'lyra', gold: 200 });
    expect(profile.party).toHaveLength(6);
    expect(profile.skillInventory).toHaveLength(36);
    expect(profile.unlockedQuestIds).toEqual(['border_pack']);
    expect(profile).not.toHaveProperty('selectedBuildId');
  });

  it('generates deterministic victory equipment and skill drops with embedded cores', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const first = generateQuestRewards(
      profile,
      finishedBattle('victory'),
      GUILD_GAME_CONTENT,
      createSeededRandom('reward'),
    );
    const second = generateQuestRewards(
      profile,
      finishedBattle('victory'),
      GUILD_GAME_CONTENT,
      createSeededRandom('reward'),
    );

    expect(first).toEqual(second);
    expect(first?.items).toHaveLength(2);
    expect(first?.skillDrops).toHaveLength(2);
    expect(first?.items.every(({ coreId, coreStrength }) => coreId && coreStrength)).toBe(true);
    expect(first).not.toHaveProperty('experience');
    expect(
      generateQuestRewards(
        profile,
        finishedBattle('defeat'),
        GUILD_GAME_CONTENT,
        createSeededRandom('reward'),
      ),
    ).toBeUndefined();
  });

  it('never auto-sells when keeping or replacing equipment in a large inventory', () => {
    const old = item('old');
    const full = Array.from({ length: 30 }, (_, index) => item(`kept-${index}`));
    const base = createGuildProfile(GUILD_GAME_CONTENT);
    const profile = {
      ...base,
      inventory: full,
      party: base.party.map((hero) =>
        hero.definitionId === 'brann' ? { ...hero, equipment: { weapon: old } } : hero,
      ),
    };

    const kept = resolveItemChoice(profile, item('new-kept'), 'keep', 'brann');
    expect(kept.profile.inventory).toHaveLength(31);

    const equipped = resolveItemChoice(profile, item('new-equipped'), 'equip', 'brann');
    expect(equipped.profile.inventory).toContainEqual(old);
    expect(equipped.profile.gold).toBe(profile.gold);

    const sold = resolveItemChoice(profile, item('explicit-sale'), 'sell', 'brann');
    expect(sold.profile.gold).toBe(profile.gold + 18);
  });

  it('equips stored loot and returns the replaced item without loss', () => {
    const base = createGuildProfile(GUILD_GAME_CONTENT);
    const stored = item('stored');
    const old = item('old');
    const profile = {
      ...base,
      inventory: [stored],
      party: base.party.map((hero) =>
        hero.definitionId === 'brann' ? { ...hero, equipment: { weapon: old } } : hero,
      ),
    };
    const result = equipStoredItem(profile, stored.id, 'brann');
    expect(result.profile.party[0]?.equipment.weapon?.id).toBe('stored');
    expect(result.profile.inventory.map(({ id }) => id)).toEqual(['old']);
  });

  it('adds loot, unlocks the next hunt, and never grows character stats by level', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const reward = {
      questId: 'border_pack',
      gold: 25,
      clearMs: 30_000,
      items: [item('drop')],
      skillDrops: [profile.skillInventory[0]!],
    };
    const rewarded = applyQuestRewards(profile, reward, GUILD_GAME_CONTENT.quests);
    const slower = applyQuestRewards(
      rewarded,
      { ...reward, items: [], skillDrops: [], clearMs: 40_000 },
      GUILD_GAME_CONTENT.quests,
    );

    expect(rewarded.inventory.map(({ id }) => id)).toContain('drop');
    expect(rewarded.skillInventory).toHaveLength(37);
    expect(rewarded.party).toEqual(profile.party);
    expect(rewarded.unlockedQuestIds).toEqual(['border_pack', 'moonroad_pursuit']);
    expect(slower.questRecords.border_pack).toEqual({ clears: 2, bestClearMs: 30_000 });
  });
});
