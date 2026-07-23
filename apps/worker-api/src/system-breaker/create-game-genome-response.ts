import {
  createFallbackGameGenome,
  normalizeGameGenome,
  probeGameGenome,
  validateGameGenome,
} from '@expedition/simulation-core';

import type {
  GenerateDraft,
  GenerateDraftInput,
  SystemBreakerBindings,
} from './create-ai-game-genome';

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
    const genome = normalizeGameGenome(draft, input.seed);
    if (genome && validateGameGenome(genome).valid && probeGameGenome(genome).playable) {
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
