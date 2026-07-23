import { describe, expect, it } from 'vitest';

import {
  createFallbackGameGenome,
  normalizeGameGenome,
  probeGameGenome,
  validateGameGenome,
} from './index';

describe('system breaker genome', () => {
  it('creates the same complete fallback for the same prompt and seed', () => {
    const input = { prompt: '會吞噬記憶的午夜圖書館', seed: 'run-42' };

    const first = createFallbackGameGenome(input);
    const second = createFallbackGameGenome(input);

    expect(first).toEqual(second);
    expect(first.modules).toHaveLength(12);
    expect(first.threats).toHaveLength(7);
    expect(first.threats.at(-1)?.kind).toBe('BOSS');
    expect(first.rules).toHaveLength(2);
  });

  it('rejects unregistered effects and malformed round-seven bosses', () => {
    const genome = createFallbackGameGenome({ prompt: '故障的天空城', seed: 'unsafe' });
    const unsafe = structuredClone(genome);
    unsafe.modules[0]!.effect = 'RUN_CODE' as never;
    unsafe.threats[6]!.kind = 'NORMAL';

    const result = validateGameGenome(unsafe);

    expect(result.valid).toBe(false);
    expect(result.issues).toContain('modules[0].effect');
    expect(result.issues).toContain('threats[6].kind');
  });

  it('normalizes unsafe display text and clamps numeric ranges', () => {
    const draft = createFallbackGameGenome({ prompt: '測試', seed: 'normalize' });
    const dirty = structuredClone(draft);
    dirty.title = '<script>alert(1)</script>   核心';
    dirty.modules[0]!.name = '  無限\t輸出  ';
    dirty.modules[0]!.baseValue = 99_999;

    const normalized = normalizeGameGenome(dirty, 'normalize');

    expect(normalized?.title).toBe('alert(1) 核心');
    expect(normalized?.modules[0]?.name).toBe('無限 輸出');
    expect(normalized?.modules[0]?.baseValue).toBe(30);
    expect(normalized && validateGameGenome(normalized).valid).toBe(true);
  });

  it('accepts a playable fallback and rejects a zero-output genome', () => {
    const genome = createFallbackGameGenome({ prompt: '逆流鐘塔', seed: 'probe' });
    const powerless = structuredClone(genome);
    powerless.modules.forEach((module) => {
      if (module.effect === 'ADD_PROGRESS' || module.effect === 'DAMAGE_THREAT') {
        module.baseValue = 0;
      }
    });

    expect(probeGameGenome(genome).playable).toBe(true);
    expect(probeGameGenome(powerless)).toEqual({
      playable: false,
      reason: 'NO_PROGRESS_SOURCE',
    });
  });
});
