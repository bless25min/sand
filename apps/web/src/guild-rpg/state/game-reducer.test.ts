import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from './create-game-state';
import { guildRpgReducer, type GuildRpgAction, type GuildRpgState } from './game-reducer';

const reduce = (state: GuildRpgState, action: GuildRpgAction) => guildRpgReducer(state, action);

const winFirstHunt = (initial: GuildRpgState) => {
  let state = reduce(initial, { type: 'START_QUEST', questId: 'border_pack' });
  let turns = 0;
  while (state.screen === 'battle' && turns < 60) {
    if (state.battle?.status === 'victory') {
      state = reduce(state, { type: 'COLLECT_VICTORY' });
      break;
    }
    const target = state.battle?.units.find(
      ({ side, currentHp }) => side === 'enemies' && currentHp > 0,
    );
    const targetId = target?.id ?? state.battle?.selectedTargetId;
    const actorId = state.battle?.roundOrder?.activeAdventurerId;
    const actor = state.profile.party.find(({ definitionId }) => definitionId === actorId);
    if (!targetId || !actor) break;
    if (target) state = reduce(state, { type: 'SELECT_TARGET', targetId });
    state = reduce(state, {
      type: 'USE_SKILL',
      skillId: actor.skillIds[turns % actor.skillIds.length]!,
      targetId,
    });
    turns += 1;
  }
  return state;
};

describe('deterministic six-hero game flow', () => {
  it('advances onboarding only through the real page, hero, skill, and equipment actions', () => {
    let state = createGuildRpgState();

    state = reduce(state, { type: 'NAVIGATE', page: 'party' });
    expect(state.tutorialStep).toBe('select_hero');

    state = reduce(state, { type: 'SELECT_HERO', adventurerId: 'brann' });
    expect(state.tutorialStep).toBe('inspect_skills');
    expect(state.selectedHeroId).toBe('brann');

    state = reduce(state, { type: 'NAVIGATE', page: 'skills' });
    expect(state.tutorialStep).toBe('equip_skill');
    const replacement = state.profile.party[1]!.skillIds[0]!;
    state = reduce(state, { type: 'SELECT_SKILL_SLOT', slotIndex: 2 });
    state = reduce(state, { type: 'EQUIP_SKILL', skillId: replacement });
    expect(state.profile.party[0]!.skillIds[2]).toBe(replacement);
    expect(state.selectedHeroId).toBe('lyra');
    expect(state.tutorialStep).toBe('inspect_equipment');

    state = reduce(state, { type: 'NAVIGATE', page: 'equipment' });
    expect(state.tutorialStep).toBe('start_hunt');
  });

  it('keeps the saved default order while a battle reorder changes only the current round', () => {
    let state = createGuildRpgState();
    state = reduce(state, { type: 'MOVE_DEFAULT_HERO', adventurerId: 'seph', direction: -1 });
    const savedOrder = state.profile.defaultOrder;
    expect(savedOrder.indexOf('seph')).toBe(2);

    state = reduce(state, { type: 'START_QUEST', questId: 'border_pack' });
    state = reduce(state, { type: 'CHOOSE_NEXT_HERO', adventurerId: 'kyro' });
    expect(state.battle?.roundOrder?.activeAdventurerId).toBe('kyro');
    expect(state.battle?.roundOrder?.currentOrder[0]).toBe('kyro');
    expect(state.profile.defaultOrder).toEqual(savedOrder);
  });

  it('resolves each chosen skill immediately and escalates the next relay', () => {
    let state = reduce(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    const targetId = state.battle!.selectedTargetId!;
    const firstSkill = state.profile.party[0]!.skillIds[0]!;
    state = reduce(state, { type: 'USE_SKILL', skillId: firstSkill, targetId });

    expect(state.recentEvents[0]).toMatchObject({ kind: 'skill_cast', actorId: 'brann' });
    expect(state.battle?.roundOrder?.activeAdventurerId).toBe('lyra');

    const secondTarget = state.battle!.selectedTargetId!;
    const secondSkill = state.profile.party[1]!.skillIds[0]!;
    state = reduce(state, { type: 'USE_SKILL', skillId: secondSkill, targetId: secondTarget });
    expect(state.recentEvents.some(({ kind, amount }) => kind === 'relay' && amount === 2)).toBe(
      true,
    );
    expect(state.battle?.roundOrder?.activeAdventurerId).toBe('elin');
  });

  it('holds the sixth relay finisher on the battlefield until loot is collected', () => {
    let state = reduce(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    state = {
      ...state,
      battle: {
        ...state.battle!,
        units: state.battle!.units.map((unit) =>
          unit.side === 'enemies' ? { ...unit, currentHp: 1 } : unit,
        ),
      },
    };

    for (let turn = 0; turn < 6; turn += 1) {
      const actorId = state.battle!.roundOrder!.activeAdventurerId;
      const actor = state.profile.party.find(({ definitionId }) => definitionId === actorId)!;
      state = reduce(state, {
        type: 'USE_SKILL',
        skillId: actor.skillIds[0]!,
        targetId: state.battle!.selectedTargetId!,
      });
    }

    expect(state.screen).toBe('battle');
    expect(state.battle?.status).toBe('victory');
    expect(state.recentEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'finisher' }),
        expect.objectContaining({ kind: 'victory' }),
      ]),
    );
    state = reduce(state, { type: 'COLLECT_VICTORY' });
    expect(state.screen).toBe('rewards');
    expect(state.rewards?.items).toHaveLength(4);
  });

  it('has no dead end from first victory through six loot, fusion, equip, and replay', () => {
    let state = winFirstHunt(createGuildRpgState());
    expect(state.screen).toBe('rewards');
    expect(state.rewards?.items).toHaveLength(4);
    expect(state.rewards?.skillDrops).toHaveLength(2);
    const rewardSkillIds = state.rewards!.skillDrops.map(({ id }) => id);
    expect(
      rewardSkillIds.every((id) => state.profile.skillInventory.some((skill) => skill.id === id)),
    ).toBe(true);

    const equipmentId = state.rewards!.items[0]!.id;
    state = reduce(state, { type: 'GO_TO_EQUIPMENT' });
    expect(state).toMatchObject({ screen: 'guild', page: 'equipment', tutorialStep: 'equip_loot' });
    state = reduce(state, {
      type: 'EQUIP_STORED',
      itemId: equipmentId,
      adventurerId: 'brann',
    });
    expect(state.tutorialStep).toBe('forge_loot');
    state = reduce(state, {
      type: 'FORGE_ITEM',
      itemId: equipmentId,
      forgeAction: 'calibrate',
    });
    expect(state).toMatchObject({ page: 'skills', tutorialStep: 'fuse_skill' });
    for (const skillId of rewardSkillIds) {
      state = reduce(state, { type: 'TOGGLE_FUSION_SKILL', skillId });
    }
    state = reduce(state, { type: 'FUSE_SELECTED' });
    expect(state.lastFusedSkillId).toBeTruthy();
    expect(state.tutorialStep).toBe('equip_fused');

    const fusedId = state.lastFusedSkillId!;
    const beforeOrder = state.profile.skillInventory
      .find(({ id }) => id === fusedId)!
      .components.map(({ id }) => id);
    state = reduce(state, {
      type: 'MOVE_FUSED_COMPONENT',
      fusedSkillId: fusedId,
      componentIndex: 0,
      direction: 1,
    });
    expect(
      state.profile.skillInventory.find(({ id }) => id === fusedId)!.components.map(({ id }) => id),
    ).toEqual([...beforeOrder].reverse());
    state = reduce(state, { type: 'SELECT_SKILL_SLOT', slotIndex: 0 });
    state = reduce(state, { type: 'EQUIP_SKILL', skillId: fusedId });
    expect(state.profile.party[0]!.skillIds[0]).toBe(fusedId);
    expect(state.tutorialStep).toBe('replay');

    state = reduce(state, { type: 'NAVIGATE', page: 'quest' });
    state = reduce(state, { type: 'START_QUEST', questId: 'border_pack' });
    expect(state.screen).toBe('battle');
    expect(state.preferences.tutorial).toBe('complete');
    expect(state.tutorialStep).toBe('complete');
  });
});
