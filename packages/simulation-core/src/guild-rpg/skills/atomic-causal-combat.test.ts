import {
  GUILD_ELEMENTS,
  GUILD_SKILL_FORMS,
  GUILD_SKILL_SPECIALIZATIONS,
  GUILD_TRIGGER_CONDITIONS,
} from '@expedition/game-data';
import type {
  BattleUnit,
  FusedSkill,
  GuildBattleState,
  GuildSkillItem,
  OwnedSkill,
  SkillComponent,
} from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { completeTurn } from '../round-order/complete-turn';
import { createRoundOrder } from '../round-order/create-round-order';
import { resolveSkill } from './resolve-skill';

const heroIds = ['brann', 'lyra', 'elin', 'seph', 'lorne', 'kyro'] as const;
const unit = (
  id: string,
  side: BattleUnit['side'],
  input: Partial<BattleUnit> = {},
): BattleUnit => ({
  id,
  name: id,
  side,
  stats: { hp: 50, attack: 1, defense: 1, speed: 1, healing: 1 },
  currentHp: 50,
  gauge: 0,
  threat: 0,
  guarding: false,
  isLeader: id === 'brann',
  skillIds: [],
  statusLayers: { burn: 0, poison: 0, tide: 0 },
  defenseReduction: 0,
  strengthened: 0,
  ...input,
});

const battle = (enemy: Partial<BattleUnit> = {}): GuildBattleState => ({
  questId: 'atomic',
  seed: 'fixed',
  elapsedMs: 0,
  sequence: 1,
  status: 'active',
  units: [...heroIds.map((id) => unit(id, 'heroes')), unit('enemy', 'enemies', enemy)],
  selectedTargetId: 'enemy',
  leaderAuto: false,
  events: [],
  roundOrder: createRoundOrder(heroIds),
  skillHistory: [],
  roundIndex: 1,
});

const component = (id: string, input: Partial<SkillComponent> = {}): SkillComponent => ({
  id,
  qualityRank: 1,
  formId: 'fire.stack.battle_open',
  element: 'fire',
  specializationId: 'stack',
  triggerId: 'battle_open',
  power: 1,
  layerStrength: 1,
  triggerAddition: 1,
  repeatCount: 1,
  ...input,
});

const owned = (id: string, part: SkillComponent): OwnedSkill => ({
  id,
  name: id,
  stars: 1,
  components: [part],
});

const fused = (first: SkillComponent, second: SkillComponent): FusedSkill => ({
  id: 'fused',
  name: '融合測試',
  stars: 2,
  components: [first, second],
  sourceSkills: [owned('source-a', first), owned('source-b', second)],
});

const content = (skills: readonly GuildSkillItem[]) => ({
  skills: Object.fromEntries(skills.map((skill) => [skill.id, skill])),
  elements: GUILD_ELEMENTS,
  specializations: GUILD_SKILL_SPECIALIZATIONS,
  triggers: GUILD_TRIGGER_CONDITIONS,
  forms: GUILD_SKILL_FORMS,
});

const cast = (state: GuildBattleState, skill: GuildSkillItem) =>
  resolveSkill({
    battle: state,
    actorId: state.roundOrder!.activeAdventurerId!,
    skillId: skill.id,
    targetId: 'enemy',
    content: content([skill]),
  });

describe('atomic causal skill resolution', () => {
  it('keeps an isolated common opening small and traces every damage event', () => {
    const skill = owned('opening', component('opening-component'));
    const result = cast(battle(), skill);
    const damage = result.events.filter(({ kind }) => kind === 'damage');

    expect(damage.reduce((sum, event) => sum + (event.amount ?? 0), 0)).toBeLessThanOrEqual(4);
    expect(damage.length).toBeGreaterThan(0);
    expect(
      damage.every(({ causalId, actorId, componentId }) => causalId && actorId && componentId),
    ).toBe(true);
    expect(result.events.every(({ roundIndex }) => roundIndex === 1)).toBe(true);
  });

  it('does not let the opening component create the status required by a fused component', () => {
    const first = component('fire-setup');
    const second = component('grass-payoff', {
      formId: 'grass.blast.target_burning',
      element: 'grass',
      specializationId: 'blast',
      triggerId: 'target_burning',
    });
    const result = cast(battle(), fused(first, second));

    expect(result.events.some(({ componentId }) => componentId === first.id)).toBe(true);
    expect(result.events.some(({ componentId }) => componentId === second.id)).toBe(false);
    expect(result.battle.units.find(({ id }) => id === 'enemy')?.statusLayers?.burn).toBe(1);
  });

  it('applies weaken after its own hit and consumes strengthen on that one hit', () => {
    const state = battle({
      stats: { hp: 50, attack: 1, defense: 5, speed: 1, healing: 0 },
    });
    state.units = state.units.map((entry) =>
      entry.id === 'brann' ? { ...entry, strengthened: 2 } : entry,
    );
    const skill = owned(
      'weaken',
      component('weaken-component', {
        qualityRank: 5,
        specializationId: 'weaken',
        power: 5,
        layerStrength: 2,
        triggerAddition: 1,
      }),
    );
    const result = cast(state, skill);
    const firstDamage = result.events.find(({ kind }) => kind === 'damage');

    expect(firstDamage?.amount).toBe(3);
    expect(result.battle.units.find(({ id }) => id === 'enemy')?.defenseReduction).toBe(2);
    expect(result.battle.units.find(({ id }) => id === 'brann')?.strengthened).toBe(0);
  });

  it('does not create automatic relay or finisher damage after another hero acted', () => {
    const state = battle();
    state.roundOrder = completeTurn(state.roundOrder!, 'brann');
    state.skillHistory = [{ actorId: 'brann', skillId: 'prior', element: 'water', roundIndex: 1 }];
    const skill = owned('relay', component('relay-component'));
    const result = cast(state, skill);

    expect(
      result.events.filter(({ kind }) => kind === 'damage').every(({ componentId }) => componentId),
    ).toBe(true);
    expect(result.events.some(({ kind }) => kind === 'finisher')).toBe(false);
    expect(result.events.some(({ message }) => message.includes('餘震'))).toBe(false);
  });

  it('keeps a maximum one-actor chain below the isolated build ceiling', () => {
    const skill = owned(
      'max-chain',
      component('max-chain-component', {
        qualityRank: 5,
        specializationId: 'chain',
        triggerId: 'on_hit',
        power: 5,
        layerStrength: 5,
        triggerAddition: 5,
        repeatCount: 6,
      }),
    );
    const result = cast(
      battle({ currentHp: 500, stats: { hp: 500, attack: 1, defense: 1, speed: 1, healing: 0 } }),
      skill,
    );
    const total = result.events
      .filter(({ kind }) => kind === 'damage' || kind === 'reaction')
      .reduce((sum, event) => sum + (event.amount ?? 0), 0);

    expect(total).toBeLessThanOrEqual(30);
  });

  it('raises spectacle depth only when a later actor reads a real prior condition', () => {
    const opening = owned('opening-fire', component('opening-fire-component'));
    const follow = owned(
      'follow-grass',
      component('follow-grass-component', {
        formId: 'grass.chain.previous_fire',
        element: 'grass',
        specializationId: 'chain',
        triggerId: 'previous_fire',
        repeatCount: 2,
      }),
    );
    const disconnected = owned(
      'disconnected-fire',
      component('disconnected-fire-component', {
        triggerId: 'battle_open',
      }),
    );
    const first = resolveSkill({
      battle: battle(),
      actorId: 'brann',
      skillId: opening.id,
      targetId: 'enemy',
      content: content([opening, follow, disconnected]),
    });
    const linked = resolveSkill({
      battle: first.battle,
      actorId: 'lyra',
      skillId: follow.id,
      targetId: 'enemy',
      content: content([opening, follow, disconnected]),
    });

    expect(first.events.every(({ causalDepth }) => causalDepth === 1)).toBe(true);
    expect(
      linked.events
        .filter(({ kind }) => kind !== 'enemy_attack' && kind !== 'guard' && kind !== 'dodge')
        .every(({ causalDepth }) => causalDepth === 2),
    ).toBe(true);

    const resetState = battle();
    resetState.roundOrder = completeTurn(resetState.roundOrder!, 'brann');
    const unlinked = resolveSkill({
      battle: resetState,
      actorId: 'lyra',
      skillId: disconnected.id,
      targetId: 'enemy',
      content: content([disconnected]),
    });
    expect(unlinked.events.every(({ causalDepth }) => causalDepth === 1)).toBe(true);
  });
});
