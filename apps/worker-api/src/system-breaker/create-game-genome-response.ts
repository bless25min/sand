import {
  createFallbackGameGenome,
  probeGameGenome,
  validateGameGenome,
} from '@expedition/simulation-core';

import { compileGameGenomeTheme } from './compile-game-genome-theme';
import type {
  GenerateDraft,
  GenerateDraftInput,
  SystemBreakerBindings,
} from './create-ai-game-genome';
import { validateGameGenomeTheme } from './validate-game-genome-theme';

export interface GameGenomeResponse {
  genome: ReturnType<typeof createFallbackGameGenome>;
  source: 'AI' | 'FALLBACK';
  seed: string;
}

const timeout = (milliseconds: number): Promise<never> =>
  new Promise((_, reject) => {
    setTimeout(() => reject(new Error('AI_TIMEOUT')), milliseconds);
  });

export async function createGameGenomeResponse(
  input: GenerateDraftInput,
  generateDraft: GenerateDraft,
  bindings: SystemBreakerBindings | undefined,
  timeoutMs: number,
): Promise<GameGenomeResponse> {
  try {
    const draft = await Promise.race([generateDraft(input, bindings), timeout(timeoutMs)]);
    const theme = validateGameGenomeTheme(draft);
    const genome = compileGameGenomeTheme(input, theme);
    if (validateGameGenome(genome).valid && probeGameGenome(genome).playable) {
      return { genome, source: 'AI', seed: input.seed };
    }
  } catch {
    // A deterministic fallback is the product behavior for every provider failure.
  }
  return {
    genome: createFallbackGameGenome(input),
    source: 'FALLBACK',
    seed: input.seed,
  };
}
