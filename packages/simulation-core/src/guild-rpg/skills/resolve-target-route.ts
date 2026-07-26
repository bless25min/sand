import type { BattleUnit } from '@expedition/shared-types';

function livingEnemies(units: readonly BattleUnit[]) {
  return units.filter((unit) => unit.side === 'enemies' && unit.currentHp > 0);
}

export function resolveTargetRoute(
  units: readonly BattleUnit[],
  preferredTargetId: string | undefined,
  previousTargetId: string | undefined,
  chain: boolean,
): { target?: BattleUnit; bounced: boolean; echoed: boolean } {
  const enemies = livingEnemies(units);
  if (enemies.length === 0) return { bounced: false, echoed: false };

  const preferred = enemies.find((enemy) => enemy.id === preferredTargetId);
  if (!chain) {
    const target = preferred ?? enemies[0]!;
    return { target, bounced: false, echoed: false };
  }

  const alternative = enemies.find((enemy) => enemy.id !== previousTargetId);
  const target = alternative ?? preferred ?? enemies[0]!;
  return {
    target,
    bounced: Boolean(previousTargetId && target.id !== previousTargetId),
    echoed: Boolean(previousTargetId && target.id === previousTargetId && enemies.length === 1),
  };
}
