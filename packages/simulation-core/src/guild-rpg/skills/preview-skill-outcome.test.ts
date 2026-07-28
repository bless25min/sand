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
import { previewSkillOutcome } from './preview-skill-outcome';
import { resolveSkill } from './resolve-skill';

const heroIds = ['brann', 'lyra', 'elin', 'seph', 'lorne', 'kyro'];

const unit = (id: string, side: BattleUnit['side'], hp: number): BattleUnit => ({
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

const battle = (): GuildBattleState => ({
  questId: 'preview-test',
  seed: 'fixed',
  elapsedMs: 0,
  sequence: 1,
  status: 'active',
  units: [
    ...heroIds.map((id) => unit(id, 'heroes', 160)),
    unit('enemy-a', 'enemies', 500),
    unit('enemy-b', 'enemies', 300),
  ],
  selectedTargetId: 'enemy-a',
  leaderAuto: false,
  events: [],
  roundOrder: createRoundOrder(heroIds),
  skillHistory: [],
  roundIndex: 1,
});

const component: SkillComponent = {
  id: 'fire-chain-on-hit',
  formId: 'fire.chain.on-hit',
  element: 'fire',
  specializationId: 'chain',
  triggerId: 'on_hit',
  power: 8,
  layerStrength: 3,
  triggerAddition: 4,
  repeatCount: 3,
};

const skill: OwnedSkill = {
  id: 'preview-skill',
  name: '烈焰連鎖',
  stars: 1,
  components: [component],
};

const content = (skills: GuildSkillItem[]) => ({
  skills: Object.fromEntries(skills.map((entry) => [entry.id, entry])),
  elements: GUILD_ELEMENTS,
  specializations: GUILD_SKILL_SPECIALIZATIONS,
  triggers: GUILD_TRIGGER_CONDITIONS,
  forms: GUILD_SKILL_FORMS,
});

describe('previewSkillOutcome', () => {
  it('uses the exact resolver events without mutating the battle', () => {
    const state = battle();
    const before = structuredClone(state);
    const input = {
      battle: state,
      actorId: 'brann',
      skillId: skill.id,
      targetId: 'enemy-a',
      content: content([skill]),
    };

    const preview = previewSkillOutcome(input);
    const resolved = resolveSkill(input);

    expect(preview.events).toEqual(resolved.events);
    expect(state).toEqual(before);
    expect(preview.totalDamage).toBe(
      resolved.events
        .filter(({ kind }) => kind === 'damage' || kind === 'reaction')
        .reduce((sum, { amount = 0 }) => sum + amount, 0),
    );
    expect(preview.overkill).toBe(
      resolved.events
        .filter(({ kind }) => kind === 'overkill')
        .reduce((sum, { amount = 0 }) => sum + amount, 0),
    );
  });

  it('summarizes each affected unit and its status changes', () => {
    const state = battle();
    const preview = previewSkillOutcome({
      battle: state,
      actorId: 'brann',
      skillId: skill.id,
      targetId: 'enemy-a',
      content: content([skill]),
    });
    const enemyA = preview.units.find(({ id }) => id === 'enemy-a');
    const enemyB = preview.units.find(({ id }) => id === 'enemy-b');

    expect(enemyA).toMatchObject({
      beforeHp: 500,
      damage: 56,
      beforeStatus: { burn: 0, poison: 0, tide: 0 },
      afterStatus: { burn: 3, poison: 0, tide: 0 },
    });
    expect(enemyB).toMatchObject({
      beforeHp: 300,
      damage: 28,
      beforeStatus: { burn: 0, poison: 0, tide: 0 },
      afterStatus: { burn: 0, poison: 0, tide: 0 },
    });
    expect(enemyA?.afterHp).toBe(444);
    expect(enemyB?.afterHp).toBe(272);
  });
});
