import type { GameGenome, GenomeProbe } from '@expedition/shared-types';

export function probeGameGenome(genome: GameGenome): GenomeProbe {
  const progress = genome.modules.filter(
    (module) =>
      (module.effect === 'ADD_PROGRESS' || module.effect === 'DAMAGE_THREAT') &&
      module.baseValue > 0,
  );
  if (progress.length === 0) return { playable: false, reason: 'NO_PROGRESS_SOURCE' };

  const survival = genome.modules.some(
    (module) =>
      module.effect === 'REPAIR_INTEGRITY' ||
      module.effect === 'PROTECT' ||
      module.effect === 'REDUCE_INSTABILITY' ||
      module.effect === 'REVIVE',
  );
  if (!survival) return { playable: false, reason: 'NO_SURVIVAL_SOURCE' };

  const outputPerRound = progress.reduce((total, module) => total + module.baseValue, 0);
  const maximumTarget = Math.max(...genome.threats.map((threat) => threat.targetProgress));
  if (outputPerRound * 4 < maximumTarget) {
    return { playable: false, reason: 'INSUFFICIENT_OUTPUT' };
  }

  return { playable: true };
}
