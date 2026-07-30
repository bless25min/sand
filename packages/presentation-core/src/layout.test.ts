import { describe, expect, it } from 'vitest';

import { resolveBattleFormation, resolveBattleLayout, resolveDesignResolution } from './layout';

describe('resolveBattleLayout', () => {
  it.each([
    [375, 812, 'mobile-portrait'],
    [390, 844, 'mobile-portrait'],
    [1280, 720, 'desktop-landscape'],
    [1920, 1080, 'desktop-landscape'],
  ] as const)('fits %s×%s into one fixed screen', (width, height, mode) => {
    const layout = resolveBattleLayout({ width, height });
    const regions = [layout.header, layout.battlefield, layout.commandLens, layout.skillDock];

    expect(layout.mode).toBe(mode);
    expect(layout.scroll).toBe(false);
    expect(layout.viewport).toEqual({ x: 0, y: 0, width, height });
    expect(
      Math.max(...regions.map(({ y, height: regionHeight }) => y + regionHeight)),
    ).toBeLessThanOrEqual(height);
    expect(layout.skillDock.columns * layout.skillDock.rows).toBe(6);
    expect(layout.battlefield.height).toBeGreaterThan(layout.skillDock.height);
  });

  it('keeps the command lens between the battlefield and the skill dock', () => {
    const layout = resolveBattleLayout({ width: 390, height: 844 });

    expect(layout.commandLens.y).toBe(layout.battlefield.y + layout.battlefield.height);
    expect(layout.skillDock.y).toBe(layout.commandLens.y + layout.commandLens.height);
  });

  it('uses six horizontal skills on desktop and a 3×2 grid on mobile', () => {
    expect(resolveBattleLayout({ width: 1280, height: 720 }).skillDock).toMatchObject({
      columns: 6,
      rows: 1,
    });
    expect(resolveBattleLayout({ width: 390, height: 844 }).skillDock).toMatchObject({
      columns: 3,
      rows: 2,
    });
  });

  it('reserves enough desktop battlefield height for two non-overlapping unit rows', () => {
    const layout = resolveBattleLayout({ width: 1280, height: 720 });
    const formation = resolveBattleFormation({
      width: 1280,
      height: layout.battlefield.height,
      heroCount: 6,
      enemyCount: 3,
    });

    expect(Math.abs(formation.heroes[0]!.y) + formation.tapHeight / 2).toBeLessThanOrEqual(
      layout.battlefield.height / 2,
    );
    expect(Math.abs(formation.enemies[0]!.y) + formation.tapHeight / 2).toBeLessThanOrEqual(
      layout.battlefield.height / 2,
    );
    expect(Math.abs(formation.enemies[0]!.y - formation.heroes[0]!.y)).toBeGreaterThanOrEqual(
      formation.tapHeight,
    );
  });
});

describe('resolveBattleFormation', () => {
  it.each([
    [375, 412],
    [390, 438],
  ])('keeps all six mobile heroes in separate tap targets at %s×%s', (width, height) => {
    const formation = resolveBattleFormation({
      width,
      height,
      heroCount: 6,
      enemyCount: 3,
    });

    expect(formation.compact).toBe(true);
    expect(formation.heroes).toHaveLength(6);
    expect(formation.enemies).toHaveLength(3);
    for (let index = 0; index < formation.heroes.length; index += 1) {
      for (let other = index + 1; other < formation.heroes.length; other += 1) {
        const a = formation.heroes[index]!;
        const b = formation.heroes[other]!;
        const separated =
          Math.abs(a.x - b.x) >= formation.tapWidth || Math.abs(a.y - b.y) >= formation.tapHeight;
        expect(separated).toBe(true);
      }
    }
  });

  it('uses one readable six-hero row on desktop', () => {
    const formation = resolveBattleFormation({
      width: 1280,
      height: 410,
      heroCount: 6,
      enemyCount: 3,
    });

    expect(formation.compact).toBe(false);
    expect(new Set(formation.heroes.map(({ y }) => y)).size).toBe(1);
    expect(formation.heroes[1]!.x - formation.heroes[0]!.x).toBeGreaterThanOrEqual(
      formation.tapWidth,
    );
    expect(Math.abs(formation.enemies[1]!.y - formation.heroes[2]!.y)).toBeGreaterThanOrEqual(
      formation.tapHeight,
    );
  });
});

describe('resolveDesignResolution', () => {
  it('preserves the real frame aspect ratio instead of forcing 1280×720 on phones', () => {
    const phone = resolveDesignResolution({ width: 375, height: 812 });
    const desktop = resolveDesignResolution({ width: 1920, height: 1080 });

    expect(phone).toEqual({ width: 720, height: 1559 });
    expect(phone.height / phone.width).toBeCloseTo(812 / 375, 2);
    expect(desktop).toEqual({ width: 1280, height: 720 });
  });
});
