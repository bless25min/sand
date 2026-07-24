import type { GameGenome } from '@expedition/shared-types';
import { createFallbackGameGenome } from '@expedition/simulation-core';

import type { GameGenomeTheme } from './validate-game-genome-theme';

export interface CompileGameGenomeThemeInput {
  prompt: string;
  seed: string;
}

export function compileGameGenomeTheme(
  input: CompileGameGenomeThemeInput,
  theme: GameGenomeTheme,
): GameGenome {
  const fallback = createFallbackGameGenome(input);

  return {
    ...fallback,
    title: theme.title,
    premise: theme.premise,
    aliases: { ...theme.aliases },
    winDescription: theme.winDescription,
    failDescription: theme.failDescription,
    modules: fallback.modules.map((module, index) => ({
      ...module,
      ...theme.modules[index],
    })),
    threats: fallback.threats.map((threat, index) => ({
      ...threat,
      ...theme.threats[index],
    })),
    counters: [
      { ...fallback.counters[0], label: theme.counters[0]! },
      { ...fallback.counters[1], label: theme.counters[1]! },
      { ...fallback.counters[2], label: theme.counters[2]! },
    ],
    endings: {
      victory: { ...theme.endings.victory },
      defeat: { ...theme.endings.defeat },
    },
  };
}
