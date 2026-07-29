import { Graphics } from 'pixi.js';
import type { Container } from 'pixi.js';

import type { EnemyAttackPlan } from './enemy-attack-plan';

export interface EnemyAttackNodes {
  projectile?: Graphics;
  route?: Graphics;
  telegraphs: readonly Graphics[];
  outcomes: readonly Graphics[];
}

const attackGlyph = (plan: EnemyAttackPlan) => {
  const node = new Graphics();
  const color = plan.accent;
  if (plan.motif === 'dash-slash') {
    node
      .moveTo(-30, 18)
      .lineTo(28, -20)
      .moveTo(-18, 28)
      .lineTo(38, -10)
      .stroke({ color, width: 7, alpha: 0.94 });
  } else if (plan.motif === 'ground-smash') {
    node
      .poly([-22, -18, 18, -25, 32, 4, 8, 28, -28, 18])
      .fill({ color, alpha: 0.9 })
      .circle(0, 0, 38)
      .stroke({ color: 0xffd18b, width: 5, alpha: 0.72 });
  } else if (plan.motif === 'shield-crush') {
    node
      .poly([0, -34, 30, -17, 30, 18, 0, 36, -30, 18, -30, -17])
      .fill({ color, alpha: 0.76 })
      .stroke({ color: 0xffffff, width: 5, alpha: 0.82 });
  } else if (plan.motif === 'arc-volley') {
    [-16, 0, 16].forEach((offset) => {
      node
        .circle(offset, 0, 7)
        .fill({ color, alpha: 0.94 })
        .moveTo(offset, 10)
        .lineTo(offset - 8, 28)
        .stroke({ color: 0xfff0ae, width: 3, alpha: 0.8 });
    });
  } else if (plan.motif === 'royal-execution') {
    node
      .poly([-34, 18, -24, -28, 0, -7, 24, -28, 34, 18])
      .fill({ color, alpha: 0.86 })
      .moveTo(-38, 25)
      .lineTo(38, 25)
      .stroke({ color: 0xfff0ae, width: 6, alpha: 0.92 });
  } else {
    node
      .poly([-40, -8, -8, -28, 0, 5, 8, -28, 40, -8, 0, 28])
      .fill({ color, alpha: 0.88 })
      .stroke({ color: 0xffffff, width: 4, alpha: 0.68 });
  }
  return node;
};

const outcomeGlyph = (plan: EnemyAttackPlan) => {
  const node = new Graphics();
  if (plan.outcome === 'dodge') {
    node
      .moveTo(-40, 25)
      .lineTo(15, -28)
      .moveTo(-18, 34)
      .lineTo(36, -18)
      .stroke({ color: 0x71dcf4, width: 7, alpha: 0.92 });
  } else if (plan.outcome === 'guard') {
    node
      .arc(0, 0, 45, -1.2, 1.2)
      .stroke({ color: 0xffe08a, width: 10, alpha: 0.92 })
      .arc(0, 0, 57, -1.08, 1.08)
      .stroke({ color: 0xffffff, width: 3, alpha: 0.72 });
  } else {
    node
      .moveTo(-34, -34)
      .lineTo(34, 34)
      .moveTo(34, -34)
      .lineTo(-34, 34)
      .stroke({ color: 0xff684d, width: 9, alpha: 0.9 });
  }
  return node;
};

export function drawEnemyAttack(container: Container, plan: EnemyAttackPlan): EnemyAttackNodes {
  if (!plan.active || plan.route.length < 2) return { telegraphs: [], outcomes: [] };
  const first = plan.route[0]!;
  const last = plan.route.at(-1)!;
  const route = new Graphics().moveTo(first.x, first.y);
  for (const point of plan.route.slice(1)) route.lineTo(point.x, point.y);
  route.stroke({
    color: plan.phase === 'telegraph' ? 0xff5b45 : plan.accent,
    width: 3 + plan.force * 2,
    alpha: plan.phase === 'telegraph' ? 0.66 : 0.46,
  });
  container.addChild(route);

  const sourceCue = new Graphics()
    .circle(0, 0, 34 + plan.force * 8)
    .stroke({ color: plan.accent, width: 5, alpha: 0.88 })
    .circle(0, 0, 48 + plan.force * 9)
    .stroke({ color: 0xffe09a, width: 2, alpha: 0.45 });
  sourceCue.position.set(first.x, first.y);
  const targetCue = new Graphics()
    .circle(0, 0, 40 + plan.force * 7)
    .stroke({
      color: plan.outcome === 'dodge' ? 0x71dcf4 : 0xff5b45,
      width: 6,
      alpha: 0.86,
    })
    .circle(0, 0, 56 + plan.force * 8)
    .stroke({ color: 0xffffff, width: 2, alpha: 0.38 });
  targetCue.position.set(last.x, last.y);
  container.addChild(sourceCue, targetCue);

  if (plan.phase === 'telegraph') {
    return { route, telegraphs: [sourceCue, targetCue], outcomes: [] };
  }
  const projectile = attackGlyph(plan);
  projectile.position.set(first.x, first.y);
  projectile.scale.set(0.75 + plan.force * 0.2);
  const outcome = outcomeGlyph(plan);
  outcome.position.set(last.x, last.y);
  outcome.alpha = 0;
  container.addChild(projectile, outcome);
  return {
    projectile,
    route,
    telegraphs: [sourceCue, targetCue],
    outcomes: [outcome],
  };
}
