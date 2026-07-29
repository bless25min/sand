import type { GuildCombatSceneUnit, GuildCombatVisualEvent, GuildHeroVisual } from './contracts';
import type { EnemyReactionKind } from './combat-effect-plan';

export interface CombatMotionInput {
  side: GuildCombatSceneUnit['side'];
  state: GuildCombatSceneUnit['state'];
  phase?: GuildCombatVisualEvent['phase'];
  relay: number;
  progress: number;
  finisher: boolean;
  weapon?: GuildHeroVisual['weapon'];
  reactionKind?: EnemyReactionKind;
  reactionTarget?: boolean;
  reactionFadeTo?: number;
}

export interface CombatMotion {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  alpha: number;
}

export function createCombatMotion(input: CombatMotionInput): CombatMotion {
  const relay = Math.max(1, Math.min(6, Math.trunc(input.relay)));
  const progress = Math.max(0, Math.min(1, input.progress));
  const pulse = Math.sin(progress * Math.PI);
  const direction = input.side === 'heroes' ? 1 : -1;
  let x = 0;
  let y = 0;
  let scale = 1;
  let rotation = 0;
  let alpha = 1;

  if (
    input.state === 'acting' &&
    (input.phase === 'windup' || input.phase === 'travel' || input.phase === 'finisher')
  ) {
    x += direction * (16 + relay * 7) * pulse;
    y -= (3 + relay) * pulse;
    scale += (0.025 + relay * 0.006) * pulse;
  }
  if (
    input.side === 'heroes' &&
    input.state === 'acting' &&
    (input.phase === 'windup' || input.phase === 'travel' || input.phase === 'finisher')
  ) {
    if (input.weapon === 'shield') {
      x *= 0.78;
      y += (2 + relay * 0.8) * pulse;
      scale += 0.08 * pulse;
      rotation -= 0.035 * pulse;
    } else if (input.weapon === 'bow') {
      x *= 0.42;
      y -= (5 + relay * 0.5) * pulse;
      rotation += 0.085 * pulse;
    } else if (input.weapon === 'staff') {
      x *= 0.58;
      y -= (15 + relay * 1.6) * pulse;
      scale += 0.045 * pulse;
      rotation -= 0.065 * pulse;
    } else if (input.weapon === 'flask') {
      x *= 0.64;
      y -= (20 + relay * 1.9) * pulse;
      rotation -= 0.2 * pulse;
    } else if (input.weapon === 'tome') {
      x *= 0.28;
      y -= (9 + relay) * pulse;
      scale += 0.1 * pulse;
      rotation += 0.018 * pulse;
    } else if (input.weapon === 'blades') {
      x *= 1.38;
      y -= (4 + relay * 0.7) * pulse;
      scale += 0.025 * pulse;
      rotation += 0.13 * pulse;
    }
  }
  if (input.state === 'hit') {
    x -= direction * (20 + relay * 6) * pulse;
    rotation -= direction * (0.05 + relay * 0.012) * pulse;
    scale += (0.05 + relay * 0.006) * pulse;
  }
  if (input.reactionTarget && input.reactionKind === 'break') {
    y += (18 + relay * 2.5) * pulse;
    scale -= 0.15 * pulse;
    rotation += direction * 0.24 * pulse;
  }
  if (input.reactionTarget && input.reactionKind === 'collapse') {
    const fadeTo = input.reactionFadeTo ?? 0.3;
    y += (34 + relay * 3) * progress;
    scale -= 0.12 * progress;
    rotation -= direction * (Math.PI / 2) * progress;
    alpha = Math.max(fadeTo, 1 - progress * (1 - fadeTo));
  }
  if (input.reactionTarget && input.reactionKind === 'execute') {
    const fadeTo = input.reactionFadeTo ?? 0;
    const lift = Math.sin(Math.min(1, progress) * Math.PI * 0.82);
    y -= (40 + relay * 3.2) * lift;
    scale = Math.max(0.18, 1 - progress * (0.48 + relay * 0.015));
    rotation += direction * progress * (0.42 + relay * 0.04);
    alpha = Math.max(fadeTo, 1 - progress * (1 - fadeTo) * 1.05);
  }
  if (input.finisher && input.side === 'heroes') {
    y -= (10 + relay * 1.5) * pulse;
    scale += (0.04 + relay * 0.008) * pulse;
  }

  return { x, y, scale, rotation, alpha };
}
