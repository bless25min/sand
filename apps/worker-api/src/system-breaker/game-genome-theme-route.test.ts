import { describe, expect, it } from 'vitest';

import type { GameGenome } from '@expedition/shared-types';
import {
  createFallbackGameGenome,
  probeGameGenome,
  validateGameGenome,
} from '@expedition/simulation-core';

import { createWorkerApp } from '../index';
import { createGameGenomeThemeFixture } from './game-genome-theme.test-helpers';

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

const readModuleMechanics = (module: GameGenome['modules'][number]) => ({
  id: module.id,
  role: module.role,
  trigger: module.trigger,
  effect: module.effect,
  target: module.target,
  baseValue: module.baseValue,
  cost: module.cost,
  cooldown: module.cooldown,
  repeatOnce: module.repeatOnce,
});

const readThreatMechanics = (threat: GameGenome['threats'][number]) => ({
  id: threat.id,
  round: threat.round,
  kind: threat.kind,
  targetProgress: threat.targetProgress,
  integrityDamage: threat.integrityDamage,
  instabilityGain: threat.instabilityGain,
  modifier: threat.modifier,
  phaseTwoModifier: threat.phaseTwoModifier,
});

describe('POST /game-genomes with AI themes', () => {
  it('compiles a valid theme into a playable genome and preserves the caller seed', async () => {
    const app = createWorkerApp({ generateDraft: async () => createGameGenomeThemeFixture() });

    const response = await requestGenome(app, { prompt: '沉沒的記憶檔案庫', seed: 'fixed-seed' });
    const payload = (await response.json()) as GenomePayload;

    expect(response.status).toBe(200);
    expect(payload.source).toBe('AI');
    expect(payload.seed).toBe('fixed-seed');
    expect(payload.genome.seed).toBe('fixed-seed');
    expect(payload.genome.title).toBe('黑潮檔案庫');
    expect(validateGameGenome(payload.genome).valid).toBe(true);
    expect(probeGameGenome(payload.genome).playable).toBe(true);
  });

  it('preserves every deterministic module and threat mechanic', async () => {
    const input = { prompt: '沉沒的記憶檔案庫', seed: 'mechanics-seed' };
    const fallback = createFallbackGameGenome(input);
    const app = createWorkerApp({ generateDraft: async () => createGameGenomeThemeFixture() });

    const payload = (await (await requestGenome(app, input)).json()) as GenomePayload;

    expect(payload.source).toBe('AI');
    expect(payload.genome.modules.map(readModuleMechanics)).toEqual(
      fallback.modules.map(readModuleMechanics),
    );
    expect(payload.genome.threats.map(readThreatMechanics)).toEqual(
      fallback.threats.map(readThreatMechanics),
    );
    expect(payload.genome.rules).toEqual(fallback.rules);
  });

  it.each([
    [
      'wrong module count',
      {
        ...createGameGenomeThemeFixture(),
        modules: createGameGenomeThemeFixture().modules.slice(0, 11),
      },
    ],
    [
      'unexpected mechanical field',
      {
        ...createGameGenomeThemeFixture(),
        modules: createGameGenomeThemeFixture().modules.map((module, index) => ({
          ...module,
          ...(index === 0 ? { baseValue: 999 } : {}),
        })),
      },
    ],
  ])('returns fallback for an invalid theme: %s', async (_label, theme) => {
    const input = { prompt: '不可信的世界', seed: 'invalid-theme' };
    const app = createWorkerApp({ generateDraft: async () => theme });

    const payload = (await (await requestGenome(app, input)).json()) as GenomePayload;

    expect(payload.source).toBe('FALLBACK');
    expect(payload.genome).toEqual(createFallbackGameGenome(input));
  });
});
