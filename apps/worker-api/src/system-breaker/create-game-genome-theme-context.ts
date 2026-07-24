import { createFallbackGameGenome } from '@expedition/simulation-core';

export function createGameGenomeThemeContext(input: { prompt: string; seed: string }): string {
  const genome = createFallbackGameGenome(input);
  const modules = genome.modules.map(
    (module, index) =>
      `modules[${index}]: role=${module.role}; trigger=${module.trigger}; effect=${module.effect}; target=${module.target}; baseValue=${module.baseValue}; cost=${module.cost}; cooldown=${module.cooldown}; repeatOnce=${module.repeatOnce === true}`,
  );
  const threats = genome.threats.map(
    (threat, index) =>
      `threats[${index}]: round=${threat.round}; kind=${threat.kind}; targetProgress=${threat.targetProgress}; integrityDamage=${threat.integrityDamage}; instabilityGain=${threat.instabilityGain}; modifier=${threat.modifier}; phaseTwoModifier=${threat.phaseTwoModifier ?? 'NONE'}`,
  );
  const counters = genome.counters.map(
    (counter, index) =>
      `counters[${index}]: role=${counter.role}; outputMultiplier=${counter.outputMultiplier}`,
  );
  return [...modules, ...threats, ...counters].join('\n');
}
