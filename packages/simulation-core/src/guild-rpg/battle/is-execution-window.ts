import type { GuildBattleState } from '@expedition/shared-types';

export function isExecutionWindow(battle: GuildBattleState): boolean {
  if (battle.status !== 'active' || !battle.roundOrder) return false;
  const enemies = battle.units.filter(({ side }) => side === 'enemies');
  if (enemies.length === 0 || enemies.some(({ currentHp }) => currentHp > 0)) return false;
  return battle.roundOrder.currentOrder.some(
    (actorId) =>
      !battle.roundOrder!.actedIds.includes(actorId) &&
      battle.units.some(
        ({ id, side, currentHp }) => id === actorId && side === 'heroes' && currentHp > 0,
      ),
  );
}
