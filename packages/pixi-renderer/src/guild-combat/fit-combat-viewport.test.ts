import { describe, expect, it } from 'vitest';

import { fitCombatViewport } from './fit-combat-viewport';

describe('fitCombatViewport', () => {
  it('fits a portrait scene without distorting its aspect ratio', () => {
    expect(fitCombatViewport({ width: 600, height: 900 }, { width: 390, height: 647 })).toEqual({
      scale: 0.65,
      x: 0,
      y: 31,
    });
  });

  it('centers a widescreen scene inside a landscape viewport', () => {
    const fit = fitCombatViewport({ width: 1_000, height: 560 }, { width: 1_280, height: 640 });

    expect(fit.scale).toBeCloseTo(8 / 7);
    expect(fit.x).toBeCloseTo(480 / 7);
    expect(fit.y).toBe(0);
  });
});
