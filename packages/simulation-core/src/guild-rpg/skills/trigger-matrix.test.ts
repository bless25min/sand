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
  OwnedSkill,
  SkillComponent,
} from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { createRoundOrder } from '../round-order/create-round-order';
import { calculateHuntDamage } from '../combo/calculate-hunt-damage';
import { fuseSkills } from './fuse-skills';
import { previewTriggerReadiness } from './preview-trigger-readiness';
import { resolveSkillTriggerQueue } from './resolve-skill-trigger-queue';
import { resolveSkill } from './resolve-skill';
import { triggerMatches } from './resolve-trigger';

const heroIds = ['brann', 'lyra', 'elin', 'seph', 'lorne', 'kyro'];
const passiveIds = [
  'ironwall-delivery',
  'eagle-eye-delivery',
  'morning-tide-delivery',
  'catalyst-delivery',
  'tide-order-delivery',
  'ember-finale-delivery',
];

const unit = (id: string, side: BattleUnit['side'], hp = 160): BattleUnit => ({
  id,
  name: id,
  side,
  stats: { hp, attack: side === 'heroes' ? 20 : 10, defense: 4, speed: 10, healing: 8 },
  currentHp: hp,
  gauge: 0,
  threat: 0,
  guarding: false,
  isLeader: id === 'brann',
  skillIds: [],
  statusLayers: { burn: 0, poison: 0, tide: 0 },
  defenseReduction: 0,
  strengthened: 0,
});

const battle = (enemyHp = 160): GuildBattleState => ({
  questId: 'engine-test',
  seed: 'fixed',
  elapsedMs: 0,
  sequence: 1,
  status: 'active',
  units: [...heroIds.map((id) => unit(id, 'heroes')), unit('enemy-a', 'enemies', enemyHp)],
  selectedTargetId: 'enemy-a',
  leaderAuto: false,
  events: [],
  roundOrder: createRoundOrder(heroIds),
  skillHistory: [],
  roundIndex: 1,
});

const component = (
  element: SkillComponent['element'],
  specializationId: SkillComponent['specializationId'],
  triggerId: SkillComponent['triggerId'],
  overrides: Partial<SkillComponent> = {},
): SkillComponent => ({
  id: `${element}-${specializationId}-${triggerId}`,
  formId: `${element}.${specializationId}.${triggerId}`,
  element,
  specializationId,
  triggerId,
  power: 8,
  layerStrength: 3,
  triggerAddition: 4,
  repeatCount: 3,
  ...overrides,
});

const skill = (selectedComponent: SkillComponent): OwnedSkill => ({
  id: selectedComponent.id,
  name: '測試技能',
  stars: 1,
  components: [selectedComponent],
});

const content = (skills: GuildSkillItem[]) => ({
  skills: Object.fromEntries(skills.map((entry) => [entry.id, entry])),
  elements: GUILD_ELEMENTS,
  specializations: GUILD_SKILL_SPECIALIZATIONS,
  triggers: GUILD_TRIGGER_CONDITIONS,
  forms: GUILD_SKILL_FORMS,
});

describe('deterministic skill engine', () => {
  it('completes all six relay actions before victory and turns early kills into overkill', () => {
    const selected = skill(component('fire', 'multistrike', 'on_hit'));
    const engineContent = content([selected]);
    let state = battle(1);
    const turns = [];

    for (const actorId of heroIds) {
      const result = resolveSkill({
        battle: state,
        actorId,
        skillId: selected.id,
        targetId: 'enemy-a',
        content: engineContent,
      });
      turns.push(result);
      state = result.battle;
    }

    expect(
      turns.slice(0, 5).every(({ battle: turnBattle }) => turnBattle.status === 'active'),
    ).toBe(true);
    expect(turns[0]!.battle.selectedTargetId).toBe('enemy-a');
    expect(
      turns.slice(1).every(({ events }) => events.some(({ kind }) => kind === 'overkill')),
    ).toBe(true);
    expect(turns[4]!.battle).toMatchObject({
      status: 'active',
      roundOrder: {
        activeAdventurerId: 'kyro',
        actedIds: ['brann', 'lyra', 'elin', 'seph', 'lorne'],
      },
    });
    expect(
      turns[4]!.battle.units.filter(({ side, currentHp }) => side === 'enemies' && currentHp > 0),
    ).toHaveLength(0);
    expect(
      turns[5]!.events.some(({ kind }) =>
        ['damage', 'reaction', 'status_applied', 'passive'].includes(kind),
      ),
    ).toBe(false);
    expect(turns[5]!.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'relay', amount: 6 }),
        expect.objectContaining({ kind: 'finisher' }),
        expect.objectContaining({ kind: 'victory' }),
      ]),
    );
    expect(turns[5]!.events.slice(-2).map(({ kind }) => kind)).toEqual(['finisher', 'victory']);
    expect(state).toMatchObject({ status: 'victory', selectedTargetId: 'enemy-a' });
    expect(state.skillHistory).toHaveLength(6);
  });

  it('resolves a tapped skill immediately as separate additive hits', () => {
    const selected = skill(component('fire', 'multistrike', 'on_hit'));
    const result = resolveSkill({
      battle: battle(),
      actorId: 'brann',
      skillId: selected.id,
      targetId: 'enemy-a',
      content: content([selected]),
    });

    expect(result.events[0]).toMatchObject({
      kind: 'skill_cast',
      actorId: 'brann',
      targetId: 'enemy-a',
      element: 'fire',
      specializationId: 'multistrike',
      triggerId: 'on_hit',
    });
    expect(result.events.filter((event) => event.kind === 'damage').length).toBeGreaterThanOrEqual(
      3,
    );
    expect(
      result.events.every((event) => event.amount === undefined || Number.isInteger(event.amount)),
    ).toBe(true);
    expect(result.battle.units.find(({ id }) => id === 'enemy-a')?.statusLayers?.burn).toBe(3);
    expect(result.battle.roundOrder?.activeAdventurerId).toBe('lyra');
  });

  it('applies every matched trigger addition as a real independent damage event', () => {
    const selected = skill(component('fire', 'multistrike', 'on_hit'));
    const result = resolveSkill({
      battle: battle(),
      actorId: 'brann',
      skillId: selected.id,
      targetId: 'enemy-a',
      content: content([selected]),
    });

    expect(result.events.filter(({ kind }) => kind === 'triggered')).toHaveLength(3);
    expect(result.events.filter(({ kind }) => kind === 'damage')).toHaveLength(6);
    expect(result.battle.units.find(({ id }) => id === 'enemy-a')?.currentHp).toBe(76);
  });

  it('turns every consumed layer into one separate additive burst instead of a multiplier', () => {
    const selected = skill(
      component('fire', 'stack', 'consume_all_burn', {
        power: 0,
        triggerAddition: 2,
      }),
    );
    const state = battle(500);
    state.units = state.units.map((entry) =>
      entry.id === 'enemy-a' ? { ...entry, statusLayers: { burn: 4, poison: 0, tide: 0 } } : entry,
    );
    const result = resolveSkill({
      battle: state,
      actorId: 'brann',
      skillId: selected.id,
      targetId: 'enemy-a',
      content: content([selected]),
    });

    expect(result.events.filter(({ kind }) => kind === 'damage')).toHaveLength(5);
    expect(result.battle.units.find(({ id }) => id === 'enemy-a')?.currentHp).toBe(476);
    expect(result.battle.units.find(({ id }) => id === 'enemy-a')?.statusLayers?.burn).toBe(3);
  });

  it('makes fire, grass, and water create readable layers and cross-element reactions', () => {
    const skills = [
      skill(component('fire', 'stack', 'battle_open')),
      skill(component('grass', 'chain', 'target_burning')),
      skill(component('water', 'empower', 'target_poisoned')),
    ];
    let state = battle(600);
    const allEvents = [];

    for (const [index, selected] of skills.entries()) {
      const actorId = heroIds[index]!;
      const result = resolveSkill({
        battle: state,
        actorId,
        skillId: selected.id,
        targetId: 'enemy-a',
        content: content(skills),
      });
      state = result.battle;
      allEvents.push(...result.events);
    }

    const target = state.units.find(({ id }) => id === 'enemy-a')!;
    expect(target.statusLayers).toMatchObject({ burn: 3, poison: 3, tide: 3 });
    expect(allEvents.filter((event) => event.kind === 'reaction').length).toBeGreaterThanOrEqual(2);
    expect(allEvents.some((event) => event.kind === 'healing')).toBe(true);
  });

  it('counts relay escalation by heroes, not by fused components', () => {
    const fireA = skill(component('fire', 'stack', 'battle_open'));
    const fireB = skill(component('fire', 'weaken', 'target_burning'));
    const fused = fuseSkills([fireA, fireB], 'fused-fire', '雙段火勢');
    const follow = skill(component('grass', 'chain', 'previous_fire'));
    const catalog = content([fused, follow]);

    const first = resolveSkill({
      battle: battle(800),
      actorId: 'brann',
      skillId: fused.id,
      targetId: 'enemy-a',
      content: catalog,
    });
    const second = resolveSkill({
      battle: first.battle,
      actorId: 'lyra',
      skillId: follow.id,
      targetId: 'enemy-a',
      content: catalog,
    });

    expect(second.events.find(({ kind }) => kind === 'relay')?.amount).toBe(2);
    expect(
      second.events.some(
        ({ kind, triggerId }) => kind === 'triggered' && triggerId === 'previous_fire',
      ),
    ).toBe(true);
  });

  it('turns embedded equipment cores into visible additive battle events', () => {
    const state = battle(500);
    state.units = state.units.map((entry) =>
      entry.id === 'brann'
        ? {
            ...entry,
            equippedCores: [
              { id: 'molten-armor', strength: 3 },
              { id: 'venom-depth', strength: 2 },
            ],
          }
        : entry,
    );
    const selected = skill(component('grass', 'stack', 'target_burning'));
    state.units = state.units.map((entry) =>
      entry.id === 'enemy-a' ? { ...entry, statusLayers: { burn: 2, poison: 0, tide: 0 } } : entry,
    );
    const grass = resolveSkill({
      battle: state,
      actorId: 'brann',
      skillId: selected.id,
      targetId: 'enemy-a',
      content: content([selected]),
    });
    expect(grass.battle.units.find(({ id }) => id === 'enemy-a')?.statusLayers?.poison).toBe(5);
    expect(grass.events.some(({ kind }) => kind === 'core_triggered')).toBe(true);

    const fireState = battle(500);
    fireState.units = fireState.units.map((entry) =>
      entry.id === 'brann'
        ? { ...entry, equippedCores: [{ id: 'molten-armor', strength: 3 }] }
        : entry,
    );
    const fire = skill(component('fire', 'stack', 'on_hit'));
    const molten = resolveSkill({
      battle: fireState,
      actorId: 'brann',
      skillId: fire.id,
      targetId: 'enemy-a',
      content: content([fire]),
    });
    expect(molten.battle.units.find(({ id }) => id === 'enemy-a')?.defenseReduction).toBe(3);
    expect(
      molten.events.some(
        ({ kind, message }) => kind === 'core_triggered' && message.includes('熔甲'),
      ),
    ).toBe(true);
  });

  it('lets burn-burst and toxic-mist cores create blast and lone-target echo events', () => {
    const coreBattle = (coreId: string) => {
      const state = battle(800);
      state.units = state.units.map((entry) => {
        if (entry.id === 'brann') {
          return { ...entry, equippedCores: [{ id: coreId, strength: 3 }] };
        }
        if (entry.id === 'enemy-a') {
          return { ...entry, statusLayers: { burn: 4, poison: 0, tide: 0 } };
        }
        return entry;
      });
      return state;
    };

    const fire = skill(component('fire', 'blast', 'consume_all_burn'));
    const burst = resolveSkill({
      battle: coreBattle('burn-burst'),
      actorId: 'brann',
      skillId: fire.id,
      targetId: 'enemy-a',
      content: content([fire]),
    });
    expect(burst.events.filter(({ message }) => message.includes('焚爆核心'))).toHaveLength(3);

    const grass = skill(component('grass', 'stack', 'target_burning'));
    const mist = resolveSkill({
      battle: coreBattle('toxic-mist'),
      actorId: 'brann',
      skillId: grass.id,
      targetId: 'enemy-a',
      content: content([grass]),
    });
    expect(mist.events.filter(({ message }) => message.includes('毒霧核心'))).toHaveLength(3);
  });

  it('lets water relay and lone-king cores change the following events without multipliers', () => {
    const state = battle(800);
    state.units = state.units.map((entry) =>
      entry.id === 'brann'
        ? {
            ...entry,
            equippedCores: [
              { id: 'tide-relay', strength: 4 },
              { id: 'lone-king-loop', strength: 3 },
            ],
          }
        : entry,
    );
    const water = skill(component('water', 'multistrike', 'on_echo'));
    const result = resolveSkill({
      battle: state,
      actorId: 'brann',
      skillId: water.id,
      targetId: 'enemy-a',
      content: content([water]),
    });

    expect(result.battle.units.find(({ id }) => id === 'lyra')?.strengthened).toBe(4);
    expect(
      result.events.some(
        ({ kind, message }) => kind === 'core_triggered' && message.includes('潮湧接力'),
      ),
    ).toBe(true);
    expect(result.events.filter(({ kind }) => kind === 'echo').length).toBeGreaterThanOrEqual(2);
  });

  it('adds one more independent relay echo at every hero and ends the sixth with a finisher', () => {
    const selected = skill(component('fire', 'stack', 'after_skill'));
    let state = battle(4_000);
    const echoCounts: number[] = [];
    const allEvents = [];

    for (const heroId of heroIds) {
      const result = resolveSkill({
        battle: state,
        actorId: heroId,
        skillId: selected.id,
        targetId: 'enemy-a',
        content: content([selected]),
      });
      state = result.battle;
      echoCounts.push(
        result.events.filter(
          ({ kind, message }) => kind === 'damage' && message.includes('接力餘震'),
        ).length,
      );
      allEvents.push(...result.events);
    }

    expect(echoCounts).toEqual([0, 1, 2, 3, 4, 5]);
    expect(allEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'finisher',
          actorId: 'kyro',
          targetId: 'enemy-a',
          element: 'fire',
          specializationId: 'stack',
          triggerId: 'after_skill',
        }),
      ]),
    );
  });

  it('resolves every hero delivery passive as a real traceable event', () => {
    const selected = skill(component('fire', 'stack', 'after_skill'));
    let state = battle(4_000);
    state.units = state.units.map((entry) => {
      const index = heroIds.indexOf(entry.id);
      return index >= 0 ? { ...entry, deliveryPassiveId: passiveIds[index]! } : entry;
    });
    const passiveEvents = [];

    for (const heroId of heroIds) {
      const result = resolveSkill({
        battle: state,
        actorId: heroId,
        skillId: selected.id,
        targetId: 'enemy-a',
        content: content([selected]),
      });
      state = result.battle;
      passiveEvents.push(...result.events.filter(({ kind }) => kind === 'passive'));
    }

    expect(passiveEvents).toHaveLength(6);
    expect(passiveEvents.map(({ actorId }) => actorId)).toEqual(heroIds);
  });

  it('supports every specialization and all thirty authored trigger conditions', () => {
    const context = {
      battle: battle(),
      actorId: 'brann',
      targetId: 'enemy-a',
      element: 'fire' as const,
      hitIndex: 1,
      isBounce: true,
      isEcho: true,
      defeated: true,
      overkill: 4,
    };

    expect(GUILD_TRIGGER_CONDITIONS).toHaveLength(30);
    expect(
      GUILD_TRIGGER_CONDITIONS.every(
        (trigger) => typeof triggerMatches(trigger.id, context) === 'boolean',
      ),
    ).toBe(true);

    for (const specialization of GUILD_SKILL_SPECIALIZATIONS) {
      const selected = skill(component('fire', specialization.id, 'on_hit'));
      const result = resolveSkill({
        battle: battle(400),
        actorId: 'brann',
        skillId: selected.id,
        targetId: 'enemy-a',
        content: content([selected]),
      });
      expect(
        result.events.some((event) => event.specializationId === specialization.id),
        specialization.id,
      ).toBe(true);
    }
  });

  it('previews ready, deferred-impact, and unavailable triggers without disabling base skills', () => {
    const ready = skill(component('fire', 'stack', 'target_burning'));
    const pending = skill(component('fire', 'multistrike', 'on_repeat_hit'));
    const state = battle();
    state.units = state.units.map((entry) =>
      entry.id === 'enemy-a' ? { ...entry, statusLayers: { burn: 2, poison: 0, tide: 0 } } : entry,
    );

    expect(
      previewTriggerReadiness({
        battle: state,
        actorId: 'brann',
        targetId: 'enemy-a',
        skill: ready,
      })[0]?.readiness,
    ).toBe('ready');
    expect(
      previewTriggerReadiness({
        battle: state,
        actorId: 'brann',
        targetId: 'enemy-a',
        skill: pending,
      })[0]?.readiness,
    ).toBe('pending-impact');
    expect(
      previewTriggerReadiness({
        battle: battle(),
        actorId: 'brann',
        targetId: 'enemy-a',
        skill: ready,
      })[0]?.readiness,
    ).toBe('not-ready');
  });

  it('retargets remaining hits, preserves overkill, and echoes chains on a lone enemy', () => {
    const selected = skill(
      component('fire', 'chain', 'lone_target', { repeatCount: 4, power: 30 }),
    );
    const state = battle(20);
    state.units = [...state.units, unit('enemy-b', 'enemies', 20)];

    const result = resolveSkill({
      battle: state,
      actorId: 'brann',
      skillId: selected.id,
      targetId: 'enemy-a',
      content: content([selected]),
    });

    expect(
      result.events.some((event) => event.targetId === 'enemy-b' && event.kind === 'damage'),
    ).toBe(true);
    expect(result.events.some((event) => event.kind === 'overkill')).toBe(true);

    const lone = resolveSkill({
      battle: battle(400),
      actorId: 'brann',
      skillId: selected.id,
      targetId: 'enemy-a',
      content: content([selected]),
    });
    expect(lone.events.some((event) => event.kind === 'echo')).toBe(true);
  });

  it('uses additions and reductions instead of damage multipliers', () => {
    const target = {
      ...unit('armored', 'enemies'),
      huntTraits: [
        {
          id: 'armor',
          name: '裝甲',
          description: '由護衛保護，但會被彈射破開。',
          counterBuildIds: [],
          guardedByEnemyIds: ['guard'],
          guardedDamageMultiplier: 0.01,
          vulnerableTransform: 'ricochet' as const,
          vulnerabilityMultiplier: 99,
        },
      ],
    };
    const guard = unit('guard', 'enemies');

    expect(calculateHuntDamage(target, [target, guard], 100, ['ricochet'])).toBe(106);
  });

  it('collapses a repeated causal cycle into one finite Infinite Engine event', () => {
    const result = resolveSkillTriggerQueue(['hit'], {
      hit: ['echo'],
      echo: ['hit'],
    });

    expect(result.events.map(({ kind }) => kind)).toEqual([
      'triggered',
      'triggered',
      'infinite_engine',
    ]);
    expect(result.infiniteEngine).toBe(true);
  });
});
