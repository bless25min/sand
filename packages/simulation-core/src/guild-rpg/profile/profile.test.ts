import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { EquipmentItem, GuildBattleState, GuildItemRarity } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import type { RandomSource } from '../../rng/random-source';
import { createSeededRandom } from '../../rng/seeded-random';
import { resolveItemChoice } from '../equipment/resolve-item-choice';
import { equipStoredItem } from '../equipment/equip-stored-item';
import { equipmentPower } from '../equipment/compare-equipment';
import { compileBuild } from '../combo/compile-build';
import { createGuildProfile } from './create-profile';
import { applyQuestRewards } from '../rewards/apply-rewards';
import { generateEquipmentItem, generateQuestRewards } from '../rewards/generate-rewards';

class FixedRandom implements RandomSource {
  constructor(private readonly value: number) {}
  next() {
    return this.value;
  }
  nextInt(minimum: number) {
    return minimum;
  }
}

function finishedBattle(status: 'victory' | 'defeat'): GuildBattleState {
  return {
    questId: GUILD_GAME_CONTENT.quests[0]!.id,
    seed: 'reward-battle',
    elapsedMs: 24_500,
    sequence: 12,
    status,
    units: [],
    leaderAuto: false,
    events: [],
  };
}

function item(id: string, slot: EquipmentItem['slot'] = 'weapon'): EquipmentItem {
  return {
    id,
    baseId: 'iron_blade',
    name: `測試裝備 ${id}`,
    slot,
    rarity: 'common',
    mainStat: { stat: 'attack', value: 5 },
    affixes: [],
    sellValue: 10,
  };
}

describe('guild profile and rewards', () => {
  it('creates a three-member profile with only the first quest unlocked', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);

    expect(profile.party).toHaveLength(3);
    expect(profile.leaderId).toBe('lyra');
    expect(profile.unlockedQuestIds).toEqual(['border_pack']);
    expect(profile.inventory).toEqual([]);
    expect(profile.selectedBuildId).toBe('retaliation');
  });

  it('compiles the selected build with rule-bearing equipment', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const ruleItem = { ...item('rule-weapon'), ruleIds: ['steel_echo'] };
    const configured = {
      ...profile,
      selectedBuildId: 'ricochet',
      party: profile.party.map((member) =>
        member.definitionId === 'lyra'
          ? { ...member, equipment: { ...member.equipment, weapon: ruleItem } }
          : member,
      ),
    };

    const compiled = compileBuild(configured, GUILD_GAME_CONTENT);
    expect(compiled.buildId).toBe('ricochet');
    expect(compiled.cardIds).toEqual(
      GUILD_GAME_CONTENT.builds.find((build) => build.id === 'ricochet')?.cardIds,
    );
    expect(compiled.ruleIds).toEqual(expect.arrayContaining(['ricochet_fork', 'steel_echo']));
  });

  it('generates deterministic victory rewards and no defeat reward', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const random = () => createSeededRandom('reward-seed');
    const first = generateQuestRewards(
      profile,
      finishedBattle('victory'),
      GUILD_GAME_CONTENT,
      random(),
    );
    const second = generateQuestRewards(
      profile,
      finishedBattle('victory'),
      GUILD_GAME_CONTENT,
      random(),
    );

    expect(first).toEqual(second);
    expect(first?.items).toHaveLength(2);
    expect(first?.experience).toBe(42);
    expect(first?.gold).toBe(28);
    expect(
      generateQuestRewards(profile, finishedBattle('defeat'), GUILD_GAME_CONTENT, random()),
    ).toBeUndefined();
  });

  it.each([
    [0.1, 'common'],
    [0.7, 'uncommon'],
    [0.9, 'rare'],
    [0.98, 'epic'],
    [0.999, 'legendary'],
  ] as const)('maps rarity roll %s to %s', (roll, rarity) => {
    const generated = generateEquipmentItem(
      GUILD_GAME_CONTENT,
      1,
      `rarity-${rarity}`,
      new FixedRandom(roll),
    );
    const allowedStats = new Set(GUILD_GAME_CONTENT.equipmentAffixes.map((affix) => affix.stat));

    expect(generated.rarity).toBe<GuildItemRarity>(rarity);
    expect(generated.affixes.length).toBeLessThanOrEqual(2);
    expect(generated.affixes.every((affix) => allowedStats.has(affix.stat))).toBe(true);
  });

  it('equips, keeps, and sells without exceeding the 20-slot inventory', () => {
    const fullInventory = Array.from({ length: 20 }, (_, index) => item(`stored-${index}`));
    const profile = {
      ...createGuildProfile(GUILD_GAME_CONTENT),
      inventory: fullInventory,
      party: createGuildProfile(GUILD_GAME_CONTENT).party.map((member) =>
        member.definitionId === 'lyra'
          ? { ...member, equipment: { weapon: item('old-weapon') } }
          : member,
      ),
    };

    const kept = resolveItemChoice(profile, item('new-kept'), 'keep', 'lyra');
    expect(kept.profile.inventory).toHaveLength(20);
    expect(kept.message).toContain('已滿');

    const equipped = resolveItemChoice(profile, item('new-weapon'), 'equip', 'lyra');
    const ranger = equipped.profile.party.find((member) => member.definitionId === 'lyra');
    expect(ranger?.equipment.weapon?.id).toBe('new-weapon');
    expect(equipped.profile.inventory).toHaveLength(20);
    expect(equipped.profile.gold).toBe(profile.gold + 10);

    const sold = resolveItemChoice(profile, item('sold'), 'sell', 'lyra');
    expect(sold.profile.gold).toBe(profile.gold + 10);
  });

  it('equips an item kept in inventory and returns the replaced item', () => {
    const stored = item('stored-upgrade');
    const old = item('equipped-old');
    const profile = {
      ...createGuildProfile(GUILD_GAME_CONTENT),
      inventory: [stored],
      party: createGuildProfile(GUILD_GAME_CONTENT).party.map((member) =>
        member.definitionId === 'lyra' ? { ...member, equipment: { weapon: old } } : member,
      ),
    };

    const result = equipStoredItem(profile, stored.id, 'lyra');
    const ranger = result.profile.party.find((member) => member.definitionId === 'lyra');
    expect(ranger?.equipment.weapon?.id).toBe(stored.id);
    expect(result.profile.inventory.map((entry) => entry.id)).toEqual([old.id]);
  });

  it('normalizes unlike stats when comparing text-only equipment', () => {
    const healthItem = {
      ...item('health-item', 'armor'),
      mainStat: { stat: 'hp' as const, value: 30 },
    };
    const attackItem = {
      ...item('attack-item'),
      mainStat: { stat: 'attack' as const, value: 6 },
    };

    expect(equipmentPower(healthItem)).toBe(equipmentPower(attackItem));
  });

  it('levels repeatedly, unlocks the next quest once, and only improves best time', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const reward = {
      questId: 'border_pack',
      experience: 250,
      gold: 25,
      clearMs: 30_000,
      items: [],
    };
    const first = applyQuestRewards(profile, reward, GUILD_GAME_CONTENT.quests);
    const slower = applyQuestRewards(
      first,
      { ...reward, experience: 0, clearMs: 40_000 },
      GUILD_GAME_CONTENT.quests,
    );

    expect(first.party.every((member) => member.level >= 3)).toBe(true);
    expect(first.unlockedQuestIds).toEqual(['border_pack', 'abandoned_mine']);
    expect(slower.unlockedQuestIds).toEqual(['border_pack', 'abandoned_mine']);
    expect(slower.questRecords.border_pack).toEqual({ clears: 2, bestClearMs: 30_000 });
  });
});
