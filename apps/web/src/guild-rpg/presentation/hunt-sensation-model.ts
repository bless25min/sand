import type { GuildGameContent } from '@expedition/shared-types';

export function createHuntSensationModel(
  questId: string,
  selectedBuildId: string,
  content: GuildGameContent,
) {
  const quest = content.quests.find((candidate) => candidate.id === questId)!;
  const hunt = content.hunts.find((candidate) => candidate.questId === questId)!;
  const build = content.builds.find((candidate) => candidate.id === selectedBuildId)!;
  const enemyById = new Map(quest.enemies.map((enemy) => [enemy.id, enemy]));
  const executionIds = [
    ...(hunt.guardEnemyIds ?? []),
    ...(hunt.bossEnemyId ? [hunt.bossEnemyId] : []),
    ...hunt.enemies
      .map((enemy) => enemy.enemyId)
      .filter(
        (enemyId) => enemyId !== hunt.bossEnemyId && !(hunt.guardEnemyIds ?? []).includes(enemyId),
      ),
  ];

  return {
    build,
    executionOrder: executionIds.flatMap((enemyId) => {
      const enemy = enemyById.get(enemyId);
      return enemy ? [enemy.name] : [];
    }),
    counterTargets: hunt.enemies.flatMap((enemy) =>
      enemy.traits?.some((trait) => trait.counterBuildIds.includes(build.id))
        ? [enemyById.get(enemy.enemyId)?.name ?? enemy.enemyId]
        : [],
    ),
    exclusiveDropNames: hunt.enemies.flatMap((enemy) => enemy.equipment.map((item) => item.name)),
    chestName: hunt.annihilationChest?.name,
  };
}
