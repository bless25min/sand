import type { ComboEvent, GuildBattleState } from '@expedition/shared-types';

const COMPOSITION_TIME_SCALE = 0.25;
const GAUGE_MILLISECONDS_PER_SPEED = 400;

function livingHeroWithHighestThreat(battle: GuildBattleState) {
  return battle.units
    .filter((unit) => unit.side === 'heroes' && unit.currentHp > 0)
    .sort((left, right) => right.threat - left.threat)[0];
}

export function advanceComposition(battle: GuildBattleState, elapsedMs: number): GuildBattleState {
  if (battle.status !== 'active' || battle.combo?.phase !== 'composing' || elapsedMs <= 0) {
    return battle;
  }

  const units = battle.units.map((unit) => ({ ...unit }));
  const events: ComboEvent[] = [...battle.combo.events];
  let eventId = events.length;

  for (const enemy of units.filter((unit) => unit.side === 'enemies' && unit.currentHp > 0)) {
    enemy.gauge +=
      (enemy.stats.speed * elapsedMs * COMPOSITION_TIME_SCALE) / GAUGE_MILLISECONDS_PER_SPEED;
    if (enemy.gauge < 100) continue;
    enemy.gauge -= 100;
    const target = livingHeroWithHighestThreat({ ...battle, units });
    if (!target) break;
    const mutableTarget = units.find((unit) => unit.id === target.id)!;
    const amount = Math.max(1, Math.round(enemy.stats.attack - mutableTarget.stats.defense * 0.5));
    mutableTarget.currentHp = Math.max(0, mutableTarget.currentHp - amount);
    events.push({
      id: eventId++,
      causalId: `pressure:${battle.elapsedMs + elapsedMs}:${enemy.id}`,
      kind: 'enemy_pressure',
      message: `${enemy.name}趁軍令編排時攻擊${mutableTarget.name}，造成 ${amount} 傷害。`,
      actorId: enemy.id,
      targetId: mutableTarget.id,
      amount,
    });
  }

  const heroesAlive = units.some((unit) => unit.side === 'heroes' && unit.currentHp > 0);
  return {
    ...battle,
    elapsedMs: battle.elapsedMs + elapsedMs,
    status: heroesAlive ? battle.status : 'defeat',
    units,
    combo: {
      ...battle.combo,
      events,
      phase: heroesAlive ? battle.combo.phase : 'complete',
    },
  };
}
