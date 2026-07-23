import type { GameGenome } from '@expedition/shared-types';

const clampInteger = (value: unknown, minimum: number, maximum: number): number => {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : minimum;
  return Math.min(maximum, Math.max(minimum, numeric));
};

const cleanText = (value: unknown, maximum = 80): string =>
  String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maximum);

export function normalizeGameGenome(input: unknown, seed: string): GameGenome | null {
  if (!input || typeof input !== 'object') return null;
  const draft = input as Partial<GameGenome>;
  if (!Array.isArray(draft.modules) || !Array.isArray(draft.threats)) return null;
  if (!Array.isArray(draft.rules) || !Array.isArray(draft.counters)) return null;

  return {
    ...draft,
    version: 1,
    seed,
    title: cleanText(draft.title),
    premise: cleanText(draft.premise, 240),
    winDescription: cleanText(draft.winDescription, 160),
    failDescription: cleanText(draft.failDescription, 160),
    aliases: {
      PROGRESS: cleanText(draft.aliases?.PROGRESS, 16),
      INTEGRITY: cleanText(draft.aliases?.INTEGRITY, 16),
      INSTABILITY: cleanText(draft.aliases?.INSTABILITY, 16),
      CREDITS: cleanText(draft.aliases?.CREDITS, 16),
    },
    rules: draft.rules.slice(0, 2) as GameGenome['rules'],
    modules: draft.modules.slice(0, 12).map((module) => ({
      ...module,
      id: cleanText(module.id, 40),
      name: cleanText(module.name, 32),
      description: cleanText(module.description, 160),
      baseValue: clampInteger(module.baseValue, 0, 30),
      cost: clampInteger(module.cost, 1, 20),
      cooldown: clampInteger(module.cooldown, 0, 3),
    })),
    threats: draft.threats.slice(0, 7).map((threat, index) => ({
      ...threat,
      id: cleanText(threat.id, 40),
      round: index + 1,
      name: cleanText(threat.name, 40),
      telegraph: cleanText(threat.telegraph, 160),
      targetProgress: clampInteger(threat.targetProgress, 1, 100),
      integrityDamage: clampInteger(threat.integrityDamage, 0, 50),
      instabilityGain: clampInteger(threat.instabilityGain, 0, 50),
    })),
    counters: draft.counters.slice(0, 3).map((counter) => ({
      ...counter,
      id: cleanText(counter.id, 40),
      label: cleanText(counter.label, 80),
      outputMultiplier: Math.min(1, Math.max(0.1, Number(counter.outputMultiplier) || 0.65)),
    })) as GameGenome['counters'],
    endings: {
      victory: {
        title: cleanText(draft.endings?.victory.title, 40),
        description: cleanText(draft.endings?.victory.description, 160),
      },
      defeat: {
        title: cleanText(draft.endings?.defeat.title, 40),
        description: cleanText(draft.endings?.defeat.description, 160),
      },
    },
  } as GameGenome;
}
