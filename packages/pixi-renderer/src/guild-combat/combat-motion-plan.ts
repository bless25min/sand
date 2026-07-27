import type { GuildCombatSceneUnit, GuildCombatVisualEvent } from './contracts';

export interface CombatMotionInput {
  side: GuildCombatSceneUnit['side'];
  state: GuildCombatSceneUnit['state'];
  phase?: GuildCombatVisualEvent['phase'];
  relay: number;
  progress: number;
  finisher: boolean;
}

export interface CombatMotion {
  x: number;
  y: number;
  scale: number;
  rotation: number;
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

  if (
    input.state === 'acting' &&
    (input.phase === 'windup' || input.phase === 'travel' || input.phase === 'finisher')
  ) {
    x += direction * (16 + relay * 7) * pulse;
    y -= (3 + relay) * pulse;
    scale += (0.025 + relay * 0.006) * pulse;
  }
  if (input.state === 'hit') {
    x -= direction * (14 + relay * 3) * pulse;
    rotation -= direction * (0.035 + relay * 0.008) * pulse;
    scale += 0.04 * pulse;
  }
  if (input.finisher && input.side === 'heroes') {
    y -= (10 + relay * 1.5) * pulse;
    scale += (0.04 + relay * 0.008) * pulse;
  }

  return { x, y, scale, rotation };
}
