import type {
  BattleUnit,
  EnemyPressureIntent,
  GuildBattleEvent,
  GuildBattleState,
} from '@expedition/shared-types';

const living = (units: readonly BattleUnit[], side: BattleUnit['side']) =>
  units.filter((unit) => unit.side === side && unit.currentHp > 0);

const hpRatio = (unit: BattleUnit) => unit.currentHp / Math.max(1, unit.stats.hp);

const pressureTarget = (units: readonly BattleUnit[]) =>
  living(units, 'heroes')
    .map((unit, index) => ({ unit, index }))
    .sort(
      (left, right) =>
        right.unit.threat - left.unit.threat ||
        hpRatio(left.unit) - hpRatio(right.unit) ||
        left.index - right.index,
    )[0]?.unit;

export function previewEnemyPressure(battle: GuildBattleState): EnemyPressureIntent | undefined {
  if (battle.status !== 'active') return undefined;
  const enemies = living(battle.units, 'enemies');
  const target = pressureTarget(battle.units);
  if (enemies.length === 0 || !target) return undefined;
  const enemy = enemies[(battle.enemyResponseCount ?? 0) % enemies.length]!;
  if (target.stats.speed > enemy.stats.speed) {
    return { enemyId: enemy.id, targetId: target.id, outcome: 'dodge', amount: 0 };
  }
  const amount = Math.max(0, enemy.stats.attack - target.stats.defense - (target.guarding ? 1 : 0));
  return {
    enemyId: enemy.id,
    targetId: target.id,
    outcome: amount > 0 ? 'damage' : 'guard',
    amount,
  };
}

export function resolveEnemyPressure(battle: GuildBattleState): {
  battle: GuildBattleState;
  intent?: EnemyPressureIntent;
  events: readonly GuildBattleEvent[];
} {
  const intent = previewEnemyPressure(battle);
  if (!intent) return { battle, events: [] };
  const enemy = battle.units.find(({ id }) => id === intent.enemyId)!;
  const target = battle.units.find(({ id }) => id === intent.targetId)!;
  const afterHp = Math.max(0, target.currentHp - intent.amount);
  const defeated = target.currentHp > 0 && afterHp === 0;
  const units = battle.units.map((unit) =>
    unit.id === target.id ? { ...unit, currentHp: afterHp, guarding: false } : { ...unit },
  );
  const drafts: Omit<GuildBattleEvent, 'id'>[] = [
    intent.outcome === 'damage'
      ? {
          kind: 'enemy_attack',
          message: `${enemy.name}反擊${target.name}，造成 ${intent.amount} 點傷害。`,
          actorId: enemy.id,
          targetId: target.id,
          amount: intent.amount,
          causalId: `enemy-pressure:${battle.sequence}:${enemy.id}`,
        }
      : intent.outcome === 'dodge'
        ? {
            kind: 'dodge',
            message: `${target.name}以速度閃過${enemy.name}的反擊。`,
            actorId: enemy.id,
            targetId: target.id,
            amount: 0,
            causalId: `enemy-pressure:${battle.sequence}:${enemy.id}`,
          }
        : {
            kind: 'guard',
            message: `${target.name}完全擋下${enemy.name}的反擊。`,
            actorId: enemy.id,
            targetId: target.id,
            amount: 0,
            causalId: `enemy-pressure:${battle.sequence}:${enemy.id}`,
          },
  ];
  if (defeated) {
    drafts.push({
      kind: 'unit_defeated',
      message: `${target.name}被敵方反擊擊倒。`,
      actorId: enemy.id,
      targetId: target.id,
      causalId: `enemy-pressure:${battle.sequence}:${enemy.id}:defeat`,
      parentCausalId: `enemy-pressure:${battle.sequence}:${enemy.id}`,
    });
  }
  const heroesAlive = units.some((unit) => unit.side === 'heroes' && unit.currentHp > 0);
  if (!heroesAlive) {
    drafts.push({
      kind: 'defeat',
      message: '遠征隊全員失去戰鬥能力。',
      causalId: `enemy-pressure:${battle.sequence}:defeat`,
    });
  }
  const events = drafts.map((event, index) => ({
    ...event,
    id: battle.sequence + index,
    roundIndex: battle.roundIndex ?? 1,
    causalDepth: 1,
  }));
  return {
    intent,
    events,
    battle: {
      ...battle,
      units,
      status: heroesAlive ? battle.status : 'defeat',
      sequence: battle.sequence + events.length,
      enemyResponseCount: (battle.enemyResponseCount ?? 0) + 1,
      events: [...battle.events, ...events],
    },
  };
}
