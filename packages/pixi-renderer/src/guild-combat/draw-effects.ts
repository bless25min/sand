import { Graphics, Text } from 'pixi.js';
import type { Container } from 'pixi.js';

import { createEffectMarks } from './combat-effect-language';
import type { CombatEffectPlan } from './combat-effect-plan';
import type { GuildCombatScene } from './contracts';
import { drawMark, drawProjectile, drawRoute } from './draw-effect-motifs';

export interface EffectNodes {
  projectile?: Graphics;
  route?: Graphics;
  rings: readonly Graphics[];
  number?: Text;
  burst: readonly Graphics[];
  marks: readonly Graphics[];
}

const ELEMENT_COLOR = {
  fire: 0xff7548,
  grass: 0xa8e45c,
  water: 0x71dcf4,
} as const;

const effectColor = (scene: GuildCombatScene) =>
  (scene.event?.element && ELEMENT_COLOR[scene.event.element]) ??
  (scene.preview?.element && ELEMENT_COLOR[scene.preview.element]) ??
  scene.zone.accent;

const drawPreviewRoute = (scene: GuildCombatScene, color: number) => {
  const actor = scene.units.find(({ id }) => id === scene.preview?.actorId);
  const targets =
    scene.preview?.targetIds
      .map((id) => scene.units.find((unit) => unit.id === id))
      .filter((unit) => unit !== undefined) ?? [];
  if (!actor || targets.length === 0) return undefined;
  const route = new Graphics();
  for (const [index, target] of targets.entries()) {
    route
      .moveTo(actor.x, actor.y - 55)
      .lineTo(target.x, target.y - 55)
      .stroke({ color, width: 3 + index, alpha: 0.28 })
      .circle(target.x, target.y - 55, 34 + index * 6)
      .stroke({ color, width: 2, alpha: 0.42 });
  }
  return route;
};

export function drawCombatEffects(
  container: Container,
  scene: GuildCombatScene,
  plan: CombatEffectPlan,
): EffectNodes {
  const color = effectColor(scene);
  let route: Graphics | undefined;
  let projectile: Graphics | undefined;
  if (!scene.event && scene.preview) {
    route = drawPreviewRoute(scene, color);
    if (route) container.addChild(route);
  }
  if (plan.route.length >= 2) {
    route = drawRoute(plan, color);
    container.addChild(route);

    projectile = drawProjectile(plan, color);
    projectile.scale.set(0.78 + scene.relay * 0.08);
    projectile.position.set(plan.route[0]!.x, plan.route[0]!.y);
    container.addChild(projectile);
  }

  const targets = plan.impactTargetIds
    .map((id) => scene.units.find((unit) => unit.id === id))
    .filter((unit) => unit !== undefined);
  const rings: Graphics[] = [];
  const burst: Graphics[] = [];
  const marks: Graphics[] = [];
  const showImpact =
    scene.event?.phase === 'impact' ||
    scene.event?.phase === 'aftermath' ||
    scene.event?.phase === 'finisher';
  if (showImpact) {
    const particlesPerTarget = Math.max(
      8,
      Math.ceil(plan.impactParticles / Math.max(1, targets.length)),
    );
    for (const target of targets) {
      for (let index = 0; index < plan.impactRings; index += 1) {
        const ring = new Graphics()
          .circle(0, 0, 28 + index * 12)
          .stroke({ color, width: Math.max(2, 7 - index * 0.5), alpha: 0.72 });
        ring.position.set(target.x, target.y - 45);
        container.addChild(ring);
        rings.push(ring);
      }
      for (let index = 0; index < particlesPerTarget; index += 1) {
        const angle = (index / particlesPerTarget) * Math.PI * 2;
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
      for (const mark of createEffectMarks(plan)) {
        const node = drawMark(mark, color);
        const centered =
          mark.kind === 'shockwave' ||
          mark.kind === 'fracture' ||
          mark.kind === 'aura' ||
          mark.kind === 'slash';
        node.position.set(
          target.x + (centered ? 0 : Math.cos(mark.angle) * mark.distance),
          target.y - 45 + (centered ? 0 : Math.sin(mark.angle) * mark.distance),
        );
        node.rotation = mark.angle;
        container.addChild(node);
        marks.push(node);
      }
    }
  }

  let number: Text | undefined;
  if (targets.length > 0 && scene.event?.number !== undefined) {
    const center = targets.reduce(
      (total, target) => ({ x: total.x + target.x, y: total.y + target.y }),
      { x: 0, y: 0 },
    );
    center.x /= targets.length;
    center.y /= targets.length;
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
    number.position.set(center.x, center.y - 150);
    container.addChild(number);
  }

  return {
    ...(projectile ? { projectile } : {}),
    ...(route ? { route } : {}),
    rings,
    ...(number ? { number } : {}),
    burst,
    marks,
  };
}
