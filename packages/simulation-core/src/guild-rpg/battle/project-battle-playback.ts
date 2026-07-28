import type {
  BattleUnit,
  GuildBattleEvent,
  GuildBattleState,
  GuildElement,
  StatusLayers,
} from '@expedition/shared-types';

const layerByElement: Readonly<Record<GuildElement, keyof StatusLayers>> = {
  fire: 'burn',
  grass: 'poison',
  water: 'tide',
};

const updateUnit = (
  units: readonly BattleUnit[],
  targetId: string | undefined,
  update: (unit: BattleUnit) => BattleUnit,
) => (targetId ? units.map((unit) => (unit.id === targetId ? update(unit) : unit)) : units);

export function projectBattlePlayback(
  before: GuildBattleState,
  final: GuildBattleState,
  events: readonly GuildBattleEvent[],
  visibleCount: number,
): GuildBattleState {
  const count = Math.max(0, Math.min(events.length, Math.trunc(visibleCount)));
  if (count >= events.length) return final;

  let units: readonly BattleUnit[] = before.units.map((unit) => ({
    ...unit,
    ...(unit.statusLayers ? { statusLayers: { ...unit.statusLayers } } : {}),
  }));
  let status = before.status;

  for (const event of events.slice(0, count)) {
    const amount = Math.max(0, event.amount ?? 0);
    if (event.kind === 'damage' || event.kind === 'reaction') {
      units = updateUnit(units, event.targetId, (unit) => ({
        ...unit,
        currentHp: Math.max(0, unit.currentHp - amount),
      }));
    } else if (event.kind === 'healing') {
      units = updateUnit(units, event.targetId, (unit) => ({
        ...unit,
        currentHp: Math.min(unit.stats.hp, unit.currentHp + amount),
      }));
    } else if (event.kind === 'status_applied' && event.element) {
      const key = layerByElement[event.element];
      units = updateUnit(units, event.targetId, (unit) => {
        const layers = unit.statusLayers ?? { burn: 0, poison: 0, tide: 0 };
        return { ...unit, statusLayers: { ...layers, [key]: layers[key] + amount } };
      });
    } else if (event.kind === 'weaken') {
      units = updateUnit(units, event.targetId, (unit) => ({
        ...unit,
        defenseReduction: (unit.defenseReduction ?? 0) + amount,
      }));
    } else if (event.kind === 'strengthen') {
      units = updateUnit(units, event.targetId, (unit) => ({
        ...unit,
        strengthened: (unit.strengthened ?? 0) + amount,
      }));
    } else if (event.kind === 'guard') {
      units = updateUnit(units, event.targetId ?? event.actorId, (unit) => ({
        ...unit,
        guarding: true,
      }));
    } else if (event.kind === 'unit_defeated') {
      units = updateUnit(units, event.targetId, (unit) => ({ ...unit, currentHp: 0 }));
    } else if (event.kind === 'victory') {
      status = 'victory';
    } else if (event.kind === 'defeat') {
      status = 'defeat';
    }
  }

  return {
    ...before,
    units,
    status,
    sequence: before.sequence + count,
    events: [...before.events, ...events.slice(0, count)],
  };
}
