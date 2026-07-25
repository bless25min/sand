import type { BattleUnit, ComboMetrics } from '@expedition/shared-types';

export interface ComboDamageResult {
  target?: BattleUnit;
  overflow: number;
  defeated: boolean;
  metrics: ComboMetrics;
}

export function applyComboDamage(
  target: BattleUnit | undefined,
  amount: number,
  metrics: ComboMetrics,
  endsEncounter: boolean,
): ComboDamageResult {
  if (!target) {
    return {
      overflow: amount,
      defeated: false,
      metrics: {
        ...metrics,
        totalDamage: metrics.totalDamage + amount,
        totalOverkill: metrics.totalOverkill + amount,
        annihilationOverflow: metrics.annihilationOverflow + amount,
      },
    };
  }

  const overflow = Math.max(0, amount - target.currentHp);
  const nextTarget = { ...target, currentHp: Math.max(0, target.currentHp - amount) };
  const defeated = target.currentHp > 0 && nextTarget.currentHp === 0;
  return {
    target: nextTarget,
    overflow,
    defeated,
    metrics: {
      ...metrics,
      totalDamage: metrics.totalDamage + amount,
      totalOverkill: metrics.totalOverkill + overflow,
      annihilationOverflow: metrics.annihilationOverflow + (endsEncounter ? overflow : 0),
      defeatedEnemyIds: defeated
        ? [...metrics.defeatedEnemyIds, target.id]
        : metrics.defeatedEnemyIds,
    },
  };
}
