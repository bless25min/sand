import type { GuildBattleState, GuildSkillDefinition } from '@expedition/shared-types';

import type { RandomSource } from '../../rng/random-source';
import { chooseAutoAction } from './choose-auto-action';
import { resolveGuildBattleAction } from './resolve-action';

const GAUGE_MILLISECONDS_PER_SPEED = 400;

export function advanceGuildBattle(
  battle: GuildBattleState,
  elapsedMs: number,
  skills: Readonly<Record<string, GuildSkillDefinition>>,
  random: RandomSource,
): GuildBattleState {
  if (battle.status !== 'active' || battle.pendingLeaderId || elapsedMs <= 0) return battle;

  let next: GuildBattleState = {
    ...battle,
    elapsedMs: battle.elapsedMs + elapsedMs,
    units: battle.units.map((unit) =>
      unit.currentHp <= 0
        ? unit
        : {
            ...unit,
            gauge: Math.min(
              100,
              unit.gauge + (unit.stats.speed * elapsedMs) / GAUGE_MILLISECONDS_PER_SPEED,
            ),
          },
    ),
  };

  for (let turn = 0; turn < next.units.length * 2; turn += 1) {
    const ready = next.units.find((unit) => unit.currentHp > 0 && unit.gauge >= 100);
    if (!ready) break;
    if (ready.isLeader && !next.leaderAuto) {
      return { ...next, pendingLeaderId: ready.id };
    }

    next = resolveGuildBattleAction(next, chooseAutoAction(next, ready.id, skills), skills, random);
    if (next.status !== 'active') break;
  }

  return next;
}
