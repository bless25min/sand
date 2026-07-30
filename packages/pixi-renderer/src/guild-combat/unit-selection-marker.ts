import type { GuildCombatSceneUnit } from './contracts';

export type UnitSelectionMarker = 'actor' | 'target' | 'next' | 'relay' | 'none';

export function unitSelectionMarker(unit: GuildCombatSceneUnit): UnitSelectionMarker {
  if (unit.side === 'enemies' && (unit.selected || unit.state === 'targeted')) return 'target';
  if (unit.state === 'acting') return 'actor';
  if (unit.state === 'next') return 'next';
  if (unit.comboReady) return 'relay';
  return 'none';
}
