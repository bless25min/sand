import { Graphics } from 'pixi.js';
import type { Container } from 'pixi.js';

import type { CombatEffectPlan } from './combat-effect-plan';
import type { GuildCombatScene } from './contracts';

export interface EnemyReactionFragmentNode {
  node: Graphics;
  originX: number;
  originY: number;
  velocityX: number;
  velocityY: number;
  spin: number;
}

export interface EnemyReactionNodes {
  fragments: readonly EnemyReactionFragmentNode[];
  cores: readonly Graphics[];
  crowns: readonly Graphics[];
}

const drawCore = (
  kind: CombatEffectPlan['enemyReaction']['kind'],
  color: number,
  relay: number,
) => {
  const core = new Graphics();
  if (kind === 'impact') {
    core.circle(0, 0, 30 + relay * 3).stroke({ color: 0xffffff, width: 5, alpha: 0.86 });
  } else if (kind === 'stagger') {
    core
      .ellipse(0, 0, 50 + relay * 3, 26 + relay * 2)
      .stroke({ color, width: 7, alpha: 0.9 })
      .moveTo(-42, -38)
      .lineTo(42, 38)
      .stroke({ color: 0xffffff, width: 4, alpha: 0.8 });
  } else if (kind === 'break') {
    core
      .moveTo(-58, -48)
      .lineTo(-14, -8)
      .lineTo(-42, 44)
      .moveTo(58, -48)
      .lineTo(14, -8)
      .lineTo(42, 44)
      .stroke({ color: 0xffd65c, width: 8, alpha: 0.94 });
  } else if (kind === 'collapse') {
    core
      .ellipse(0, 52, 70 + relay * 4, 25 + relay)
      .stroke({ color: 0xff764d, width: 7, alpha: 0.88 })
      .circle(0, 0, 45 + relay * 3)
      .stroke({ color, width: 4, alpha: 0.64 });
  } else if (kind === 'execute') {
    core
      .circle(0, 0, 42 + relay * 4)
      .stroke({ color: 0xffffff, width: 8, alpha: 0.94 })
      .circle(0, 0, 64 + relay * 5)
      .stroke({ color, width: 6, alpha: 0.82 })
      .moveTo(-62, -62)
      .lineTo(62, 62)
      .moveTo(62, -62)
      .lineTo(-62, 62)
      .stroke({ color: 0xffd86c, width: 9, alpha: 0.9 });
  }
  return core;
};

export function drawEnemyReactions(
  container: Container,
  scene: GuildCombatScene,
  plan: CombatEffectPlan,
  color: number,
): EnemyReactionNodes {
  const reaction = plan.enemyReaction;
  if (reaction.kind === 'none') return { fragments: [], cores: [], crowns: [] };
  const targets = reaction.targetIds
    .map((id) => scene.units.find((unit) => unit.id === id))
    .filter((unit) => unit !== undefined);
  const fragments: EnemyReactionFragmentNode[] = [];
  const cores: Graphics[] = [];
  const crowns: Graphics[] = [];
  const fragmentsPerTarget = Math.max(1, Math.ceil(reaction.fragmentCount / targets.length));

  for (const target of targets) {
    const originX = target.x;
    const originY = target.y - 52;
    const core = drawCore(reaction.kind, color, scene.relay);
    core.position.set(originX, originY);
    container.addChild(core);
    cores.push(core);

    for (let index = 0; index < fragmentsPerTarget; index += 1) {
      const angle = (index / fragmentsPerTarget) * Math.PI * 2 - Math.PI / 2;
      const speed = (18 + (index % 6) * 5) * reaction.force;
      const size = 5 + (index % 4) * 2;
      const node =
        reaction.kind === 'impact'
          ? new Graphics()
              .moveTo(-size * 1.8, 0)
              .lineTo(size * 1.8, 0)
              .stroke({ color: 0xffffff, width: 3, alpha: 0.86 })
          : new Graphics()
              .poly([0, -size * 1.5, size, size, -size, size])
              .fill({ color: index % 4 === 0 ? 0xffffff : color, alpha: 0.9 });
      node.position.set(originX, originY);
      container.addChild(node);
      fragments.push({
        node,
        originX,
        originY,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed - (reaction.kind === 'execute' ? 30 : 10),
        spin: (index % 2 === 0 ? 1 : -1) * (0.8 + (index % 5) * 0.18),
      });
    }

    if (reaction.crownLaunch && target.enemy?.crowned) {
      const crown = new Graphics()
        .poly([-30, 12, -24, -18, -8, 0, 4, -24, 16, 0, 30, -18, 30, 12])
        .fill({ color: 0xffd65c, alpha: 0.96 })
        .stroke({ color: 0xffffff, width: 3, alpha: 0.78 });
      crown.position.set(originX, originY - 74);
      container.addChild(crown);
      crowns.push(crown);
    }
  }

  return { fragments, cores, crowns };
}
