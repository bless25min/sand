import type { StatusLayers } from '@expedition/shared-types';

import type { GuildCombatSceneUnit } from './contracts';

export interface CombatUnitHud {
  hpLabel: string;
  projectedHpLabel: string | undefined;
  statusPips: readonly string[];
  impactLabel: string | undefined;
}

const STATUS_LABELS: Readonly<Record<keyof StatusLayers, string>> = {
  burn: '燃',
  poison: '毒',
  tide: '潮',
};

export function createCombatUnitHud(unit: GuildCombatSceneUnit): CombatUnitHud {
  const currentHp = unit.currentHp ?? Math.round(unit.hpRatio * (unit.maxHp ?? 100));
  const maxHp = unit.maxHp ?? 100;
  const statusPips = (Object.keys(STATUS_LABELS) as (keyof StatusLayers)[])
    .filter((key) => unit.statusLayers[key] > 0)
    .map((key) => `${STATUS_LABELS[key]}${unit.statusLayers[key]}`);
  const impactLabel =
    (unit.preview?.damage ?? 0) > 0
      ? `−${unit.preview!.damage}`
      : (unit.preview?.healing ?? 0) > 0
        ? `+${unit.preview!.healing}`
        : undefined;

  return {
    hpLabel: `${currentHp}/${maxHp}`,
    projectedHpLabel: unit.preview ? `${currentHp} → ${unit.preview.afterHp}` : undefined,
    statusPips,
    impactLabel,
  };
}
