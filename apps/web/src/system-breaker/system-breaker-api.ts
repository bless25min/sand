import type { GameGenome } from '@expedition/shared-types';
import {
  createFallbackGameGenome,
  normalizeGameGenome,
  probeGameGenome,
  validateGameGenome,
} from '@expedition/simulation-core';

export interface GameGenomeGeneration {
  genome: GameGenome;
  source: 'AI' | 'FALLBACK';
  seed: string;
}

type FetchPort = (input: string, init?: RequestInit) => Promise<Response>;

function localFallback(prompt: string, seed: string): GameGenomeGeneration {
  return {
    genome: createFallbackGameGenome({ prompt, seed }),
    source: 'FALLBACK',
    seed,
  };
}

export async function generateGameGenome(input: {
  prompt: string;
  seed: string;
  fetcher?: FetchPort;
  apiBaseUrl?: string;
}): Promise<GameGenomeGeneration> {
  const fetcher = input.fetcher ?? fetch;
  const baseUrl =
    input.apiBaseUrl ?? (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';
  try {
    const response = await fetcher(`${baseUrl.replace(/\/$/, '')}/game-genomes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: input.prompt, seed: input.seed }),
    });
    if (!response.ok) return localFallback(input.prompt, input.seed);
    const payload = (await response.json()) as Partial<GameGenomeGeneration>;
    const genome = normalizeGameGenome(payload.genome, input.seed);
    if (
      !genome ||
      !validateGameGenome(genome).valid ||
      !probeGameGenome(genome).playable ||
      (payload.source !== 'AI' && payload.source !== 'FALLBACK')
    )
      return localFallback(input.prompt, input.seed);
    return { genome, source: payload.source, seed: input.seed };
  } catch {
    return localFallback(input.prompt, input.seed);
  }
}
