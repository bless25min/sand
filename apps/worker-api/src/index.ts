import { Hono } from 'hono';
import { cors } from 'hono/cors';

import {
  createAiGameGenome,
  type GenerateDraft,
  type SystemBreakerBindings,
} from './system-breaker/create-ai-game-genome';
import { registerGameGenomeRoute } from './system-breaker/game-genome-route';

export interface WorkerAppDependencies {
  generateDraft?: GenerateDraft;
  timeoutMs?: number;
}

export function createWorkerApp(dependencies: WorkerAppDependencies = {}) {
  const app = new Hono<{ Bindings: SystemBreakerBindings }>();
  app.use('*', cors({ origin: '*' }));
  app.get('/health', (context) =>
    context.json({
      service: 'worker-api',
      status: 'ok',
    }),
  );
  registerGameGenomeRoute(app, {
    generateDraft: dependencies.generateDraft ?? createAiGameGenome,
    timeoutMs: dependencies.timeoutMs ?? 8_000,
  });
  return app;
}

const app = createWorkerApp();

export default app;
