import type { CombatEffectPlan } from './combat-effect-plan';

type EffectMarkKind =
  | 'shard'
  | 'spore'
  | 'ribbon'
  | 'spark'
  | 'shockwave'
  | 'orbit'
  | 'fracture'
  | 'ricochet'
  | 'aura'
  | 'slash';

export interface EffectMark {
  kind: EffectMarkKind;
  angle: number;
  distance: number;
  size: number;
}

const elementKind = (motif: CombatEffectPlan['elementMotif']): EffectMarkKind => {
  if (motif === 'ember-shards') return 'shard';
  if (motif === 'toxic-spores') return 'spore';
  if (motif === 'tidal-ribbons') return 'ribbon';
  return 'spark';
};

const specializationKind = (
  motif: CombatEffectPlan['specializationMotif'],
): EffectMarkKind | undefined => {
  if (motif === 'detonation') return 'shockwave';
  if (motif === 'layer-orbit') return 'orbit';
  if (motif === 'armor-fracture') return 'fracture';
  if (motif === 'ricochet') return 'ricochet';
  if (motif === 'relay-aura') return 'aura';
  if (motif === 'rapid-strikes') return 'slash';
  return undefined;
};

export function createEffectMarks(plan: CombatEffectPlan): readonly EffectMark[] {
  const marks: EffectMark[] = [];
  for (let index = 0; index < plan.signatureMarks; index += 1) {
    marks.push({
      kind: elementKind(plan.elementMotif),
      angle: (index / Math.max(1, plan.signatureMarks)) * Math.PI * 2,
      distance: 32 + (index % 4) * 11,
      size: 4 + (index % 3) * 2,
    });
  }
  const signature = specializationKind(plan.specializationMotif);
  if (!signature) return marks;
  const signatureCount = Math.max(2, Math.ceil(plan.signatureMarks / 2));
  for (let index = 0; index < signatureCount; index += 1) {
    marks.push({
      kind: signature,
      angle: (index / signatureCount) * Math.PI * 2,
      distance: signature === 'orbit' || signature === 'ricochet' ? 58 : 18 + index * 5,
      size: 12 + index * 3,
    });
  }
  return marks;
}
