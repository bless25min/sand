import type { Hono } from 'hono';

import type { GenerateDraft, SystemBreakerBindings } from './create-ai-game-genome';
import { createGameGenomeResponse } from './create-game-genome-response';

export interface GameGenomeRouteDependencies {
  generateDraft: GenerateDraft;
  timeoutMs: number;
}

function parseInput(value: unknown): { prompt: string; seed: string } | null {
  if (!value || typeof value !== 'object') return null;
  const draft = value as { prompt?: unknown; seed?: unknown };
  if (typeof draft.prompt !== 'string') return null;
  const prompt = draft.prompt.trim();
  if (prompt.length < 1 || prompt.length > 240) return null;
  if (
    draft.seed !== undefined &&
    (typeof draft.seed !== 'string' || draft.seed.length < 1 || draft.seed.length > 80)
  )
    return null;
  return { prompt, seed: draft.seed ?? crypto.randomUUID() };
}

export function registerGameGenomeRoute(
  app: Hono<{ Bindings: SystemBreakerBindings }>,
  dependencies: GameGenomeRouteDependencies,
): void {
  app.post('/game-genomes', async (context) => {
    let body: unknown;
    try {
      body = await context.req.json();
    } catch {
      return context.json({ error: 'INVALID_JSON' }, 400);
    }
    const input = parseInput(body);
    if (!input) return context.json({ error: 'INVALID_GAME_GENOME_REQUEST' }, 400);
    const response = await createGameGenomeResponse(
      input,
      dependencies.generateDraft,
      context.env,
      dependencies.timeoutMs,
    );
    return context.json(response);
  });
}
