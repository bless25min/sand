import { describe, expect, it } from 'vitest';

import { createFallbackGameGenome } from '@expedition/simulation-core';

import { createAiGameGenome, type SystemBreakerBindings } from './create-ai-game-genome';
import { createGameGenomeThemeFixture } from './game-genome-theme.test-helpers';

interface ProviderRequest {
  messages: Array<{ role: string; content: string }>;
  response_format: {
    type: string;
    json_schema: {
      type: string;
      additionalProperties: boolean;
      properties: Record<string, unknown>;
    };
  };
  max_tokens: number;
}

interface ProviderCall {
  model: string;
  request: ProviderRequest;
}

const hasStrictObjectSchemas = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.every(hasStrictObjectSchemas);
  if (!value || typeof value !== 'object') return true;
  const object = value as Record<string, unknown>;
  if (object.type === 'object' && object.additionalProperties !== false) return false;
  return Object.values(object).every(hasStrictObjectSchemas);
};

const createBindings = (response: unknown, calls: ProviderCall[]) =>
  ({
    AI: {
      run: async (model: string, input: unknown) => {
        calls.push({ model, request: input as ProviderRequest });
        return response;
      },
    },
  }) satisfies SystemBreakerBindings;

describe('createAiGameGenome', () => {
  it('requests only the compact theme schema with a reduced token budget', async () => {
    const calls: ProviderCall[] = [];
    const theme = createGameGenomeThemeFixture();
    const bindings = createBindings({ response: theme }, calls);

    await createAiGameGenome({ prompt: '沉沒檔案庫', seed: 'provider-seed' }, bindings);

    const { model, request } = calls[0]!;
    expect(model).toBe('@cf/meta/llama-3.1-8b-instruct-fast');
    expect(Object.keys(request.response_format.json_schema.properties)).toEqual([
      'title',
      'premise',
      'aliases',
      'winDescription',
      'failDescription',
      'modules',
      'threats',
      'counters',
      'endings',
    ]);
    expect(JSON.stringify(request.response_format.json_schema)).not.toMatch(
      /baseValue|cooldown|cost|effect|id|kind|modifier|outputMultiplier|role|round|rules|seed|target|trigger|value/,
    );
    expect(hasStrictObjectSchemas(request.response_format.json_schema)).toBe(true);
    expect(request.max_tokens).toBeLessThan(2_200);
  });

  it('provides ordered mechanics context without requesting mechanics in the response', async () => {
    const calls: ProviderCall[] = [];
    const input = { prompt: '沉沒檔案庫', seed: 'context-seed' };
    const fallback = createFallbackGameGenome(input);

    await createAiGameGenome(
      input,
      createBindings({ response: createGameGenomeThemeFixture() }, calls),
    );

    const prompt = calls[0]!.request.messages.map((message) => message.content).join('\n');
    const firstModule = fallback.modules[0]!;
    const boss = fallback.threats[6]!;
    expect(prompt).toContain(
      `modules[0]: role=${firstModule.role}; trigger=${firstModule.trigger}; effect=${firstModule.effect}; target=${firstModule.target}`,
    );
    expect(prompt).toContain(
      `threats[6]: round=${boss.round}; kind=${boss.kind}; targetProgress=${boss.targetProgress}; integrityDamage=${boss.integrityDamage}; instabilityGain=${boss.instabilityGain}; modifier=${boss.modifier}; phaseTwoModifier=${boss.phaseTwoModifier}`,
    );
    expect(prompt).toContain(`counters[0]: role=${fallback.counters[0].role}`);
    expect(prompt).not.toContain(input.seed);
  });

  it.each([
    ['object', (theme: unknown) => ({ response: theme })],
    ['string', (theme: unknown) => ({ response: JSON.stringify(theme) })],
  ])('accepts the Workers AI %s response form', async (_label, createResponse) => {
    const calls: ProviderCall[] = [];
    const theme = createGameGenomeThemeFixture();

    const draft = await createAiGameGenome(
      { prompt: '沉沒檔案庫', seed: 'response-shape' },
      createBindings(createResponse(theme), calls),
    );

    expect(draft).toEqual(theme);
  });
});
