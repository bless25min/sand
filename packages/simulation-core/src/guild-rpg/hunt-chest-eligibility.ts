import type { HuntDefinition } from '@expedition/shared-types';

export function qualifiesForHuntChest(
  hunt: HuntDefinition,
  defeatedEnemyIds: ReadonlySet<string>,
  annihilation: boolean,
) {
  if (!annihilation || !hunt.annihilationChest) return false;
  const requiredEnemyIds = hunt.bossEnemyId
    ? [hunt.bossEnemyId, ...(hunt.guardEnemyIds ?? [])]
    : hunt.guardEnemyIds?.length
      ? hunt.guardEnemyIds
      : hunt.enemies.map((enemy) => enemy.enemyId);
  return (
    requiredEnemyIds.length > 0 &&
    requiredEnemyIds.every((enemyId) => defeatedEnemyIds.has(enemyId))
  );
}

export function huntChestSourceEnemyId(hunt: HuntDefinition) {
  if (hunt.bossEnemyId) return hunt.bossEnemyId;
  const executionIds = hunt.guardEnemyIds ?? hunt.enemies.map((enemy) => enemy.enemyId);
  return executionIds[executionIds.length - 1];
}
