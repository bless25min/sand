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
  const activeTraits = target.huntTraits ?? [];
  const guardReduction = activeTraits
    .filter((trait) => isGuardActive(trait, units))
    .reduce((total) => total + target.stats.defense, 0);
  const vulnerabilityAddition = activeTraits
    .filter(
      (trait) =>
        Boolean(trait.vulnerableTransform) && transforms.includes(trait.vulnerableTransform!),
    )
    .reduce((total) => total + target.stats.attack, 0);
  return Math.max(0, Math.round(baseAmount - guardReduction + vulnerabilityAddition));
}
