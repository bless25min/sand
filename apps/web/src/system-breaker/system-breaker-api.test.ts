import { describe, expect, it } from 'vitest';

import { createFallbackGameGenome } from '@expedition/simulation-core';

import { generateGameGenome } from './system-breaker-api';

describe('generateGameGenome', () => {
  it('returns a validated API payload', async () => {
    const genome = createFallbackGameGenome({ prompt: 'API 世界', seed: 'api' });
    const response = await generateGameGenome({
      prompt: 'API 世界',
      seed: 'api',
      fetcher: async () =>
        new Response(JSON.stringify({ genome, source: 'AI', seed: 'api' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    });

    expect(response).toEqual({ genome, source: 'AI', seed: 'api' });
  });

  it('uses the local deterministic fallback when the API is unavailable', async () => {
    const response = await generateGameGenome({
      prompt: '離線世界',
      seed: 'offline',
      fetcher: async () => Promise.reject(new Error('offline')),
    });

    expect(response.source).toBe('FALLBACK');
    expect(response.genome).toEqual(
      createFallbackGameGenome({ prompt: '離線世界', seed: 'offline' }),
    );
  });
});
