import { describe, expect, it } from 'vitest';

import { createFallbackGameGenome } from '@expedition/simulation-core';

import { compileGameGenomeTheme } from './compile-game-genome-theme';
import { createGameGenomeThemeFixture } from './game-genome-theme.test-helpers';
import { validateGameGenomeTheme } from './validate-game-genome-theme';

describe('GameGenomeTheme', () => {
  it('compiles only approved copy onto the deterministic fallback', () => {
    const input = { prompt: '沉沒的記憶檔案庫', seed: 'pure-compiler' };
    const fallback = createFallbackGameGenome(input);
    const theme = validateGameGenomeTheme(createGameGenomeThemeFixture());

    const genome = compileGameGenomeTheme(input, theme);

    expect(genome).toEqual({
      ...fallback,
      title: theme.title,
      premise: theme.premise,
      aliases: theme.aliases,
      winDescription: theme.winDescription,
      failDescription: theme.failDescription,
      modules: fallback.modules.map((module, index) => ({
        ...module,
        ...theme.modules[index],
      })),
      threats: fallback.threats.map((threat, index) => ({
        ...threat,
        ...theme.threats[index],
      })),
      counters: fallback.counters.map((counter, index) => ({
        ...counter,
        label: theme.counters[index],
      })),
      endings: theme.endings,
    });
  });

  it.each([
    ['missing field', { ...createGameGenomeThemeFixture(), title: undefined }],
    ['extra top-level field', { ...createGameGenomeThemeFixture(), rules: ['EDGE_CREDIT'] }],
    [
      'extra nested field',
      {
        ...createGameGenomeThemeFixture(),
        endings: {
          ...createGameGenomeThemeFixture().endings,
          victory: {
            ...createGameGenomeThemeFixture().endings.victory,
            score: 999,
          },
        },
      },
    ],
    ['empty text', { ...createGameGenomeThemeFixture(), premise: '   ' }],
    ['overlong text', { ...createGameGenomeThemeFixture(), title: 'x'.repeat(81) }],
    [
      'wrong threat count',
      {
        ...createGameGenomeThemeFixture(),
        threats: createGameGenomeThemeFixture().threats.slice(0, 6),
      },
    ],
  ])('rejects untrusted input with %s', (_label, input) => {
    expect(() => validateGameGenomeTheme(input)).toThrow();
  });
});
