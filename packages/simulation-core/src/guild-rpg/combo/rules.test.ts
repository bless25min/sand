import type {
  AdventurerDefinition,
  CardCatalog,
  ComboRuleDefinition,
  ComboRuntimeState,
  GuildBattleState,
  QuestDefinition,
  RuleCatalog,
} from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { createGuildBattle } from '../battle/create-battle';
import { compileCommand } from './compile-command';
import { resolveCommand } from './resolve-command';
import { resolveTriggerQueue } from './resolve-trigger-queue';

const adventurers: readonly AdventurerDefinition[] = [
  {
    id: 'tester',
    name: '測試者',
    title: '觸發專家',
    role: 'vanguard',
    baseStats: { hp: 200, attack: 10, defense: 10, speed: 10, healing: 20 },
    skillIds: ['basic_attack'],
  },
];

const quest: QuestDefinition = {
  id: 'rule-training',
  zoneId: 'training-zone',
  name: '規則訓練',
  description: '驗證三條 build engine。',
  recommendedLevel: 1,
  rewardExperience: 0,
  rewardGold: 0,
  enemies: [
    {
      id: 'dummy-a',
      name: '標靶甲',
      stats: { hp: 100, attack: 0, defense: 0, speed: 0, healing: 0 },
    },
    {
      id: 'dummy-b',
      name: '標靶乙',
      stats: { hp: 100, attack: 0, defense: 0, speed: 0, healing: 0 },
    },
  ],
};

const cards: CardCatalog = {
  block: {
    id: 'block',
    ownerId: 'tester',
    name: '格擋起手',
    description: '建立 Block。',
    emitsTags: ['block'],
    effects: [{ kind: 'shield', target: 'self', amount: 10 }],
  },
  hit: {
    id: 'hit',
    ownerId: 'tester',
    name: '命中起手',
    description: '建立 Hit。',
    emitsTags: ['hit'],
    effects: [{ kind: 'damage', target: 'selected_enemy', amount: 1 }],
  },
  overflow: {
    id: 'overflow',
    ownerId: 'tester',
    name: '溢出起手',
    description: '建立 HealOverflow。',
    emitsTags: ['heal_overflow'],
    effects: [{ kind: 'heal', target: 'self', amount: 10 }],
  },
};

function runtime(): ComboRuntimeState {
  return {
    phase: 'composing',
    draft: { cardIds: [] },
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

function battle(): GuildBattleState {
  return {
    ...createGuildBattle({
      adventurers,
      quest,
      party: [{ definitionId: 'tester', level: 1, experience: 0, equipment: {} }],
      leaderId: 'tester',
      seed: 'rules',
    }),
    combo: runtime(),
  };
}

function rule(
  id: string,
  trigger: ComboRuleDefinition['trigger'],
  selector: ComboRuleDefinition['selector'],
  amount: number,
  transforms: ComboRuleDefinition['transforms'],
): ComboRuleDefinition {
  return {
    id,
    name: id,
    description: id,
    trigger,
    selector,
    effects: [{ kind: 'damage', amount }],
    transforms,
  };
}

function run(cardId: string, rules: RuleCatalog) {
  const command = compileCommand({ cardIds: [cardId] }, cards);
  const base = resolveCommand(battle(), command, cards);
  return resolveTriggerQueue({ battle: base, command, rules });
}

describe('combo rule engines', () => {
  it('resolves retaliation, ricochet, and healing overflow as distinct chains', () => {
    const retaliation = run('block', {
      retaliation: rule('retaliation', 'block', 'target', 20, ['repeat']),
    });
    const ricochet = run('hit', {
      ricochet: rule('ricochet', 'hit', 'all', 15, ['fork', 'ricochet']),
    });
    const healing = run('overflow', {
      healing: rule('healing', 'heal_overflow', 'all', 12, ['convert_element', 'multiply']),
    });

    expect(retaliation.battle.units.filter((unit) => unit.side === 'enemies')).toMatchObject([
      { currentHp: 80 },
      { currentHp: 100 },
    ]);
    expect(ricochet.battle.units.filter((unit) => unit.side === 'enemies')).toMatchObject([
      { currentHp: 84 },
      { currentHp: 85 },
    ]);
    expect(healing.battle.units.filter((unit) => unit.side === 'enemies')).toMatchObject([
      { currentHp: 88 },
      { currentHp: 88 },
    ]);
    expect(
      [retaliation, ricochet, healing].every((result) =>
        result.events.some((event) => event.kind === 'rule_triggered'),
      ),
    ).toBe(true);
  });

  it('converts a reachable positive causal cycle into Infinite Engine', () => {
    const cycle = run('hit', {
      hit_to_block: {
        ...rule('hit_to_block', 'hit', 'target', 5, ['convert_element']),
        emitsTriggers: ['block'],
      },
      block_to_hit: {
        ...rule('block_to_hit', 'block', 'target', 5, ['convert_element']),
        emitsTriggers: ['hit'],
      },
    });

    expect(cycle.infinite).toBe(true);
    expect(cycle.events.at(-1)?.kind).toBe('infinite_engine');
    expect(cycle.battle.combo?.metrics.annihilationOverflow).toBeGreaterThan(0);
  });
});
