import { Graphics, type Container } from 'pixi.js';

import type { CombatEffectPlan } from './combat-effect-plan';

interface TriggerCueTarget {
  x: number;
  y: number;
}

const line = (
  node: Graphics,
  points: readonly [number, number][],
  color: number,
  width: number,
) => {
  const [first, ...rest] = points;
  if (!first) return;
  node.moveTo(first[0], first[1]);
  rest.forEach(([x, y]) => node.lineTo(x, y));
  node.stroke({ color, width, alpha: 0.92 });
};

const drawCue = (plan: CombatEffectPlan, color: number): Graphics => {
  const node = new Graphics();
  const tier = plan.comboTier;
  if (plan.triggerMotif === 'timing-seal') {
    line(
      node,
      [
        [0, -38],
        [38, 0],
        [0, 38],
        [-38, 0],
        [0, -38],
      ],
      color,
      4,
    );
    node.circle(0, 0, 19).stroke({ color: 0xffffff, width: 2, alpha: 0.82 });
  } else if (plan.triggerMotif === 'layer-burst') {
    for (let index = 0; index < 3; index += 1) {
      node
        .circle(0, 0, 24 + index * 10)
        .stroke({ color: index === 1 ? 0xffffff : color, width: 4 - index, alpha: 0.9 });
    }
  } else if (plan.triggerMotif === 'consume-collapse') {
    node.circle(0, 0, 48).stroke({ color, width: 5, alpha: 0.9 });
    node.circle(0, 0, 14).fill({ color: 0xffffff, alpha: 0.85 });
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      line(
        node,
        [
          [Math.cos(angle) * 45, Math.sin(angle) * 45],
          [Math.cos(angle) * 19, Math.sin(angle) * 19],
        ],
        color,
        3,
      );
    }
  } else if (plan.triggerMotif === 'repeat-slash') {
    const count = Math.min(5, tier + 1);
    for (let index = 0; index < count; index += 1) {
      const offset = (index - (count - 1) / 2) * 12;
      line(
        node,
        [
          [-42 + offset, 34],
          [34 + offset, -42],
        ],
        index === count - 1 ? 0xffffff : color,
        6,
      );
    }
  } else if (plan.triggerMotif === 'ricochet-route') {
    line(
      node,
      [
        [-52, 24],
        [-12, -32],
        [22, 18],
        [52, -24],
      ],
      color,
      5,
    );
    node.circle(-12, -32, 7).fill({ color: 0xffffff });
    node.circle(22, 18, 7).fill({ color: 0xffffff });
  } else if (plan.triggerMotif === 'echo-route') {
    node.circle(0, 0, 18).stroke({ color: 0xffffff, width: 4, alpha: 0.92 });
    node.circle(0, 0, 34).stroke({ color, width: 4, alpha: 0.72 });
    node.circle(0, 0, 50).stroke({ color, width: 3, alpha: 0.46 });
  } else if (plan.triggerMotif === 'relay-link') {
    node.circle(-34, 0, 16).stroke({ color, width: 4, alpha: 0.9 });
    node.circle(34, 0, 16).stroke({ color: 0xffffff, width: 4, alpha: 0.9 });
    line(
      node,
      [
        [-18, 0],
        [18, 0],
      ],
      color,
      7,
    );
  }
  return node;
};

export function drawTriggerCues(
  container: Container,
  targets: readonly TriggerCueTarget[],
  plan: CombatEffectPlan,
  color: number,
): readonly Graphics[] {
  if (plan.triggerMotif === 'none') return [];
  return targets.map((target) => {
    const cue = drawCue(plan, color);
    cue.position.set(target.x, target.y - 45);
    cue.scale.set(0.42);
    cue.alpha = 0.96;
    container.addChild(cue);
    return cue;
  });
}
