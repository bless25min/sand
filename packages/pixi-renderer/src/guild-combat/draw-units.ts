import { Container, Graphics, Text } from 'pixi.js';

import type { GuildCombatScene, GuildCombatSceneUnit } from './contracts';
import { drawEnemyFigure, drawHeroFigure } from './draw-figures';

export interface UnitNode {
  id: string;
  node: Container;
  baseX: number;
  baseY: number;
  state: GuildCombatSceneUnit['state'];
}

const STATUS_COLORS = {
  burn: 0xff7045,
  poison: 0x9bd34f,
  tide: 0x65d9ef,
} as const;

const unitAccent = (unit: GuildCombatSceneUnit) =>
  unit.hero?.accent ?? unit.enemy?.accent ?? 0xf0d39a;

function drawStatusPips(root: Container, unit: GuildCombatSceneUnit) {
  const statuses = [
    ['burn', unit.statusLayers.burn],
    ['poison', unit.statusLayers.poison],
    ['tide', unit.statusLayers.tide],
  ] as const;
  let offset = -43;
  for (const [kind, value] of statuses) {
    if (value <= 0) continue;
    const badge = new Container();
    badge.position.set(offset, -148);
    badge.addChild(
      new Graphics()
        .roundRect(0, 0, 34, 20, 8)
        .fill({ color: STATUS_COLORS[kind], alpha: 0.86 })
        .stroke({ color: 0xffffff, width: 1, alpha: 0.44 }),
    );
    const label = new Text({
      text: `${kind === 'burn' ? '燃' : kind === 'poison' ? '毒' : '潮'}${value}`,
      style: {
        fill: 0x07110d,
        fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
        fontSize: 11,
        fontWeight: '900',
      },
    });
    label.anchor.set(0.5);
    label.position.set(17, 10);
    badge.addChild(label);
    root.addChild(badge);
    offset += 38;
  }
}

function drawIdentity(root: Container, unit: GuildCombatSceneUnit) {
  const name = new Text({
    text: unit.name,
    style: {
      fill: unit.state === 'defeated' ? 0x77807c : 0xf7f2df,
      fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
      fontSize: unit.enemy?.crowned ? 17 : 14,
      fontWeight: '800',
      stroke: { color: 0x07110e, width: 4 },
    },
  });
  name.anchor.set(0.5);
  name.position.set(0, 28);
  root.addChild(name);

  const barWidth = unit.enemy?.crowned ? 118 : 94;
  const hp = new Graphics()
    .roundRect(-barWidth / 2, 44, barWidth, 8, 4)
    .fill({ color: 0x0a1211, alpha: 0.88 })
    .roundRect(-barWidth / 2 + 1, 45, (barWidth - 2) * unit.hpRatio, 6, 3)
    .fill({
      color: unit.side === 'heroes' ? 0x62d5a1 : unit.hpRatio < 0.3 ? 0xff6a43 : 0xe55848,
    });
  root.addChild(hp);
}

function drawState(root: Container, unit: GuildCombatSceneUnit, relay: number) {
  const accent = unitAccent(unit);
  if (unit.selected || unit.state === 'targeted') {
    root.addChildAt(
      new Graphics()
        .ellipse(0, 7, 63, 22)
        .stroke({ color: 0xffd669, width: 5, alpha: 0.92 })
        .ellipse(0, 7, 76, 28)
        .stroke({ color: 0xffd669, width: 2, alpha: 0.4 }),
      0,
    );
  }
  if (unit.state === 'acting') {
    root.addChildAt(
      new Graphics()
        .circle(0, -48, 68 + relay * 3)
        .fill({ color: accent, alpha: 0.08 + relay * 0.018 })
        .circle(0, -48, 58 + relay * 2)
        .stroke({ color: accent, width: 4, alpha: 0.68 }),
      0,
    );
  }
  if (unit.state === 'next') {
    root.addChildAt(
      new Graphics().ellipse(0, 7, 52, 17).stroke({ color: accent, width: 3, alpha: 0.58 }),
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
}

export function drawCombatUnits(
  container: Container,
  scene: GuildCombatScene,
): readonly UnitNode[] {
  return scene.units.map((unit) => {
    const root = new Container();
    root.position.set(unit.x, unit.y);
    drawState(root, unit, scene.relay);
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
      figure.alpha = 0.3;
      figure.rotation = unit.side === 'enemies' ? Math.PI / 2 : -Math.PI / 2;
      figure.position.y = 5;
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
    };
  });
}
