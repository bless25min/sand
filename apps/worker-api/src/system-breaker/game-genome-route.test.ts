import { describe, expect, it } from 'vitest';

import type { GameGenome } from '@expedition/shared-types';
import { createFallbackGameGenome } from '@expedition/simulation-core';

import { createWorkerApp } from '../index';

interface GenomePayload {
  genome: GameGenome;
  source: 'AI' | 'FALLBACK';
  seed: string;
}

const requestGenome = (app: ReturnType<typeof createWorkerApp>, body: unknown) =>
  app.request('/game-genomes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /game-genomes', () => {
  it('rejects prompts outside the 1–240 character contract', async () => {
    const app = createWorkerApp({ generateDraft: async () => null });

    expect((await requestGenome(app, { prompt: '' })).status).toBe(400);
    expect((await requestGenome(app, { prompt: 'x'.repeat(241) })).status).toBe(400);
  });

  it.each([
    ['invalid draft', async () => ({ modules: [] })],
    ['AI error', async () => Promise.reject(new Error('provider failed'))],
  ])('returns a deterministic fallback for %s', async (_label, generateDraft) => {
    const app = createWorkerApp({ generateDraft });

    const response = await requestGenome(app, { prompt: '裂隙市場', seed: 'fallback-7' });
    const payload = (await response.json()) as GenomePayload;

    expect(payload).toEqual({
      genome: createFallbackGameGenome({ prompt: '裂隙市場', seed: 'fallback-7' }),
      source: 'FALLBACK',
      seed: 'fallback-7',
    });
  });

  it('falls back after the injected generation timeout', async () => {
    const app = createWorkerApp({
      generateDraft: () => new Promise(() => undefined),
      timeoutMs: 5,
    });

    const response = await requestGenome(app, { prompt: '逾時世界', seed: 'timeout' });

    expect(((await response.json()) as GenomePayload).source).toBe('FALLBACK');
  });

  it('exposes browser-safe CORS headers', async () => {
    const app = createWorkerApp({ generateDraft: async () => null });
    const response = await app.request('/game-genomes', {
      method: 'OPTIONS',
      headers: { Origin: 'https://example.com' },
    });

    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });
});
