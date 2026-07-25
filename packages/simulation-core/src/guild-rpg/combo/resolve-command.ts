import type {
  BattleUnit,
  CardCatalog,
  ComboEvent,
  ComboMetrics,
  CompiledCommand,
  GuildBattleState,
} from '@expedition/shared-types';

import { applyComboDamage } from './apply-combo-damage';
import { calculateHuntDamage } from './calculate-hunt-damage';

function livingEnemies(units: readonly BattleUnit[]) {
  return units.filter((unit) => unit.side === 'enemies' && unit.currentHp > 0);
}

function selectedEnemyId(units: readonly BattleUnit[], selectedTargetId?: string) {
  const enemies = livingEnemies(units);
  return enemies.find((enemy) => enemy.id === selectedTargetId)?.id ?? enemies[0]?.id;
}

function replaceUnit(units: BattleUnit[], nextUnit: BattleUnit) {
  const index = units.findIndex((unit) => unit.id === nextUnit.id);
  units[index] = nextUnit;
}

export function resolveCommand(
  battle: GuildBattleState,
  command: CompiledCommand,
  cards: CardCatalog,
): GuildBattleState {
  if (!battle.combo || battle.status !== 'active' || command.diagnostics.length > 0) return battle;

  const units = battle.units.map((unit) => ({ ...unit }));
  const events: ComboEvent[] = [...battle.combo.events];
  let metrics: ComboMetrics = { ...battle.combo.metrics };
  let eventId = events.length;

  const pushEvent = (event: Omit<ComboEvent, 'id'>) => {
    events.push({ ...event, id: eventId++ });
  };

  for (const step of command.steps) {
    const card = cards[step.cardId]!;
    metrics = { ...metrics, comboCount: metrics.comboCount + 1 };
    pushEvent({
      causalId: step.causalId,
      kind: 'card_played',
      message: `${card.name}加入連擊。`,
      actorId: card.ownerId,
    });

    card.effects.forEach((effect, effectIndex) => {
      const causalId = `${step.causalId}:effect:${effectIndex}`;
      if (effect.kind === 'shield') {
        const actor = units.find((unit) => unit.id === card.ownerId);
        if (actor) actor.guarding = true;
        pushEvent({
          causalId,
          parentCausalId: step.causalId,
          kind: 'shield',
          message: `${card.name}建立 ${effect.amount} 點護盾。`,
          actorId: card.ownerId,
          targetId: card.ownerId,
          amount: effect.amount,
        });
        return;
      }
      if (effect.kind === 'heal') {
        const allies = units.filter((unit) => unit.side === 'heroes' && unit.currentHp > 0);
        const target =
          effect.target === 'self'
            ? allies.find((unit) => unit.id === card.ownerId)
            : allies.sort(
                (left, right) => left.currentHp / left.stats.hp - right.currentHp / right.stats.hp,
              )[0];
        if (!target) return;
        const amount = Math.min(effect.amount, target.stats.hp - target.currentHp);
        target.currentHp += amount;
        pushEvent({
          causalId,
          parentCausalId: step.causalId,
          kind: 'healing',
          message: `${card.name}治療${target.name} ${amount} 點。`,
          actorId: card.ownerId,
          targetId: target.id,
          amount,
        });
        return;
      }

      const enemies = livingEnemies(units);
      const targets =
        effect.target === 'all_enemies'
          ? enemies
          : [enemies.find((unit) => unit.id === battle.selectedTargetId) ?? enemies[0]].filter(
              (target): target is BattleUnit => Boolean(target),
            );

      if (targets.length === 0) {
        const outcome = applyComboDamage(undefined, effect.amount, metrics, true);
        metrics = outcome.metrics;
        pushEvent({
          causalId,
          parentCausalId: step.causalId,
          kind: 'overkill',
          message: `ANNIHILATION OVERFLOW +${effect.amount}`,
          actorId: card.ownerId,
          amount: effect.amount,
        });
        return;
      }

      targets.forEach((target) => {
        const remainingEnemyCount = livingEnemies(units).length;
        const amount = calculateHuntDamage(target, units, effect.amount);
        const outcome = applyComboDamage(target, amount, metrics, remainingEnemyCount === 1);
        metrics = outcome.metrics;
        if (outcome.target) replaceUnit(units, outcome.target);
        const damageCausalId = `${causalId}:${target.id}`;
        pushEvent({
          causalId: damageCausalId,
          parentCausalId: step.causalId,
          kind: 'damage',
          message: `${card.name}對${target.name}造成 ${amount} 傷害。`,
          actorId: card.ownerId,
          targetId: target.id,
          amount,
        });
        if (outcome.defeated) {
          pushEvent({
            causalId: `${causalId}:defeat:${target.id}`,
            parentCausalId: damageCausalId,
            kind: 'unit_defeated',
            message: `${target.name}被擊敗。`,
            targetId: target.id,
          });
        }
        if (outcome.overflow > 0) {
          pushEvent({
            causalId: `${causalId}:overkill:${target.id}`,
            parentCausalId: damageCausalId,
            kind: 'overkill',
            message: `OVERKILL +${outcome.overflow}`,
            targetId: target.id,
            amount: outcome.overflow,
          });
        }
      });
    });
  }

  const enemiesAlive = livingEnemies(units).length > 0;
  if (!enemiesAlive) {
    pushEvent({
      causalId: `victory:${battle.sequence}`,
      kind: 'victory',
      message: '整條軍令結算完成，敵軍全滅。',
    });
  }
  return {
    ...battle,
    status: enemiesAlive ? 'active' : 'victory',
    sequence: battle.sequence + events.length,
    selectedTargetId: selectedEnemyId(units, battle.selectedTargetId),
    units,
    combo: {
      ...battle.combo,
      phase: enemiesAlive ? 'composing' : 'complete',
      draft: { cardIds: [] },
      events,
      metrics,
    },
  };
}
