import type { BattleUnit, GuildBattleState, StartBattleInput } from '@expedition/shared-types';

import { calculateAdventurerStats } from './calculate-stats';

export function createGuildBattle(input: StartBattleInput): GuildBattleState {
  const heroes: BattleUnit[] = input.party.map((adventurer) => {
    const definition = input.adventurers.find(
      (candidate) => candidate.id === adventurer.definitionId,
    );
    if (!definition) throw new Error(`Unknown adventurer: ${adventurer.definitionId}`);

    const stats = calculateAdventurerStats(adventurer, definition);
    return {
      id: definition.id,
      name: definition.name,
      side: 'heroes',
      role: definition.role,
      stats,
      currentHp: stats.hp,
      gauge: 0,
      threat: definition.role === 'vanguard' ? 12 : 0,
      guarding: false,
      isLeader: definition.id === input.leaderId,
      skillIds: definition.skillIds,
    };
  });

  if (!heroes.some((unit) => unit.isLeader)) {
    throw new Error(`Leader is not in the party: ${input.leaderId}`);
  }

  const enemies: BattleUnit[] = input.quest.enemies.map((enemy) => ({
    id: enemy.id,
    name: enemy.name,
    side: 'enemies',
    stats: { ...enemy.stats },
    currentHp: enemy.stats.hp,
    gauge: 0,
    threat: 0,
    guarding: false,
    isLeader: false,
    skillIds: ['basic_attack'],
  }));

  return {
    questId: input.quest.id,
    seed: input.seed,
    elapsedMs: 0,
    sequence: 1,
    status: 'active',
    units: [...heroes, ...enemies],
    selectedTargetId: enemies[0]?.id,
    leaderAuto: input.leaderAuto ?? false,
    events: [
      {
        id: 0,
        kind: 'battle_started',
        message: `${input.quest.name}戰鬥開始。`,
      },
    ],
  };
}
