import { Graphics, Text } from 'pixi.js';
import type { Container } from 'pixi.js';

import type { CombatEffectPlan } from './combat-effect-plan';
import type { GuildCombatScene } from './contracts';

export interface EffectNodes {
  projectile?: Graphics;
  route?: Graphics;
  rings: readonly Graphics[];
  number?: Text;
  burst: readonly Graphics[];
}

const ELEMENT_COLOR = {
  fire: 0xff7548,
  grass: 0xa8e45c,
  water: 0x71dcf4,
} as const;

const effectColor = (scene: GuildCombatScene) =>
  (scene.event?.element && ELEMENT_COLOR[scene.event.element]) ?? scene.zone.accent;

export function drawCombatEffects(
  container: Container,
  scene: GuildCombatScene,
  plan: CombatEffectPlan,
): EffectNodes {
  const color = effectColor(scene);
  let route: Graphics | undefined;
  let projectile: Graphics | undefined;
  if (plan.route.length >= 2) {
    route = new Graphics();
    route.moveTo(plan.route[0]!.x, plan.route[0]!.y);
    for (const point of plan.route.slice(1)) route.lineTo(point.x, point.y);
    route.stroke({ color, width: 3 + scene.relay * 0.7, alpha: 0.38 });
    container.addChild(route);

    projectile = new Graphics()
      .circle(0, 0, 7 + scene.relay * 1.5)
      .fill({ color, alpha: 0.98 })
      .circle(0, 0, 18 + scene.relay * 2)
      .stroke({ color: 0xffffff, width: 3, alpha: 0.58 });
    projectile.position.set(plan.route[0]!.x, plan.route[0]!.y);
    container.addChild(projectile);
  }

  const target = scene.units.find(({ id }) => id === scene.event?.targetId);
  const rings: Graphics[] = [];
  const burst: Graphics[] = [];
  if (target && (scene.event?.phase === 'impact' || scene.event?.phase === 'finisher')) {
    for (let index = 0; index < plan.impactRings; index += 1) {
      const ring = new Graphics()
        .circle(0, 0, 28 + index * 12)
        .stroke({ color, width: Math.max(2, 7 - index * 0.5), alpha: 0.72 });
      ring.position.set(target.x, target.y - 45);
      container.addChild(ring);
      rings.push(ring);
    }
    for (let index = 0; index < plan.impactParticles; index += 1) {
      const angle = (index / plan.impactParticles) * Math.PI * 2;
      const distance = 30 + (index % 7) * 8;
      const particle = new Graphics()
        .circle(0, 0, 2 + (index % 3))
        .fill({ color: index % 4 === 0 ? 0xffffff : color, alpha: 0.86 });
      particle.position.set(
        target.x + Math.cos(angle) * distance,
        target.y - 45 + Math.sin(angle) * distance,
      );
      container.addChild(particle);
      burst.push(particle);
    }
  }

  let number: Text | undefined;
  if (target && scene.event?.number !== undefined) {
    const prefix = scene.event.number > 0 ? '+' : '';
    number = new Text({
      text: `${prefix}${scene.event.number}`,
      style: {
        fill: scene.event.polarity === 'support' ? 0x9fffc5 : 0xfff0be,
        fontFamily: '"Arial Black", "Noto Sans TC", sans-serif',
        fontSize: 28 + scene.relay * 4,
        fontWeight: '900',
        stroke: { color: 0x120c08, width: 7 },
        dropShadow: { color, alpha: 0.8, blur: 8, distance: 0 },
      },
    });
    number.anchor.set(0.5);
    number.position.set(target.x, target.y - 130);
    container.addChild(number);
  }

  return {
    ...(projectile ? { projectile } : {}),
    ...(route ? { route } : {}),
    rings,
    ...(number ? { number } : {}),
    burst,
  };
}
