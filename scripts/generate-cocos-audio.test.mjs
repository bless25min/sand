import { describe, expect, it } from 'vitest';

import { encodeImpactWave } from './generate-cocos-audio.mjs';

describe('procedural Cocos audio assets', () => {
  it('creates deterministic mono PCM WAV data without external services', () => {
    const first = encodeImpactWave({ tier: 3 });
    const second = encodeImpactWave({ tier: 3 });
    const finisher = encodeImpactWave({ tier: 6, finisher: true });

    expect(first.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(first.subarray(8, 12).toString('ascii')).toBe('WAVE');
    expect(first.equals(second)).toBe(true);
    expect(finisher.length).toBeGreaterThan(first.length);
  });
});
