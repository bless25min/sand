import type {
  AdventurerDefinition,
  ComboCardDefinition,
  ComboRuntimeState,
  GuildBattleState,
  QuestDefinition,
} from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { createGuildBattle } from '../battle/create-battle';
import { advanceComposition } from './advance-composition';
import { compileCommand } from './compile-command';
import { resolveCommand } from './resolve-command';

const adventurers: readonly AdventurerDefinition[] = [
  {
    id: 'guard',
    name: '守衛',
    title: '前鋒',
    role: 'vanguard',
    baseStats: { hp: 300, attack: 20, defense: 20, speed: 10, healing: 0 },
    skillIds: ['basic_attack'],
  },
];

const quest: QuestDefinition = {
  id: 'training',
  name: '爆發試煉',
  description: '測試自由軍令。',
  recommendedLevel: 1,
  rewardExperience: 1,
  rewardGold: 1,
  enemies: [
    {
      id: 'target-a',
      name: '標靶甲',
      stats: { hp: 50, attack: 24, defense: 0, speed: 200, healing: 0 },
    },
    {
      id: 'target-b',
      name: '標靶乙',
      stats: { hp: 40, attack: 0, defense: 0, speed: 0, healing: 0 },
    },
  ],
};

const cards: Readonly<Record<string, ComboCardDefinition>> = {
  brace: {
    id: 'brace',
    ownerId: 'guard',
    name: '架盾',
    description: '建立格擋起點。',
    emitsTags: ['block'],
    effects: [{ kind: 'shield', target: 'self', amount: 30 }],
  },
  riposte: {
    id: 'riposte',
    ownerId: 'guard',
    name: '反擊',
    description: '格擋後反擊。',
    requiresTags: ['block'],
    emitsTags: ['hit'],
    effects: [{ kind: 'damage', target: 'selected_enemy', amount: 60 }],
  },
  sweep: {
    id: 'sweep',
    ownerId: 'guard',
    name: '橫掃',
    description: '攻擊全體。',
    requiresTags: ['hit'],
    emitsTags: ['area'],
    effects: [{ kind: 'damage', target: 'all_enemies', amount: 50 }],
  },
};

function createComboRuntime(cardIds: readonly string[] = []): ComboRuntimeState {
  return {
    phase: 'composing',
    draft: { cardIds },
    availableCardIds: Object.keys(cards),
    events: [],
    metrics: {
      comboCount: 0,
      totalDamage: 0,
      totalOverkill: 0,
      defeatedEnemyIds: [],
      annihilationOverflow: 0,
    },
  };
}

function createBattle(cardIds: readonly string[] = []): GuildBattleState {
  return {
    ...createGuildBattle({
      adventurers,
      quest,
      party: [{ definitionId: 'guard', level: 1, experience: 0, equipment: {} }],
      leaderId: 'guard',
      seed: 'combo-test',
    }),
    combo: createComboRuntime(cardIds),
  };
}

describe('free-form combo command', () => {
  it('uses tag causality without a global cost or command length limit', () => {
    expect(compileCommand({ cardIds: ['riposte'] }, cards).diagnostics).toContain('反擊需要 block');
    expect(compileCommand({ cardIds: ['brace', 'riposte', 'sweep'] }, cards).diagnostics).toEqual(
      [],
    );

    const longCommand = compileCommand(
      { cardIds: Array.from({ length: 64 }, () => 'brace') },
      cards,
    );
    expect(longCommand.cardIds).toHaveLength(64);
    expect(longCommand.diagnostics).toEqual([]);
  });

  it('resolves the complete command after lethal damage and records overflow', () => {
    const command = compileCommand({ cardIds: ['brace', 'riposte', 'sweep'] }, cards);
    const result = resolveCommand(createBattle(command.cardIds), command, cards);

    expect(result.status).toBe('victory');
    expect(result.combo?.metrics.comboCount).toBe(3);
    expect(result.combo?.metrics.defeatedEnemyIds).toEqual(['target-a', 'target-b']);
    expect(result.combo?.metrics.totalOverkill).toBeGreaterThan(0);
    expect(result.combo?.metrics.annihilationOverflow).toBeGreaterThan(0);
  });

  it('emits a deterministic causal trace for identical input', () => {
    const command = compileCommand({ cardIds: ['brace', 'riposte', 'sweep'] }, cards);
    const first = resolveCommand(createBattle(command.cardIds), command, cards);
    const second = resolveCommand(createBattle(command.cardIds), command, cards);

    expect(first).toEqual(second);
    expect(first.combo?.events.map((event) => event.kind)).toEqual(
      expect.arrayContaining(['card_played', 'damage', 'unit_defeated', 'overkill']),
    );
    expect(first.combo?.events.every((event) => event.causalId.length > 0)).toBe(true);
    const seenCausalIds = new Set<string>();
    for (const event of first.combo!.events) {
      if (event.parentCausalId) expect(seenCausalIds.has(event.parentCausalId)).toBe(true);
      seenCausalIds.add(event.causalId);
    }
  });

  it('lets enemies pressure the party at quarter speed while preserving the draft', () => {
    const before = createBattle(['brace', 'riposte']);
    const heroHp = before.units.find((unit) => unit.side === 'heroes')!.currentHp;
    const after = advanceComposition(before, 1_000);

    expect(after.elapsedMs).toBe(1_000);
    expect(after.units.find((unit) => unit.side === 'heroes')!.currentHp).toBeLessThan(heroHp);
    expect(after.combo?.draft.cardIds).toEqual(['brace', 'riposte']);
    expect(after.combo?.events.at(-1)?.kind).toBe('enemy_pressure');
  });
});
