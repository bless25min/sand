import type { BattleUnit, GuildElement, TriggerCondition } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import {
  createCommandLens,
  formatComboCue,
  formatTriggerCue,
  reduceCommandSelection,
  type CommandSelection,
  type SkillOptionInput,
} from './command-lens';

describe('formatTriggerCue', () => {
  it('turns trigger ids into short player-facing cues without raw system ids', () => {
    expect(formatTriggerCue('target_burning', true)).toEqual({
      state: 'ready',
      text: '✓ 已觸發・目標燃燒',
    });
    expect(formatTriggerCue('previous_grass', false)).toEqual({
      state: 'blocked',
      text: '○ 需要・前招為草',
    });
    expect(formatTriggerCue('consume_all_poison', false).text).not.toContain('_');
  });

  it('summarizes fused skill readiness without assigning a later trigger to the first component', () => {
    expect(
      formatComboCue([
        { triggerId: 'target_burning', readiness: 'not-ready' },
        { triggerId: 'on_hit', readiness: 'ready' },
      ]),
    ).toEqual({
      state: 'partial',
      text: '連招 1/2・缺目標燃燒',
    });
  });
});

const unit = (
  id: string,
  side: BattleUnit['side'],
  currentHp: number,
  skillIds: readonly string[] = [],
): BattleUnit => ({
  id,
  name: id,
  side,
  stats: { hp: 10, attack: 1, defense: 1, speed: 1, healing: 1 },
  currentHp,
  gauge: 0,
  threat: 0,
  guarding: false,
  isLeader: id === 'hero-1',
  skillIds,
});

const option = (id: string, overrides: Partial<SkillOptionInput> = {}): SkillOptionInput => ({
  id,
  name: `技能 ${id}`,
  element: 'fire' as GuildElement,
  triggerId: 'target_burning' as TriggerCondition,
  triggerName: '目標燃燒',
  triggerReady: true,
  baseDamage: 4,
  totalDamage: 9,
  hitCount: 3,
  chaseCount: 2,
  statusName: '燃燒',
  statusBefore: 2,
  statusAfter: 5,
  nextRelayNames: ['萊拉'],
  ...overrides,
});

const units = [
  unit('hero-1', 'heroes', 10, ['skill-1', 'skill-2', 'skill-3', 'skill-4', 'skill-5', 'skill-6']),
  unit('hero-2', 'heroes', 10, ['skill-7']),
  unit('enemy-1', 'enemies', 8),
  unit('enemy-2', 'enemies', 0),
];

const readySelection: CommandSelection = {
  actorId: 'hero-1',
  targetId: 'enemy-1',
  skillId: 'skill-1',
};

describe('createCommandLens', () => {
  it('keeps the current actor, target and all six skills obvious without prose arithmetic', () => {
    const lens = createCommandLens({
      units,
      selection: readySelection,
      skills: [
        option('skill-1'),
        option('skill-2'),
        option('skill-3'),
        option('skill-4'),
        option('skill-5'),
        option('skill-6'),
      ],
    });

    expect(lens.actor?.id).toBe('hero-1');
    expect(lens.target?.id).toBe('enemy-1');
    expect(lens.skills).toHaveLength(6);
    expect(lens.selectedSkill).toMatchObject({
      id: 'skill-1',
      primaryValue: { label: '預計傷害', value: 9 },
      hitValue: { label: '命中', value: 3 },
      chaseValue: { label: '追擊', value: 2 },
      condition: { label: '目標燃燒', state: 'ready' },
      statusChange: { label: '燃燒', before: 2, after: 5 },
      nextRelayNames: ['萊拉'],
    });
    expect(lens.instruction).toBe('點敵人出招・再點技能也可出招');
  });

  it('explains a blocked trigger while keeping defeated enemies targetable for execution', () => {
    const lens = createCommandLens({
      units,
      selection: { actorId: 'hero-1', targetId: 'enemy-2', skillId: 'skill-1' },
      skills: [
        option('skill-1', {
          triggerReady: false,
          missingCondition: '需要燃燒 1 層',
          totalDamage: 4,
          chaseCount: 0,
        }),
      ],
    });

    expect(lens.target?.id).toBe('enemy-2');
    expect(lens.selectedSkill?.condition).toEqual({
      label: '需要燃燒 1 層',
      state: 'blocked',
    });
    expect(lens.instruction).toBe('點敵人出招・再點技能也可出招');
  });
});

describe('reduceCommandSelection', () => {
  it('selects a hero, inspects a skill, executes by target tap or repeat skill tap', () => {
    expect(
      reduceCommandSelection(readySelection, { kind: 'select-actor', actorId: 'hero-2' }),
    ).toEqual({
      selection: { actorId: 'hero-2' },
    });

    expect(
      reduceCommandSelection(
        { actorId: 'hero-1', targetId: 'enemy-1' },
        { kind: 'tap-skill', skillId: 'skill-1' },
      ),
    ).toEqual({ selection: readySelection });

    expect(
      reduceCommandSelection(readySelection, { kind: 'tap-target', targetId: 'enemy-1' }),
    ).toEqual({ selection: readySelection, execute: readySelection });

    expect(
      reduceCommandSelection(readySelection, { kind: 'tap-skill', skillId: 'skill-1' }),
    ).toEqual({ selection: readySelection, execute: readySelection });
  });

  it('reorders only heroes who have not acted and preserves every actor exactly once', () => {
    expect(
      reduceCommandSelection(readySelection, {
        kind: 'reorder',
        actorId: 'hero-3',
        beforeActorId: 'hero-2',
        currentOrder: ['hero-1', 'hero-2', 'hero-3'],
        actedIds: ['hero-1'],
      }),
    ).toEqual({
      selection: readySelection,
      nextOrder: ['hero-1', 'hero-3', 'hero-2'],
    });

    expect(
      reduceCommandSelection(readySelection, {
        kind: 'reorder',
        actorId: 'hero-1',
        beforeActorId: 'hero-3',
        currentOrder: ['hero-1', 'hero-2', 'hero-3'],
        actedIds: ['hero-1'],
      }),
    ).toEqual({ selection: readySelection });
  });
});
