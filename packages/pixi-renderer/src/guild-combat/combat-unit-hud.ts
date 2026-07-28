import type { StatusLayers } from '@expedition/shared-types';

import type { GuildCombatSceneUnit } from './contracts';

export interface CombatUnitHud {
  hpLabel: string;
  statLabel: string;
  projectedHpLabel: string | undefined;
  statuses: readonly string[];
  damage: number;
  healing: number;
}

const STATUS_LABELS: Readonly<Record<keyof StatusLayers, string>> = {
  burn: '燃',
  poison: '毒',
  tide: '潮',
};

export function createCombatUnitHud(unit: GuildCombatSceneUnit): CombatUnitHud {
  const currentHp = unit.currentHp ?? Math.round(unit.hpRatio * (unit.maxHp ?? 100));
  const maxHp = unit.maxHp ?? 100;
  const statuses = (Object.keys(STATUS_LABELS) as (keyof StatusLayers)[])
    .filter((key) => unit.statusLayers[key] > 0 || (unit.preview?.afterStatus[key] ?? 0) > 0)
    .map((key) => {
      const before = unit.statusLayers[key];
      const after = unit.preview?.afterStatus[key] ?? before;
      return `${STATUS_LABELS[key]}${before}${before === after ? '' : `→${after}`}`;
    });
  if (unit.preview && unit.preview.afterDefenseReduction !== (unit.defenseReduction ?? 0)) {
    statuses.push(`削防${unit.preview.afterDefenseReduction}`);
  }
  if (unit.preview && unit.preview.afterStrengthened !== (unit.strengthened ?? 0)) {
    statuses.push(`強化${unit.preview.afterStrengthened}`);
  }

  return {
    hpLabel: `${currentHp} / ${maxHp}`,
    statLabel: `攻 ${unit.attack ?? 0} · 防 ${Math.max(
      0,
      (unit.defense ?? 0) - (unit.defenseReduction ?? 0),
    )}`,
    projectedHpLabel: unit.preview ? `${currentHp} → ${unit.preview.afterHp}` : undefined,
    statuses,
    damage: unit.preview?.damage ?? 0,
    healing: unit.preview?.healing ?? 0,
  };
}
