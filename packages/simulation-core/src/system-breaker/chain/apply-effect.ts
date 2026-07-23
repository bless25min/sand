import type { GameModuleDefinition, SystemBreakerRun } from '@expedition/shared-types';

export interface EffectState {
  resources: SystemBreakerRun['resources'];
  amplifier: number;
  protection: number;
  reviveAvailable: boolean;
}

const bounded = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum));

export function applyEffect(
  state: EffectState,
  module: GameModuleDefinition,
  value: number,
): EffectState {
  const next = { ...state, resources: { ...state.resources } };
  const applied = Math.max(0, Math.round(value * state.amplifier));
  next.amplifier = 1;

  switch (module.effect) {
    case 'ADD_PROGRESS':
    case 'DAMAGE_THREAT':
      next.resources.PROGRESS += applied;
      break;
    case 'REPAIR_INTEGRITY':
      next.resources.INTEGRITY += applied;
      break;
    case 'REDUCE_INSTABILITY':
      next.resources.INSTABILITY -= applied;
      break;
    case 'ADD_INSTABILITY':
      next.resources.INSTABILITY += Math.ceil(applied / 2);
      next.resources.PROGRESS += applied;
      break;
    case 'SPEED_UP':
      next.resources.PROGRESS += Math.ceil(applied / 2);
      break;
    case 'AMPLIFY_NEXT':
      next.amplifier = 1 + Math.min(1, applied / 20);
      break;
    case 'CONVERT':
      next.resources.INSTABILITY -= Math.ceil(applied / 2);
      next.resources.PROGRESS += applied;
      break;
    case 'PROTECT':
      next.protection += applied;
      break;
    case 'DISABLE':
      next.resources.PROGRESS += applied;
      break;
    case 'REVIVE':
      next.reviveAvailable = true;
      break;
  }

  next.resources.PROGRESS = bounded(next.resources.PROGRESS, 0, 999);
  next.resources.INTEGRITY = bounded(next.resources.INTEGRITY, 0, 100);
  next.resources.INSTABILITY = bounded(next.resources.INSTABILITY, 0, 100);
  next.resources.CREDITS = bounded(next.resources.CREDITS, 0, 999);
  return next;
}
