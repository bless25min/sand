import type { BattleUnit } from '@expedition/shared-types';

import type { PlaybackImpact } from '../playback/playback-model';

export type UnitSpectacleState =
  'idle' | 'pressure' | 'hit' | 'block' | 'heal' | 'break' | 'defeated' | 'execution';

interface UnitSpectacleStateInput {
  unit: BattleUnit;
  impact?: PlaybackImpact | undefined;
  executionOpen: boolean;
}

export function projectUnitSpectacleState(input: UnitSpectacleStateInput): UnitSpectacleState {
  if (input.unit.currentHp <= 0) return 'defeated';
  if (input.unit.side === 'enemies' && input.executionOpen) return 'execution';
  if (input.impact?.targetId === input.unit.id) {
    if (input.impact.kind === 'kill' || input.impact.kind === 'overkill') return 'break';
    if (input.impact.kind === 'block') return 'block';
    if (input.impact.kind === 'heal') return 'heal';
    return 'hit';
  }
  if (input.unit.side === 'enemies' && input.unit.gauge >= 60) return 'pressure';
  return 'idle';
}
