import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type {
  ComboRuntimeState,
  GuildBattleState,
  EquipmentAffixDefinition,
  GuildProfile,
  HuntDefinition,
} from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import type { RandomSource } from '../../rng/random-source';
import { createGuildProfile } from '../profile/create-profile';
import { calculateHuntRewards } from './calculate-hunt-rewards';

class FixedRandom implements RandomSource {
  constructor(private readonly value: number) {}
  next() {
    return this.value;
  }
  nextInt(minimum: number) {
    return minimum;
  }
}

const hunt: HuntDefinition = {
  id: 'training-hunt',
  questId: 'training',
  pressureLabel: '訓練壓力',
  counterBrief: '訓練對策',
  rewardExperience: 30,
  rewardGold: 20,
  bossEnemyId: 'boss',
  guardEnemyIds: ['guard-a', 'guard-b'],
  enemies: [
    {
      enemyId: 'guard-a',
      material: { id: 'guard-a-shard', name: '甲碎片', baseQuantity: 1 },
      equipment: [
        {
          id: 'guard-a-blade',
          name: '甲之刃',
          slot: 'weapon',
          mainStat: 'attack',
          baseValue: 8,
          recommendedBuildIds: ['retaliation'],
        },
      ],
    },
    {
      enemyId: 'guard-b',
      material: { id: 'guard-b-shard', name: '乙碎片', baseQuantity: 1 },
      equipment: [
        {
          id: 'guard-b-mail',
          name: '乙之甲',
          slot: 'armor',
          mainStat: 'defense',
          baseValue: 8,
          recommendedBuildIds: ['retaliation'],
        },
      ],
    },
    {
      enemyId: 'boss',
      material: { id: 'boss-core', name: '王核', baseQuantity: 2 },
      equipment: [
        {
          id: 'boss-crown',
          name: '王冠',
          slot: 'accessory',
          mainStat: 'speed',
          baseValue: 4,
          recommendedBuildIds: ['ricochet'],
          ruleIds: ['boss-rule'],
        },
      ],
    },
  ],
  annihilationChest: {
    id: 'annihilation-chest',
    name: '殲滅寶箱',
    slot: 'accessory',
    mainStat: 'attack',
    baseValue: 12,
    recommendedBuildIds: ['retaliation', 'ricochet'],
    ruleIds: ['chest-rule'],
  },
};

const equipmentAffixes: readonly EquipmentAffixDefinition[] = [
  { id: 'savage', name: '兇猛', stat: 'attack' },
  { id: 'swift', name: '迅捷', stat: 'speed' },
];

const profile: GuildProfile = {
  ...createGuildProfile(GUILD_GAME_CONTENT),
  unlockedQuestIds: ['training'],
  nextLootSeed: 7,
};

function combo(
  startRatios: Readonly<Record<string, number>>,
  sharedOverflow = 0,
): ComboRuntimeState {
  return {
    phase: 'complete',
    draft: { cardIds: [] },
    availableCardIds: [],
    events: [
      {
        id: 0,
        causalId: 'overkill:guard-a',
        kind: 'overkill',
        message: 'OVERKILL',
        targetId: 'guard-a',
        amount: 40,
      },
    ],
    metrics: {
      comboCount: 3,
      totalDamage: 500,
      totalOverkill: 40 + sharedOverflow,
      defeatedEnemyIds: Object.keys(startRatios),
      annihilationOverflow: sharedOverflow,
    },
    lastCommandEventStartIndex: 0,
    lastCommandEnemyStartHpRatios: startRatios,
  };
}

function battle(
  status: GuildBattleState['status'],
  killedEnemyIds: readonly string[],
  startRatios: Readonly<Record<string, number>> = {},
  sharedOverflow = 0,
): GuildBattleState {
  const enemyIds = ['guard-a', 'guard-b', 'boss'];
  return {
    questId: 'training',
    seed: 'reward-seed',
    elapsedMs: 12_000,
    sequence: 20,
    status,
    units: enemyIds.map((id) => ({
      id,
      name: id,
      side: 'enemies' as const,
      stats: { hp: 100, attack: 1, defense: 1, speed: 1, healing: 0 },
      currentHp: killedEnemyIds.includes(id) ? 0 : 50,
      gauge: 0,
      threat: 0,
      guarding: false,
      isLeader: false,
      skillIds: [],
    })),
    leaderAuto: false,
    events: [],
    combo: combo(startRatios, sharedOverflow),
  };
}

describe('hunt reward calculation', () => {
  it('awards enemy materials but never equipment on failure', () => {
    const rewards = calculateHuntRewards(
      {
        profile,
        battle: battle('defeat', []),
        hunt,
        equipmentAffixes,
        content: GUILD_GAME_CONTENT,
      },
      new FixedRandom(0.5),
    );

    expect(rewards.successful).toBe(false);
    expect(rewards.items).toEqual([]);
    expect(rewards.materials.map((material) => material.id)).toEqual([
      'guard-a-shard',
      'guard-b-shard',
      'boss-core',
    ]);
  });

  it('unlocks only killed enemy equipment and keeps rarity deterministic', () => {
    const input = {
      profile,
      battle: battle('victory', ['guard-a'], { 'guard-a': 1 }),
      hunt,
      equipmentAffixes,
      content: GUILD_GAME_CONTENT,
    };
    const first = calculateHuntRewards(input, new FixedRandom(0.8));
    const second = calculateHuntRewards(input, new FixedRandom(0.8));

    expect(first).toEqual(second);
    expect(first.items).toHaveLength(1);
    expect(first.items[0]).toMatchObject({
      sourceEnemyId: 'guard-a',
    });
    expect(first.items[0]?.coreId).toBeTruthy();
    expect(first.items[0]?.forgeMaterialId).toBeTruthy();
    const base = GUILD_GAME_CONTENT.equipmentBases.find(({ id }) => id === first.items[0]?.baseId)!;
    expect(first.items[0]?.mainStat.value).toBeGreaterThanOrEqual(base.mainStatRoll.min);
    expect(first.items[0]?.mainStat.value).toBeLessThanOrEqual(base.mainStatRoll.max);
  });

  it('stacks every annihilation axis and preserves shared overflow in all item quality', () => {
    const startRatios = { 'guard-a': 1, 'guard-b': 1, boss: 1 };
    const rewards = calculateHuntRewards(
      {
        profile,
        battle: battle('victory', Object.keys(startRatios), startRatios, 180),
        hunt,
        equipmentAffixes,
        content: GUILD_GAME_CONTENT,
      },
      new FixedRandom(0.4),
    );

    expect(rewards.axes).toMatchObject({
      multiKill: 3,
      chainWipe: true,
      annihilation: true,
      perfectAnnihilation: true,
      bossChest: true,
      sharedOverflow: 180,
    });
    expect(rewards.axes.quantityMultiplier).toBeGreaterThan(1);
    expect(rewards.items).toHaveLength(4);
    expect(rewards.items.filter((item) => !item.jackpot).map((item) => item.sourceEnemyId)).toEqual(
      ['guard-a', 'guard-b', 'boss'],
    );
    expect(rewards.items.some((item) => item.jackpot)).toBe(true);
    expect(rewards.items.every((item) => item.qualityScore >= 180)).toBe(true);
    expect(rewards.items.every((item) => item.coreId && item.forgeMaterialId)).toBe(true);
  });

  it('awards the authored annihilation chest even when the hunt has no boss', () => {
    const { bossEnemyId, ...huntWithoutBoss } = hunt;
    void bossEnemyId;
    const noBossHunt: HuntDefinition = {
      ...huntWithoutBoss,
      guardEnemyIds: ['guard-a', 'guard-b', 'boss'],
    };
    const startRatios = { 'guard-a': 1, 'guard-b': 1, boss: 1 };
    const rewards = calculateHuntRewards(
      {
        profile,
        battle: battle('victory', Object.keys(startRatios), startRatios, 120),
        hunt: noBossHunt,
        equipmentAffixes,
        content: GUILD_GAME_CONTENT,
      },
      new FixedRandom(0.4),
    );

    expect(rewards.axes.bossChest).toBe(true);
    expect(rewards.items).toHaveLength(4);
    expect(rewards.items.at(-1)).toMatchObject({
      sourceEnemyId: 'boss',
      jackpot: true,
    });
    expect(rewards.items.at(-1)?.coreId).toBeTruthy();
    expect(rewards.items.at(-1)?.forgeMaterialId).toBeTruthy();
  });

  it.each([
    [0.4, 'common', 0],
    [0.65, 'uncommon', 1],
    [0.85, 'rare', 1],
    [0.94, 'epic', 2],
    [0.99, 'legendary', 2],
  ] as const)('gives %s rarity roll a deterministic %s-affix payoff', (roll, rarity, count) => {
    const rewards = calculateHuntRewards(
      {
        profile,
        battle: battle('victory', ['guard-a'], { 'guard-a': 1 }),
        hunt,
        equipmentAffixes,
        content: GUILD_GAME_CONTENT,
      },
      new FixedRandom(roll),
    );

    expect(rewards.items[0]?.rarity).toBe(rarity);
    expect(rewards.items[0]?.affixes).toHaveLength(count);
    expect(rewards.items[0]?.recommendedBuildIds).toEqual(['retaliation']);
    expect(rewards.items[0]?.affixes.every((affix) => affix.sourceId)).toBe(true);
    expect(rewards.items[0]?.cores).toHaveLength(rarity === 'legendary' ? 2 : 1);
  });

  it('reads v4 additive Overkill events without depending on the retired combo runtime', () => {
    const { combo: retiredCombo, ...baseBattle } = battle('victory', ['guard-a'], { 'guard-a': 1 });
    void retiredCombo;
    const v4Battle = {
      ...baseBattle,
      events: [
        { id: 1, kind: 'unit_defeated' as const, message: '擊破', targetId: 'guard-a' },
        { id: 2, kind: 'overkill' as const, message: 'OVERKILL', targetId: 'guard-a', amount: 240 },
      ],
    };
    const rewards = calculateHuntRewards(
      { profile, battle: v4Battle, hunt, equipmentAffixes, content: GUILD_GAME_CONTENT },
      new FixedRandom(0.4),
    );

    expect(rewards.axes.totalOverkill).toBe(240);
    expect(rewards.axes.individualOverkill).toEqual({ 'guard-a': 240 });
    expect(rewards.items[0]?.qualityScore).toBe(240);
  });

  it('does not award Perfect Annihilation when one enemy started below ninety percent', () => {
    const startRatios = { 'guard-a': 1, 'guard-b': 0.8, boss: 1 };
    const rewards = calculateHuntRewards(
      {
        profile,
        battle: battle('victory', Object.keys(startRatios), startRatios),
        hunt,
        equipmentAffixes,
        content: GUILD_GAME_CONTENT,
      },
      new FixedRandom(0),
    );

    expect(rewards.axes.annihilation).toBe(true);
    expect(rewards.axes.perfectAnnihilation).toBe(false);
  });
});
