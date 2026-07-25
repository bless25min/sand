import type { BattleUnit, ComboTransformKind, HuntEnemyTrait } from '@expedition/shared-types';

function isGuardActive(trait: HuntEnemyTrait, units: readonly BattleUnit[]) {
  return Boolean(
    trait.guardedByEnemyIds?.some((enemyId) =>
      units.some((unit) => unit.id === enemyId && unit.currentHp > 0),
    ),
  );
}

export function calculateHuntDamage(
  target: BattleUnit,
  units: readonly BattleUnit[],
  baseAmount: number,
  transforms: readonly ComboTransformKind[] = [],
) {
  const multiplier = (target.huntTraits ?? []).reduce((current, trait) => {
    const guardMultiplier = isGuardActive(trait, units) ? (trait.guardedDamageMultiplier ?? 1) : 1;
    const vulnerabilityMultiplier =
      trait.vulnerableTransform && transforms.includes(trait.vulnerableTransform)
        ? (trait.vulnerabilityMultiplier ?? 1)
        : 1;
    return current * guardMultiplier * vulnerabilityMultiplier;
  }, 1);
  return Math.max(0, Math.round(baseAmount * multiplier));
}
