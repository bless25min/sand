import type {
  GuildItemRarity,
  HuntEquipmentDefinition,
  HuntEquipmentItem,
  HuntRewardAxes,
  HuntRewardInput,
  HuntRewards,
} from '@expedition/shared-types';

import type { RandomSource } from '../../rng/random-source';

const RARITY_SCALE: Readonly<Record<GuildItemRarity, number>> = {
  common: 1,
  uncommon: 1.25,
  rare: 1.6,
  epic: 2.1,
  legendary: 2.8,
};

function rarityFor(roll: number, qualityScore: number): GuildItemRarity {
  const adjusted = Math.min(0.999, roll + Math.min(0.28, qualityScore / 2_000));
  if (adjusted < 0.58) return 'common';
  if (adjusted < 0.8) return 'uncommon';
  if (adjusted < 0.93) return 'rare';
  if (adjusted < 0.985) return 'epic';
  return 'legendary';
}

function killedEnemyIds(input: HuntRewardInput) {
  const rewardEnemyIds = new Set(input.hunt.enemies.map((enemy) => enemy.enemyId));
  return input.battle.units
    .filter((unit) => unit.side === 'enemies' && unit.currentHp <= 0 && rewardEnemyIds.has(unit.id))
    .map((unit) => unit.id);
}

function individualOverkill(input: HuntRewardInput) {
  const result: Record<string, number> = {};
  const runtime = input.battle.combo;
  if (!runtime) return result;
  const eventStart = runtime.lastCommandEventStartIndex ?? 0;
  for (const event of runtime.events.slice(eventStart)) {
    if (event.kind !== 'overkill' || !event.targetId) continue;
    result[event.targetId] = (result[event.targetId] ?? 0) + (event.amount ?? 0);
  }
  return result;
}

function calculateAxes(
  input: HuntRewardInput,
  defeatedEnemyIds: readonly string[],
): HuntRewardAxes {
  const defeated = new Set(defeatedEnemyIds);
  const runtime = input.battle.combo;
  const allEnemiesDefeated = input.hunt.enemies.every((enemy) => defeated.has(enemy.enemyId));
  const annihilation =
    input.battle.status === 'victory' && input.hunt.enemies.length >= 2 && allEnemiesDefeated;
  const startRatios = runtime?.lastCommandEnemyStartHpRatios ?? {};
  const perfectAnnihilation =
    annihilation && input.hunt.enemies.every((enemy) => (startRatios[enemy.enemyId] ?? 0) >= 0.9);
  const guardsDefeated =
    input.hunt.guardEnemyIds?.every((enemyId) => defeated.has(enemyId)) ?? false;
  const bossChest =
    annihilation &&
    Boolean(input.hunt.bossEnemyId) &&
    defeated.has(input.hunt.bossEnemyId!) &&
    guardsDefeated;
  const chainWipe = defeatedEnemyIds.length >= 3;
  const quantityMultiplier =
    1 +
    Math.max(0, defeatedEnemyIds.length - 1) * 0.25 +
    (chainWipe ? 0.5 : 0) +
    (annihilation ? 0.5 : 0) +
    (perfectAnnihilation ? 0.5 : 0);

  return {
    multiKill: defeatedEnemyIds.length,
    chainWipe,
    annihilation,
    perfectAnnihilation,
    bossChest,
    quantityMultiplier,
    individualOverkill: individualOverkill(input),
    sharedOverflow: runtime?.metrics.annihilationOverflow ?? 0,
    totalOverkill: runtime?.metrics.totalOverkill ?? 0,
  };
}

function createItem(
  definition: HuntEquipmentDefinition,
  sourceEnemyId: string,
  itemId: string,
  qualityScore: number,
  jackpot: boolean,
  random: RandomSource,
): HuntEquipmentItem {
  const rarity = rarityFor(random.next(), qualityScore);
  const mainValue = Math.max(
    1,
    Math.round(definition.baseValue * RARITY_SCALE[rarity] + qualityScore / 40),
  );
  return {
    id: itemId,
    baseId: definition.id,
    name: definition.name,
    slot: definition.slot,
    rarity,
    mainStat: {
      stat: definition.mainStat,
      value: mainValue,
      sourceId: definition.id,
      label: definition.name,
    },
    affixes: [],
    sellValue: Math.round(mainValue * (jackpot ? 3 : 1.8)),
    ...(definition.ruleIds ? { ruleIds: definition.ruleIds } : {}),
    sourceEnemyId,
    qualityScore,
    jackpot,
  };
}

function generateItems(
  input: HuntRewardInput,
  defeatedEnemyIds: readonly string[],
  axes: HuntRewardAxes,
  random: RandomSource,
) {
  if (input.battle.status !== 'victory') return [];
  const defeated = new Set(defeatedEnemyIds);
  const eligible = input.hunt.enemies.filter((enemy) => defeated.has(enemy.enemyId));
  const itemCount = Math.max(
    eligible.length,
    Math.floor(eligible.length * axes.quantityMultiplier),
  );
  const items = Array.from({ length: itemCount }, (_, index) => {
    const enemy = eligible[index % eligible.length]!;
    const definition =
      enemy.equipment[random.nextInt(0, enemy.equipment.length - 1)] ?? enemy.equipment[0]!;
    const qualityScore = (axes.individualOverkill[enemy.enemyId] ?? 0) + axes.sharedOverflow;
    return createItem(
      definition,
      enemy.enemyId,
      `${input.hunt.id}-${input.profile.nextLootSeed}-${index}`,
      qualityScore,
      false,
      random,
    );
  });

  if (axes.bossChest && input.hunt.annihilationChest) {
    items.push(
      createItem(
        input.hunt.annihilationChest,
        input.hunt.bossEnemyId!,
        `${input.hunt.id}-${input.profile.nextLootSeed}-jackpot`,
        axes.sharedOverflow,
        true,
        random,
      ),
    );
  }
  return items;
}

export function calculateHuntRewards(input: HuntRewardInput, random: RandomSource): HuntRewards {
  const defeatedEnemyIds = killedEnemyIds(input);
  const axes = calculateAxes(input, defeatedEnemyIds);
  const successful = input.battle.status === 'victory';
  const materialMultiplier = successful ? axes.quantityMultiplier : 1;

  return {
    questId: input.hunt.questId,
    huntId: input.hunt.id,
    successful,
    experience: successful ? input.hunt.rewardExperience : 0,
    gold: successful ? input.hunt.rewardGold : 0,
    clearMs: input.battle.elapsedMs,
    materials: input.hunt.enemies.map((enemy) => ({
      id: enemy.material.id,
      name: enemy.material.name,
      quantity: Math.max(1, Math.ceil(enemy.material.baseQuantity * materialMultiplier)),
    })),
    items: generateItems(input, defeatedEnemyIds, axes, random),
    axes,
  };
}
