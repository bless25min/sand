import type { StatusLayers } from '@expedition/shared-types';

import type { GuildCombatSceneUnit } from './contracts';

export type StatusAuraKind = keyof StatusLayers;
export type StatusAuraTier = 0 | 1 | 2 | 3;

export interface StatusAuraLayerPlan {
  kind: StatusAuraKind;
  motif: 'flame' | 'spore' | 'ripple';
  value: number;
  projectedValue: number;
  tier: StatusAuraTier;
  projectedTier: StatusAuraTier;
  previewDelta: number;
  marks: number;
}

export interface StatusAuraPlan {
  layers: readonly StatusAuraLayerPlan[];
  activeKinds: number;
}

const MOTIFS = {
  burn: 'flame',
  poison: 'spore',
  tide: 'ripple',
} as const;

const statusTier = (value: number): StatusAuraTier => {
  if (value >= 8) return 3;
  if (value >= 4) return 2;
  if (value >= 1) return 1;
  return 0;
};

export function createStatusAuraPlan(unit: GuildCombatSceneUnit): StatusAuraPlan {
  const projected = unit.preview?.afterStatus ?? unit.statusLayers;
  const kinds = ['burn', 'poison', 'tide'] as const;
  const layers = kinds.flatMap((kind): readonly StatusAuraLayerPlan[] => {
    const value = Math.max(0, Math.trunc(unit.statusLayers[kind]));
    const projectedValue = Math.max(0, Math.trunc(projected[kind]));
    const tier = statusTier(value);
    const projectedTier = statusTier(projectedValue);
    if (Math.max(value, projectedValue) === 0) return [];
    return [
      {
        kind,
        motif: MOTIFS[kind],
        value,
        projectedValue,
        tier,
        projectedTier,
        previewDelta: projectedValue - value,
        marks: Math.max(tier, projectedTier) * 2 + 1,
      },
    ];
  });

  return {
    layers,
    activeKinds: layers.filter(({ value }) => value > 0).length,
  };
}
