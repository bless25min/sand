import {
  GUILD_ELEMENTS,
  GUILD_SKILL_FORMS,
  GUILD_SKILL_SPECIALIZATIONS,
  GUILD_TRIGGER_CONDITIONS,
} from '@expedition/game-data';
import type {
  BattleUnit,
  GuildBattleState,
  GuildSkillItem,
  HuntDefinition,
  SkillComponent,
} from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { createRoundOrder } from '../round-order/create-round-order';
import { resolveSkill, type SkillEngineContent } from './resolve-skill';

const heroIds = ['brann', 'lyra', 'elin', 'seph', 'lorne', 'kyro'];

const unit = (
  id: string,
  side: BattleUnit['side'],
  overrides: Partial<BattleUnit> = {},
): BattleUnit => ({
  id,
  name: id,
  side,
  stats: { hp: 20, attack: 1, defense: 1, speed: 1, healing: 1 },
  currentHp: 20,
  gauge: 0,
  threat: 0,
  guarding: false,
  isLeader: id === 'brann',
  skillIds: ['test-skill'],
  statusLayers: { burn: 0, poison: 0, tide: 0 },
  ...overrides,
});

const component: SkillComponent = {
  id: 'test-component',
  qualityRank: 1,
  formId: 'fire.chain.on_hit',
  element: 'fire',
  specializationId: 'chain',
  triggerId: 'on_hit',
  power: 1,
  layerStrength: 1,
  triggerAddition: 1,
  repeatCount: 1,
};

const skill: GuildSkillItem = {
  id: 'test-skill',
  name: '測試技能',
  stars: 1,
  components: [component],
};

const hunt: HuntDefinition = {
  id: 'test-hunt',
  questId: 'test-quest',
  pressureLabel: '測試壓力',
  counterBrief: '測試提示',
  rewardExperience: 0,
  rewardGold: 0,
  bossEnemyId: 'boss',
  bossPhases: [
    {
      id: 'boss-open',
      bossEnemyId: 'boss',
      activateAfterEnemyIds: ['guard'],
      pressureLabel: '護衛已破，首領暴露',
      cueId: 'boss-open',
    },
  ],
  enemies: [],
};

const content: SkillEngineContent = {
  skills: { [skill.id]: skill },
  elements: GUILD_ELEMENTS,
  specializations: GUILD_SKILL_SPECIALIZATIONS,
  triggers: GUILD_TRIGGER_CONDITIONS,
  forms: GUILD_SKILL_FORMS,
  hunts: [hunt],
};

const battle = (units: readonly BattleUnit[]): GuildBattleState => ({
  questId: 'test-quest',
  seed: 'fixed',
  elapsedMs: 0,
  sequence: 0,
  status: 'active',
  units,
  selectedTargetId: 'boss',
  leaderAuto: false,
  events: [],
  roundOrder: createRoundOrder(heroIds),
  skillHistory: [],
  roundIndex: 1,
});

describe('active hunt mechanics', () => {
  it('redirects a selected boss to its living guard', () => {
    const state = battle([
      ...heroIds.map((id) => unit(id, 'heroes')),
      unit('guard', 'enemies'),
      unit('boss', 'enemies', {
        huntTraits: [
          {
            id: 'guarded',
            name: '護衛中',
            description: '護衛存活時攔截攻擊。',
            counterBuildIds: [],
            guardedByEnemyIds: ['guard'],
          },
        ],
      }),
    ]);

    const result = resolveSkill({
      battle: state,
      actorId: 'brann',
      skillId: skill.id,
      targetId: 'boss',
      content,
    });

    expect(
      result.events.some(({ kind, targetId }) => kind === 'damage' && targetId === 'guard'),
    ).toBe(true);
    expect(result.battle.units.find(({ id }) => id === 'boss')?.currentHp).toBe(20);
  });

  it('adds one visible weakness reaction for a matching specialization', () => {
    const state = battle([
      ...heroIds.map((id) => unit(id, 'heroes')),
      unit('boss', 'enemies', {
        huntTraits: [
          {
            id: 'chain-weakness',
            name: '連鎖弱點',
            description: '連鎖彈射會引發反應。',
            counterBuildIds: [],
            vulnerableSpecializationIds: ['chain'],
          },
        ],
      }),
    ]);

    const result = resolveSkill({
      battle: state,
      actorId: 'brann',
      skillId: skill.id,
      targetId: 'boss',
      content,
    });

    expect(
      result.events.filter(
        ({ kind, amount, causalId }) =>
          kind === 'reaction' && amount === 1 && causalId?.includes('weakness'),
      ),
    ).toHaveLength(1);
  });

  it('opens a boss phase once when the final guard falls', () => {
    let state = battle([
      ...heroIds.map((id) => unit(id, 'heroes')),
      unit('guard', 'enemies', { currentHp: 1 }),
      unit('boss', 'enemies'),
    ]);

    const first = resolveSkill({
      battle: state,
      actorId: 'brann',
      skillId: skill.id,
      targetId: 'guard',
      content,
    });
    expect(first.events.filter(({ kind }) => kind === 'boss_phase')).toHaveLength(1);
    expect(first.battle.selectedTargetId).toBe('boss');

    state = first.battle;
    const second = resolveSkill({
      battle: state,
      actorId: 'lyra',
      skillId: skill.id,
      targetId: 'boss',
      content,
    });
    expect(second.events.filter(({ kind }) => kind === 'boss_phase')).toHaveLength(0);
    expect(second.battle.activatedBossPhaseIds).toEqual(['boss-open']);
  });

  it('removes a hero defeated by the response from the remaining relay order', () => {
    const state = battle([
      unit('brann', 'heroes'),
      unit('lyra', 'heroes', { currentHp: 1, threat: 5 }),
      unit('elin', 'heroes'),
      unit('seph', 'heroes'),
      unit('lorne', 'heroes'),
      unit('kyro', 'heroes'),
      unit('boss', 'enemies', {
        stats: { hp: 20, attack: 3, defense: 1, speed: 1, healing: 0 },
      }),
    ]);

    const result = resolveSkill({
      battle: state,
      actorId: 'brann',
      skillId: skill.id,
      targetId: 'boss',
      content,
    });

    expect(result.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'enemy_attack', actorId: 'boss', targetId: 'lyra' }),
        expect.objectContaining({ kind: 'unit_defeated', targetId: 'lyra' }),
      ]),
    );
    expect(result.battle.roundOrder).toMatchObject({
      currentOrder: ['brann', 'elin', 'seph', 'lorne', 'kyro'],
      activeAdventurerId: 'elin',
      actedIds: ['brann'],
    });
  });
});
