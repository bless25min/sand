import { Container, Graphics, Text } from 'pixi.js';

import type { GuildEnemyVisual, GuildHeroVisual } from './contracts';

function heroWeapon(identity: GuildHeroVisual) {
  const weapon = new Graphics();
  if (identity.weapon === 'shield') {
    weapon
      .roundRect(-40, -48, 33, 54, 9)
      .fill({ color: identity.secondary })
      .stroke({ color: identity.accent, width: 4 });
    weapon.lineTo(-23, 15).lineTo(-7, 4).stroke({ color: identity.accent, width: 3 });
  } else if (identity.weapon === 'bow') {
    weapon.arc(6, -28, 42, -Math.PI / 2, Math.PI / 2).stroke({ color: identity.accent, width: 4 });
    weapon.moveTo(6, -70).lineTo(6, 14).stroke({ color: identity.accent, width: 2 });
  } else if (identity.weapon === 'staff') {
    weapon.moveTo(22, 18).lineTo(34, -68).stroke({ color: identity.accent, width: 6 });
    weapon.circle(36, -75, 10).fill({ color: identity.accent, alpha: 0.75 });
    weapon.circle(36, -75, 20).stroke({ color: identity.primary, width: 3, alpha: 0.6 });
  } else if (identity.weapon === 'flask') {
    weapon
      .roundRect(14, -42, 25, 36, 8)
      .fill({ color: identity.accent, alpha: 0.75 })
      .stroke({ color: 0xf1ffd0, width: 2 });
    weapon.rect(21, -52, 11, 12).fill({ color: identity.secondary });
  } else if (identity.weapon === 'tome') {
    weapon
      .roundRect(8, -46, 42, 31, 3)
      .fill({ color: identity.secondary })
      .stroke({ color: identity.accent, width: 3 });
    weapon.moveTo(29, -44).lineTo(29, -17).stroke({ color: identity.accent, width: 2 });
  } else {
    weapon.moveTo(-33, 6).lineTo(-3, -58).stroke({ color: identity.accent, width: 7 });
    weapon.moveTo(34, 6).lineTo(4, -58).stroke({ color: 0xfff1b3, width: 7 });
  }
  return weapon;
}

export function drawHeroFigure(identity: GuildHeroVisual) {
  const root = new Container();
  const aura = new Graphics()
    .ellipse(0, 8, 43, 13)
    .fill({ color: identity.primary, alpha: 0.18 })
    .stroke({ color: identity.accent, width: 2, alpha: 0.35 });
  const body = new Graphics()
    .poly([-28, 10, -20, -56, 0, -75, 20, -56, 30, 10])
    .fill({ color: identity.secondary })
    .stroke({ color: identity.primary, width: 5 })
    .circle(0, -88, 17)
    .fill({ color: 0xd5aa80 })
    .arc(0, -91, 20, Math.PI, Math.PI * 2)
    .fill({ color: identity.primary });
  const chest = new Graphics()
    .poly([-18, -55, 0, -66, 18, -55, 11, -26, 0, -20, -11, -26])
    .fill({ color: identity.primary, alpha: 0.9 })
    .stroke({ color: identity.accent, width: 2 });
  const sigil = new Text({
    text: identity.sigil,
    style: {
      fill: identity.accent,
      fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
      fontSize: 14,
      fontWeight: '800',
    },
  });
  sigil.anchor.set(0.5);
  sigil.position.set(0, -43);
  root.addChild(aura, body, chest, heroWeapon(identity), sigil);
  return root;
}

function wolfFigure(identity: GuildEnemyVisual) {
  const shape = new Graphics()
    .ellipse(0, -35, 50, 27)
    .fill({ color: identity.primary })
    .stroke({ color: identity.accent, width: 3, alpha: 0.55 })
    .poly([28, -51, 52, -70, 61, -43, 48, -28])
    .fill({ color: identity.primary })
    .poly([44, -65, 48, -86, 57, -68])
    .fill({ color: identity.secondary })
    .poly([57, -66, 70, -82, 68, -56])
    .fill({ color: identity.secondary })
    .moveTo(-42, -41)
    .bezierCurveTo(-80, -74, -87, -26, -58, -14)
    .stroke({ color: identity.primary, width: 12 });
  for (const x of [-30, 18, 42]) {
    shape
      .moveTo(x, -18)
      .lineTo(x - 5, 8)
      .stroke({ color: identity.secondary, width: 8 });
  }
  shape.circle(58, -55, 3).fill({ color: identity.accent });
  return shape;
}

function humanoidEnemy(identity: GuildEnemyVisual) {
  const guardian = identity.archetype === 'guardian' || identity.archetype === 'boss';
  const shape = new Graphics()
    .poly([-36, 4, -28, -60, 0, -82, 28, -60, 38, 4])
    .fill({ color: identity.secondary })
    .stroke({ color: identity.primary, width: guardian ? 9 : 5 })
    .circle(0, -96, guardian ? 21 : 17)
    .fill({ color: identity.primary });
  if (guardian) {
    shape
      .roundRect(-55, -62, 36, 62, 8)
      .fill({ color: identity.secondary })
      .stroke({ color: identity.accent, width: 4 });
  } else {
    shape.moveTo(19, -54).lineTo(56, -5).stroke({ color: identity.accent, width: 7 });
  }
  return shape;
}

function dragonFigure(identity: GuildEnemyVisual) {
  return new Graphics()
    .ellipse(0, -38, 53, 30)
    .fill({ color: identity.primary })
    .stroke({ color: identity.accent, width: 3, alpha: 0.6 })
    .poly([-15, -55, -76, -96, -52, -30])
    .fill({ color: identity.secondary, alpha: 0.92 })
    .poly([15, -55, 76, -96, 52, -30])
    .fill({ color: identity.secondary, alpha: 0.92 })
    .poly([36, -52, 63, -66, 58, -38])
    .fill({ color: identity.primary })
    .poly([49, -61, 55, -80, 64, -62])
    .fill({ color: identity.secondary })
    .moveTo(-45, -34)
    .bezierCurveTo(-92, -12, -83, 22, -46, 0)
    .stroke({ color: identity.primary, width: 10 })
    .circle(57, -53, 4)
    .fill({ color: identity.accent });
}

export function drawEnemyFigure(identity: GuildEnemyVisual) {
  const root = new Container();
  const shadow = new Graphics()
    .ellipse(0, 4, 55, 14)
    .fill({ color: 0x000000, alpha: 0.36 })
    .stroke({ color: identity.accent, width: 2, alpha: 0.2 });
  const figure =
    identity.family === 'greyfang'
      ? wolfFigure(identity)
      : identity.family === 'ember' || identity.archetype === 'flying'
        ? dragonFigure(identity)
        : humanoidEnemy(identity);
  root.addChild(shadow, figure);
  if (identity.crowned) {
    const crown = new Graphics()
      .poly([-24, -122, -16, -145, 0, -128, 16, -145, 24, -122])
      .fill({ color: identity.accent, alpha: 0.85 })
      .stroke({ color: 0xffffdf, width: 2, alpha: 0.8 });
    root.addChild(crown);
  }
  root.scale.set(identity.scale);
  return root;
}
