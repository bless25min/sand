import type { ComboRuntimeState, GuildBattleState, HuntDefinition } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { resolveBossPhase } from './resolve-boss-phase';

const runtime: ComboRuntimeState = {
  phase: 'composing',
  draft: { cardIds: [] },
  availableCardIds: [],
  events: [
    {
      id: 0,
      causalId: 'damage:guard-b',
      kind: 'damage',
      message: '最後一名護衛受到致命傷。',
      targetId: 'guard-b',
      amount: 50,
    },
    {
      id: 1,
      causalId: 'defeat:guard-b',
      parentCausalId: 'damage:guard-b',
      kind: 'unit_defeated',
      message: '最後一名護衛倒下。',
      targetId: 'guard-b',
    },
  ],
  metrics: {
    comboCount: 1,
    totalDamage: 50,
    totalOverkill: 0,
    defeatedEnemyIds: ['guard-a', 'guard-b'],
    annihilationOverflow: 0,
  },
};

const battle: GuildBattleState = {
  questId: 'training',
  seed: 'boss-phase',
  elapsedMs: 0,
  sequence: 0,
  status: 'active',
  units: [
    {
      id: 'hero',
      name: '英雄',
      side: 'heroes',
      stats: { hp: 100, attack: 10, defense: 10, speed: 10, healing: 0 },
      currentHp: 100,
      gauge: 0,
      threat: 1,
      guarding: false,
      isLeader: true,
      skillIds: [],
    },
    ...['guard-a', 'guard-b', 'boss'].map((id) => ({
      id,
      name: id,
      side: 'enemies' as const,
      stats: { hp: 100, attack: 10, defense: 10, speed: 10, healing: 0 },
      currentHp: id === 'boss' ? 100 : 0,
      gauge: 0,
      threat: 0,
      guarding: false,
      isLeader: false,
      skillIds: [],
    })),
  ],
  selectedTargetId: 'guard-b',
  leaderAuto: false,
  events: [],
  combo: runtime,
};

const hunt: HuntDefinition = {
  id: 'training-hunt',
  questId: 'training',
  rewardExperience: 1,
  rewardGold: 1,
  enemies: [],
  bossPhases: [
    {
      id: 'boss-execution',
      bossEnemyId: 'boss',
      activateAfterEnemyIds: ['guard-a', 'guard-b'],
      pressureLabel: '處刑窗開啟',
      cueId: 'training-execution',
    },
  ],
};

describe('boss phase resolver', () => {
  it('emits and targets one causal execution phase after the final guard falls', () => {
    const result = resolveBossPhase({ battle, hunt });
    const phase = result.combo?.events.at(-1);

    expect(result.selectedTargetId).toBe('boss');
    expect(result.combo?.activatedBossPhaseIds).toEqual(['boss-execution']);
    expect(phase).toMatchObject({
      kind: 'boss_phase',
      causalId: 'boss-phase:boss-execution',
      parentCausalId: 'defeat:guard-b',
      targetId: 'boss',
      phaseId: 'boss-execution',
      cueId: 'training-execution',
      message: '處刑窗開啟',
    });
    expect(resolveBossPhase({ battle: result, hunt })).toBe(result);
  });

  it('does not open the phase after the boss is already dead', () => {
    const bossDead = {
      ...battle,
      units: battle.units.map((unit) => (unit.id === 'boss' ? { ...unit, currentHp: 0 } : unit)),
    };

    expect(resolveBossPhase({ battle: bossDead, hunt })).toBe(bossDead);
  });
});
