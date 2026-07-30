export interface Viewport {
  width: number;
  height: number;
}

export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SkillDockLayout extends LayoutRect {
  columns: 3 | 6;
  rows: 1 | 2;
}

export interface BattleLayout {
  mode: 'mobile-portrait' | 'desktop-landscape';
  viewport: LayoutRect;
  header: LayoutRect;
  battlefield: LayoutRect;
  commandLens: LayoutRect;
  skillDock: SkillDockLayout;
  scroll: false;
}

export interface FormationSlot {
  x: number;
  y: number;
}

export interface BattleFormation {
  compact: boolean;
  tapWidth: number;
  tapHeight: number;
  heroes: readonly FormationSlot[];
  enemies: readonly FormationSlot[];
}

export function resolveDesignResolution(frame: Viewport): Viewport {
  const width = Math.max(1, frame.width);
  const height = Math.max(1, frame.height);
  if (width < height) {
    return { width: 720, height: Math.round((720 * height) / width) };
  }
  return { width: Math.round((720 * width) / height), height: 720 };
}

export function resolveBattleLayout(viewport: Viewport): BattleLayout {
  const width = Math.max(1, Math.trunc(viewport.width));
  const height = Math.max(1, Math.trunc(viewport.height));
  const mode = width < height ? 'mobile-portrait' : 'desktop-landscape';
  const headerHeight = mode === 'mobile-portrait' ? 64 : 84;
  const commandLensHeight = mode === 'mobile-portrait' ? 96 : 86;
  const desiredBattlefieldHeight = Math.floor(height * (mode === 'mobile-portrait' ? 0.54 : 0.57));
  const minimumSkillDockHeight = mode === 'mobile-portrait' ? 240 : 160;
  const battlefieldHeight = Math.max(
    1,
    Math.min(
      desiredBattlefieldHeight,
      height - headerHeight - commandLensHeight - minimumSkillDockHeight,
    ),
  );
  const skillDockHeight = Math.max(
    1,
    height - headerHeight - battlefieldHeight - commandLensHeight,
  );

  return {
    mode,
    viewport: { x: 0, y: 0, width, height },
    header: { x: 0, y: 0, width, height: headerHeight },
    battlefield: { x: 0, y: headerHeight, width, height: battlefieldHeight },
    commandLens: {
      x: 0,
      y: headerHeight + battlefieldHeight,
      width,
      height: commandLensHeight,
    },
    skillDock: {
      x: 0,
      y: headerHeight + battlefieldHeight + commandLensHeight,
      width,
      height: skillDockHeight,
      columns: mode === 'mobile-portrait' ? 3 : 6,
      rows: mode === 'mobile-portrait' ? 2 : 1,
    },
    scroll: false,
  };
}

const centeredSlots = (count: number, spacing: number, y: number): FormationSlot[] =>
  Array.from({ length: count }, (_, index) => ({
    x: (index - (count - 1) / 2) * spacing,
    y,
  }));

export function resolveBattleFormation(input: {
  width: number;
  height: number;
  heroCount: number;
  enemyCount: number;
}): BattleFormation {
  const width = Math.max(1, input.width);
  const height = Math.max(1, input.height);
  const compact = width < 900;
  if (!compact) {
    const tapHeight = 190;
    const verticalOffset = Math.max(tapHeight / 2, (height - tapHeight) / 2);
    return {
      compact: false,
      tapWidth: 154,
      tapHeight,
      heroes: centeredSlots(
        input.heroCount,
        Math.max(154, Math.min(175, width * 0.14)),
        -verticalOffset,
      ),
      enemies: centeredSlots(
        input.enemyCount,
        Math.max(154, Math.min(220, width * 0.22)),
        verticalOffset,
      ),
    };
  }

  const tapWidth = Math.min(184, width * 0.25);
  const tapHeight = Math.min(168, height * 0.2);
  const columns = 3;
  const columnSpacing = Math.max(tapWidth, Math.min(210, width * 0.29));
  const rowSpacing = Math.max(tapHeight, Math.min(185, height * 0.22));
  return {
    compact: true,
    tapWidth,
    tapHeight,
    enemies: centeredSlots(
      input.enemyCount,
      Math.max(tapWidth, Math.min(210, width * 0.29)),
      height * 0.27,
    ),
    heroes: Array.from({ length: input.heroCount }, (_, index) => ({
      x: ((index % columns) - 1) * columnSpacing,
      y: -height * 0.03 - Math.floor(index / columns) * rowSpacing,
    })),
  };
}
