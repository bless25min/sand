import { describe, expect, it } from 'vitest';
import { GUILD_GAME_CONTENT } from '@expedition/game-data';

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
  it('starts a fresh player in the hunt instead of forcing a pre-battle menu tour', () => {
    let state = createGuildRpgState();

    expect(state.tutorialStep).toBe('start_hunt');
    expect(state.page).toBe('quest');

    state = reduce(state, { type: 'START_QUEST', questId: 'border_pack' });
    expect(state.tutorialStep).toBe('select_target');
  });

  it('persists the battle coach through six casts and cannot be skipped by reordering', () => {
    let state = reduce(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    const firstTarget = state.battle!.selectedTargetId!;
    state = reduce(state, { type: 'SELECT_TARGET', targetId: firstTarget });
    expect(state.tutorialStep).toBe('relay_1');

    state = reduce(state, { type: 'CHOOSE_NEXT_HERO', adventurerId: 'lyra' });
    expect(state.tutorialStep).toBe('relay_1');

    for (let relay = 1; relay <= 6; relay += 1) {
      const actorId = state.battle!.roundOrder!.activeAdventurerId;
      const actor = state.profile.party.find(({ definitionId }) => definitionId === actorId)!;
      state = reduce(state, {
        type: 'USE_SKILL',
        skillId: actor.skillIds[0]!,
        targetId: state.battle!.selectedTargetId!,
      });
      expect(state.tutorialStep).toBe(relay === 6 ? 'collect_reward' : `relay_${relay + 1}`);
    }
  });

  it('returns an abandoned tutorial battle to the visible first-hunt action', () => {
    let state = reduce(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    state = reduce(state, {
      type: 'SELECT_TARGET',
      targetId: state.battle!.selectedTargetId!,
    });
    expect(state.tutorialStep).toBe('relay_1');

    state = reduce(state, { type: 'ABANDON_HUNT' });

    expect(state).toMatchObject({
      screen: 'guild',
      page: 'quest',
      tutorialStep: 'start_hunt',
    });
  });

  it('does not let the reward shortcut skip required equipment training', () => {
    const state = winFirstHunt(createGuildRpgState());
    expect(state).toMatchObject({ screen: 'rewards', tutorialStep: 'equip_loot' });

    const blocked = reduce(state, { type: 'GO_TO_FUSION' });

    expect(blocked).toMatchObject({
      screen: 'rewards',
      tutorialStep: 'equip_loot',
      message: '先穿上一件新裝備，完成後就會開放技能融合。',
    });
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
    expect(state.rewards?.items).toHaveLength(5);
  });

  it('has no dead end from one skill drop through equip and replay', () => {
    let state = winFirstHunt(createGuildRpgState());
    expect(state.screen).toBe('rewards');
    expect(state.rewards?.items).toHaveLength(5);
    expect(state.rewards?.skillDrops).toHaveLength(1);
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
    expect(state).toMatchObject({ page: 'equipment', tutorialStep: 'inspect_skills' });
    state = reduce(state, { type: 'NAVIGATE', page: 'skills' });
    expect(state.tutorialStep).toBe('equip_skill');
    expect(state.skillWorkspace).toBe('loadout');
    const rewardSkill = state.profile.skillInventory.find(({ id }) => id === rewardSkillIds[0])!;
    state = reduce(state, { type: 'SELECT_SKILL_SLOT', slotIndex: 0 });
    state = reduce(state, { type: 'EQUIP_SKILL', skillId: rewardSkill.id });
    expect(state.profile.party[0]!.skillIds[0]).toBe(rewardSkill.id);
    expect(state.tutorialStep).toBe('replay');

    state = reduce(state, { type: 'NAVIGATE', page: 'quest' });
    state = reduce(state, { type: 'START_QUEST', questId: 'border_pack' });
    expect(state.screen).toBe('battle');
    expect(state.preferences.tutorial).toBe('complete');
    expect(state.tutorialStep).toBe('complete');
  });

  it('equips a reward from the loot drawer without leaving the reward summary', () => {
    const won = winFirstHunt(createGuildRpgState());
    const item = won.rewards!.items[0]!;

    const equipped = reduce(won, {
      type: 'EQUIP_REWARD_ITEM',
      itemId: item.id,
      adventurerId: 'brann',
    });

    expect(equipped.screen).toBe('rewards');
    expect(
      equipped.profile.party.find(({ definitionId }) => definitionId === 'brann')?.equipment[
        item.slot
      ]?.id,
    ).toBe(item.id);
    expect(equipped.tutorialStep).toBe('forge_loot');
  });

  it('starts the same hunt again from rewards after the first-session tutorial', () => {
    const skipped = reduce(createGuildRpgState(), {
      type: 'SET_TUTORIAL',
      tutorial: 'skipped',
    });
    const won = winFirstHunt(skipped);

    const replayed = reduce(won, { type: 'REPLAY_HUNT' });

    expect(replayed).toMatchObject({
      screen: 'battle',
      rewards: undefined,
      battle: { questId: 'border_pack', status: 'active' },
    });
  });

  it('starts a completed-campaign hunt with the selected ascension', () => {
    const initial = reduce(createGuildRpgState(), {
      type: 'SET_TUTORIAL',
      tutorial: 'skipped',
    });
    const completedCampaign = {
      ...initial,
      profile: {
        ...initial.profile,
        unlockedQuestIds: GUILD_GAME_CONTENT.quests.map(({ id }) => id),
        questRecords: Object.fromEntries(
          GUILD_GAME_CONTENT.quests.map(({ id }) => [id, { clears: 1 }]),
        ),
      },
    };

    const started = reduce(completedCampaign, {
      type: 'START_QUEST',
      questId: 'border_pack',
      ascensionId: 'annihilation_weather',
    });

    expect(started).toMatchObject({
      screen: 'battle',
      battle: {
        questId: 'border_pack',
        ascension: {
          id: 'annihilation_weather',
          name: '殲滅天候',
        },
      },
    });
  });

  it('keeps newly completed challenges and record highlights visible at rewards', () => {
    const skipped = reduce(createGuildRpgState(), {
      type: 'SET_TUTORIAL',
      tutorial: 'skipped',
    });
    const won = winFirstHunt(skipped);

    expect(won.screen).toBe('rewards');
    expect(won.newChallengeIds?.length).toBeGreaterThan(0);
    expect(won.recordHighlights).toEqual(
      expect.arrayContaining([expect.stringMatching(/OVERKILL|連鎖|裝備品質/)]),
    );
  });
});
