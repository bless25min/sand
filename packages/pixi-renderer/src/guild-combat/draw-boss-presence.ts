import { Graphics, Text } from 'pixi.js';
import type { Container } from 'pixi.js';

import type { GuildCombatSceneUnit } from './contracts';
import { createUnitPresentation } from './combat-unit-presentation';

export function drawBossPresence(
  root: Container,
  unit: GuildCombatSceneUnit,
  relay: number,
  accent: number,
) {
  const presentation = createUnitPresentation(unit, relay);
  if (!presentation.boss) return;
  const frame = new Graphics();
  for (let index = 0; index < presentation.presenceRings; index += 1) {
    frame.circle(0, -48, 72 + index * 12).stroke({
      color: index % 2 === 0 ? accent : 0xfff0b5,
      width: Math.max(1.5, 4 - index * 0.45),
      alpha: 0.24 + index * 0.06,
    });
  }
  frame
    .moveTo(-82, -142)
    .lineTo(-58, -158)
    .lineTo(-28, -158)
    .moveTo(82, -142)
    .lineTo(58, -158)
    .lineTo(28, -158)
    .stroke({ color: accent, width: 4, alpha: 0.82 });
  root.addChild(frame);
  const badge = new Text({
    text: presentation.badge,
    style: {
      fill: accent,
      fontFamily: '"Arial Black", "Noto Sans TC", sans-serif',
      fontSize: 13,
      fontWeight: '900',
      letterSpacing: 3,
      stroke: { color: 0x120c08, width: 5 },
    },
  });
  badge.anchor.set(0.5);
  badge.position.set(0, -166);
  root.addChild(badge);
}
