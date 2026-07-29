import { describe, expect, it } from 'vitest';

import type { CombatEffectPlan } from './combat-effect-plan';
import { createEffectMarks } from './combat-effect-language';

const plan = (
  elementMotif: CombatEffectPlan['elementMotif'],
  specializationMotif: CombatEffectPlan['specializationMotif'],
  signatureMarks = 5,
): CombatEffectPlan => ({
  ambientParticles: 32,
  impactParticles: 42,
  impactRings: 5,
  impactTargetIds: ['enemy'],
  cameraZoom: 1.03,
  shakePx: 6,
  hitStopMs: 40,
  afterimageCount: 3,
  screenFlashAlpha: 0.2,
  impactScale: 1.2,
  finisher: false,
  elementMotif,
  specializationMotif,
  signatureMarks,
  route: [],
});

describe('semantic combat effect language', () => {
  it('uses a different visible primitive for every element', () => {
    expect(createEffectMarks(plan('ember-shards', 'impact'))[0]?.kind).toBe('shard');
    expect(createEffectMarks(plan('toxic-spores', 'impact'))[0]?.kind).toBe('spore');
    expect(createEffectMarks(plan('tidal-ribbons', 'impact'))[0]?.kind).toBe('ribbon');
  });

  it('adds a unique signature primitive for all six specializations', () => {
    const motifs = [
      'detonation',
      'layer-orbit',
      'armor-fracture',
      'ricochet',
      'relay-aura',
      'rapid-strikes',
    ] as const;

    expect(
      motifs.map((motif) => createEffectMarks(plan('ember-shards', motif)).at(-1)?.kind),
    ).toEqual(['shockwave', 'orbit', 'fracture', 'ricochet', 'aura', 'slash']);
  });

  it('strictly adds more marks at every relay tier', () => {
    const counts = [1, 2, 3, 4, 5, 6].map(
      (relay) => createEffectMarks(plan('toxic-spores', 'layer-orbit', relay + 2)).length,
    );

    expect(counts.every((count, index) => index === 0 || count > counts[index - 1]!)).toBe(true);
  });
});
