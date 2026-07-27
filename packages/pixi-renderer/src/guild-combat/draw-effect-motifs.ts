import { Graphics } from 'pixi.js';

import type { EffectMark } from './combat-effect-language';
import type { CombatEffectPlan } from './combat-effect-plan';

export function drawProjectile(plan: CombatEffectPlan, color: number) {
  const projectile = new Graphics();
  if (plan.elementMotif === 'ember-shards') {
    projectile
      .poly([0, -16, 12, 0, 0, 16, -12, 0])
      .fill({ color, alpha: 0.98 })
      .poly([0, -28, 20, 0, 0, 28, -20, 0])
      .stroke({ color: 0xfff0b5, width: 3, alpha: 0.72 });
  } else if (plan.elementMotif === 'toxic-spores') {
    projectile
      .circle(0, 0, 12)
      .fill({ color, alpha: 0.88 })
      .circle(-12, 6, 6)
      .fill({ color: 0xe0ff8c, alpha: 0.72 })
      .circle(9, -10, 5)
      .fill({ color: 0xd4ff99, alpha: 0.8 })
      .circle(0, 0, 25)
      .stroke({ color, width: 4, alpha: 0.42 });
  } else if (plan.elementMotif === 'tidal-ribbons') {
    projectile
      .ellipse(0, 0, 24, 10)
      .fill({ color, alpha: 0.82 })
      .arc(-5, 0, 26, -0.8, 0.8)
      .stroke({ color: 0xe7fcff, width: 4, alpha: 0.82 })
      .arc(-12, 0, 34, -0.65, 0.65)
      .stroke({ color, width: 3, alpha: 0.5 });
  } else {
    projectile
      .circle(0, 0, 9)
      .fill({ color, alpha: 0.95 })
      .circle(0, 0, 20)
      .stroke({ color: 0xffffff, width: 3, alpha: 0.55 });
  }
  return projectile;
}

export function drawRoute(plan: CombatEffectPlan, color: number) {
  const route = new Graphics();
  const first = plan.route[0]!;
  route.moveTo(first.x, first.y);
  for (const point of plan.route.slice(1)) route.lineTo(point.x, point.y);
  route.stroke({
    color,
    width: plan.elementMotif === 'tidal-ribbons' ? 7 : 3,
    alpha: plan.elementMotif === 'toxic-spores' ? 0.28 : 0.42,
  });
  if (plan.elementMotif === 'tidal-ribbons') {
    route.moveTo(first.x, first.y + 8);
    for (const point of plan.route.slice(1)) route.lineTo(point.x, point.y + 8);
    route.stroke({ color: 0xe7fcff, width: 2, alpha: 0.48 });
  }
  if (plan.elementMotif === 'toxic-spores') {
    for (const [index, point] of plan.route.entries()) {
      route.circle(point.x, point.y, 5 + index * 2).fill({ color: 0xd5ff83, alpha: 0.68 });
    }
  }
  return route;
}

export function drawMark(mark: EffectMark, color: number) {
  const node = new Graphics();
  if (mark.kind === 'shard') {
    node
      .poly([0, -mark.size * 1.8, mark.size, 0, 0, mark.size * 1.8, -mark.size, 0])
      .fill({ color, alpha: 0.92 });
  } else if (mark.kind === 'spore') {
    node
      .circle(0, 0, mark.size)
      .fill({ color, alpha: 0.54 })
      .circle(mark.size * 0.45, -mark.size * 0.35, mark.size * 0.34)
      .fill({ color: 0xe6ff9a, alpha: 0.82 });
  } else if (mark.kind === 'ribbon') {
    node
      .arc(0, 0, mark.size * 2.4, -1.15, 1.15)
      .stroke({ color, width: Math.max(2, mark.size * 0.55), alpha: 0.78 });
  } else if (mark.kind === 'shockwave') {
    node
      .circle(0, 0, mark.size * 2.3)
      .stroke({ color: 0xfff0ae, width: 5, alpha: 0.78 })
      .circle(0, 0, mark.size * 3.2)
      .stroke({ color, width: 3, alpha: 0.42 });
  } else if (mark.kind === 'orbit') {
    node
      .circle(0, 0, mark.size * 0.55)
      .fill({ color: 0xffffff, alpha: 0.9 })
      .circle(0, 0, mark.size)
      .stroke({ color, width: 3, alpha: 0.72 });
  } else if (mark.kind === 'fracture') {
    node
      .moveTo(-mark.size, -mark.size * 0.4)
      .lineTo(-mark.size * 0.2, 0)
      .lineTo(-mark.size * 0.6, mark.size)
      .moveTo(-mark.size * 0.2, 0)
      .lineTo(mark.size, mark.size * 0.45)
      .stroke({ color: 0xfff2c2, width: 4, alpha: 0.92 });
  } else if (mark.kind === 'ricochet') {
    node
      .poly([0, -mark.size, mark.size * 0.8, mark.size, -mark.size * 0.8, mark.size])
      .stroke({ color, width: 4, alpha: 0.86 });
  } else if (mark.kind === 'aura') {
    node
      .ellipse(0, 0, mark.size * 2.5, mark.size)
      .stroke({ color: 0xd9fff1, width: 5, alpha: 0.72 });
  } else if (mark.kind === 'slash') {
    node
      .moveTo(-mark.size * 1.4, mark.size)
      .lineTo(mark.size * 1.4, -mark.size)
      .stroke({ color: 0xffffff, width: 5, alpha: 0.9 })
      .moveTo(-mark.size, mark.size * 1.4)
      .lineTo(mark.size * 1.8, -mark.size * 0.6)
      .stroke({ color, width: 3, alpha: 0.72 });
  } else {
    node
      .moveTo(-mark.size, 0)
      .lineTo(mark.size, 0)
      .moveTo(0, -mark.size)
      .lineTo(0, mark.size)
      .stroke({ color, width: 3, alpha: 0.82 });
  }
  return node;
}
