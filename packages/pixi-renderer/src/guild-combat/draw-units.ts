import { Container, Graphics, Text } from 'pixi.js';

import { createCombatUnitHud } from './combat-unit-hud';
import type { GuildCombatScene, GuildCombatSceneUnit } from './contracts';
import { drawBossPresence } from './draw-boss-presence';
import { drawEnemyFigure, drawHeroFigure } from './draw-figures';
import { drawStatusAuras, type StatusAuraNode } from './draw-status-auras';
import { unitSelectionMarker } from './unit-selection-marker';

export interface UnitNode {
  id: string;
  node: Container;
  baseX: number;
  baseY: number;
  state: GuildCombatSceneUnit['state'];
  auras: readonly StatusAuraNode[];
}

const STATUS_COLORS = {
  burn: 0xff7045,
  poison: 0x9bd34f,
  tide: 0x65d9ef,
} as const;

const unitAccent = (unit: GuildCombatSceneUnit) =>
  unit.hero?.accent ?? unit.enemy?.accent ?? 0xf0d39a;

function drawStatusPips(root: Container, unit: GuildCombatSceneUnit) {
  const after = unit.preview?.afterStatus ?? unit.statusLayers;
  const statuses = [
    ['burn', unit.statusLayers.burn, after.burn],
    ['poison', unit.statusLayers.poison, after.poison],
    ['tide', unit.statusLayers.tide, after.tide],
  ] as const;
  let offset = -43;
  let vertical = -116;
  for (const [kind, before, value] of statuses) {
    if (value <= 0) continue;
    const badge = new Container();
    badge.position.set(
      unit.side === 'heroes' ? 48 : offset,
      unit.side === 'heroes' ? vertical : -148,
    );
    badge.addChild(
      new Graphics()
        .roundRect(0, 0, 42, 25, 9)
        .fill({ color: STATUS_COLORS[kind], alpha: 0.86 })
        .stroke({
          color: 0xffffff,
          width: before === value ? 1 : 3,
          alpha: before === value ? 0.44 : 0.9,
        }),
    );
    const label = new Text({
      text: `${kind === 'burn' ? '燃' : kind === 'poison' ? '毒' : '潮'}${value}`,
      style: {
        fill: 0x07110d,
        fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
        fontSize: 15,
        fontWeight: '900',
      },
    });
    label.anchor.set(0.5);
    label.position.set(21, 12.5);
    badge.addChild(label);
    root.addChild(badge);
    offset += 46;
    vertical += 29;
  }
}

function drawIdentity(root: Container, unit: GuildCombatSceneUnit) {
  const hud = createCombatUnitHud(unit);
  const barWidth = unit.enemy?.crowned ? 112 : 96;
  const currentRatio =
    unit.currentHp === undefined
      ? unit.hpRatio
      : Math.max(0, Math.min(1, unit.currentHp / Math.max(1, unit.maxHp ?? 100)));
  const hp = new Graphics()
    .roundRect(-barWidth / 2, 36, barWidth, 11, 5)
    .fill({ color: 0x0a1211, alpha: 0.88 })
    .roundRect(-barWidth / 2 + 1, 37, (barWidth - 2) * currentRatio, 9, 4)
    .fill({
      color: unit.side === 'heroes' ? 0x62d5a1 : unit.hpRatio < 0.3 ? 0xff6a43 : 0xe55848,
    });
  if (unit.preview) {
    const afterRatio = Math.max(
      0,
      Math.min(1, unit.preview.afterHp / Math.max(1, unit.maxHp ?? 100)),
    );
    if (afterRatio < currentRatio) {
      hp.rect(
        -barWidth / 2 + 1 + (barWidth - 2) * afterRatio,
        37,
        (barWidth - 2) * (currentRatio - afterRatio),
        9,
      ).fill({ color: 0xffb43f, alpha: 0.74 });
    } else if (afterRatio > currentRatio) {
      hp.rect(
        -barWidth / 2 + 1 + (barWidth - 2) * currentRatio,
        37,
        (barWidth - 2) * (afterRatio - currentRatio),
        9,
      ).fill({ color: 0x75e9ff, alpha: 0.78 });
    }
  }
  root.addChild(hp);

  if (hud.impactLabel) {
    const change = new Text({
      text: hud.impactLabel,
      style: {
        fill: 0xffd86f,
        fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
        fontSize: 18,
        fontWeight: '900',
        stroke: { color: 0x1b0903, width: 3 },
      },
    });
    change.anchor.set(0.5);
    change.position.set(0, unit.side === 'enemies' ? -184 : -144);
    root.addChild(change);
  }
}

function drawState(root: Container, unit: GuildCombatSceneUnit, relay: number) {
  const accent = unitAccent(unit);
  const marker = unitSelectionMarker(unit);
  if (marker === 'target') {
    root.addChildAt(
      new Graphics()
        .moveTo(-66, -12)
        .lineTo(-66, 18)
        .lineTo(-42, 18)
        .moveTo(66, -12)
        .lineTo(66, 18)
        .lineTo(42, 18)
        .stroke({ color: 0xff7350, width: 5, alpha: 0.94 }),
      0,
    );
  }
  if (marker === 'actor') {
    root.addChildAt(
      new Graphics()
        .ellipse(0, 7, 60 + relay * 2, 20 + relay)
        .fill({ color: accent, alpha: 0.12 + relay * 0.014 })
        .stroke({ color: accent, width: 4, alpha: 0.82 }),
      0,
    );
  }
  if (marker === 'next') {
    root.addChildAt(
      new Graphics()
        .moveTo(-18, 17)
        .lineTo(0, 27)
        .lineTo(18, 17)
        .stroke({ color: accent, width: 4, alpha: 0.74 }),
      0,
    );
  }
  if (marker === 'relay') {
    root.addChildAt(
      new Graphics()
        .moveTo(-28, 20)
        .quadraticCurveTo(0, 34, 28, 20)
        .stroke({ color: 0x8fffc3, width: 4, alpha: 0.88 }),
      0,
    );
  }
  if (unit.state === 'hit') {
    root.addChild(
      new Graphics()
        .circle(0, -48, 72)
        .fill({ color: 0xffffff, alpha: 0.2 })
        .stroke({ color: accent, width: 8, alpha: 0.9 }),
    );
  }
  if (unit.state === 'broken') {
    root.addChildAt(
      new Graphics()
        .ellipse(0, 7, 70, 26)
        .stroke({ color: 0xffd669, width: 6, alpha: 0.88 })
        .moveTo(-48, -75)
        .lineTo(-15, -32)
        .lineTo(-35, 0)
        .stroke({ color: 0xff7045, width: 5, alpha: 0.82 })
        .moveTo(42, -70)
        .lineTo(12, -25)
        .lineTo(38, 2)
        .stroke({ color: 0xff7045, width: 5, alpha: 0.82 }),
      0,
    );
  }
}

export function drawCombatUnits(
  container: Container,
  scene: GuildCombatScene,
): readonly UnitNode[] {
  return scene.units.map((unit) => {
    const root = new Container();
    root.position.set(unit.x, unit.y);
    drawBossPresence(root, unit, scene.relay, unitAccent(unit));
    drawState(root, unit, scene.relay);
    const auras = drawStatusAuras(root, unit);
    const figure = unit.hero
      ? drawHeroFigure(unit.hero)
      : drawEnemyFigure(
          unit.enemy ?? {
            id: unit.id,
            family: 'greyfang',
            archetype: 'brute',
            primary: 0x728079,
            secondary: 0x28302d,
            accent: 0xe8e5d6,
            scale: 1,
          },
        );
    if (unit.state === 'defeated') {
      const activelyCollapsing =
        scene.event?.eventKind === 'unit_defeated' && scene.event.targetId === unit.id;
      figure.alpha = activelyCollapsing ? 1 : 0.3;
      figure.rotation = activelyCollapsing
        ? 0
        : unit.side === 'enemies'
          ? Math.PI / 2
          : -Math.PI / 2;
      figure.position.y = activelyCollapsing ? 0 : 5;
    } else if (unit.state === 'broken') {
      figure.alpha = 0.76;
      figure.rotation = unit.side === 'enemies' ? 0.12 : -0.12;
      figure.position.y = 14;
      figure.scale.set(0.95);
    }
    root.addChild(figure);
    drawStatusPips(root, unit);
    drawIdentity(root, unit);
    container.addChild(root);
    return {
      id: unit.id,
      node: root,
      baseX: unit.x,
      baseY: unit.y,
      state: unit.state,
      auras,
    };
  });
}
