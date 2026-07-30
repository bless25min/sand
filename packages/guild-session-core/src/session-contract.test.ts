import { describe, expect, it } from 'vitest';
import { fuseSkills } from '@expedition/simulation-core';

import {
  GUILD_RPG_ACTION_TYPES,
  GUILD_PREFERENCES_KEY,
  GUILD_SAVE_KEY,
  GUILD_SESSION_KEY,
  createGuildSession,
  createGuildSessionController,
  loadGuildSession,
  reduceGuildSession,
  storeGuildSession,
  type GuildSavePort,
} from './index';

const EXPECTED_ACTIONS = [
  'NAVIGATE',
  'SELECT_SKILL_WORKSPACE',
  'SELECT_HERO',
  'SELECT_SKILL_SLOT',
  'EQUIP_SKILL',
  'MOVE_DEFAULT_HERO',
  'TOGGLE_FUSION_SKILL',
  'FUSE_SELECTED',
  'REPLACE_FUSED_COMPONENT',
  'MOVE_FUSED_COMPONENT',
  'DISMANTLE_SKILL',
  'START_QUEST',
  'SELECT_TARGET',
  'CHOOSE_NEXT_HERO',
  'RESET_CURRENT_ORDER',
  'SET_CARRY_ORDER',
  'USE_SKILL',
  'COLLECT_VICTORY',
  'EQUIP_REWARD_ITEM',
  'REPLAY_HUNT',
  'EQUIP_STORED',
  'FORGE_ITEM',
  'TOGGLE_ITEM_FLAG',
  'TOGGLE_SALVAGE_SELECTION',
  'SALVAGE_SELECTED',
  'GO_TO_EQUIPMENT',
  'GO_TO_FUSION',
  'RETURN_GUILD',
  'ABANDON_HUNT',
  'SET_MASTER_VOLUME',
  'SET_AUDIO_ENABLED',
  'SET_HAPTICS_ENABLED',
  'SET_MOTION',
  'SET_TUTORIAL',
] as const;

const memoryPort = (initial: Readonly<Record<string, string>> = {}): GuildSavePort => {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
};

describe('Guild session contract', () => {
  it('owns every player command from the reference Guild RPG', () => {
    expect(GUILD_RPG_ACTION_TYPES).toEqual(EXPECTED_ACTIONS);
  });

  it('reduces guild navigation without a React or Cocos dependency', () => {
    const session = createGuildSession();
    const next = reduceGuildSession(session, { type: 'NAVIGATE', page: 'party' });

    expect(next.page).toBe('party');
    expect(next.screen).toBe('guild');
    expect(next.profile).toBe(session.profile);
  });

  it('persists and reloads the same profile and preferences through a storage port', () => {
    const port = memoryPort();
    const session = reduceGuildSession(createGuildSession(), {
      type: 'SET_MASTER_VOLUME',
      volume: 0.35,
    });

    storeGuildSession(port, session);
    const restored = loadGuildSession(port);

    expect(restored.profile).toEqual(session.profile);
    expect(restored.preferences.masterVolume).toBe(0.35);
    expect(restored.screen).toBe('guild');
  });

  it('resumes tutorial and workspace context after reloading', () => {
    const port = memoryPort();
    const base = createGuildSession();
    const session = {
      ...base,
      page: 'skills' as const,
      skillWorkspace: 'fusion' as const,
      tutorialStep: 'equip_skill' as const,
      tutorialSkillId: base.profile.skillInventory[0]!.id,
      lastFusedSkillId: base.profile.skillInventory[1]!.id,
      selectedHeroId: base.profile.defaultOrder[3]!,
      selectedSkillSlot: 4,
    };

    storeGuildSession(port, session);
    const restored = loadGuildSession(port);

    expect(restored.page).toBe('skills');
    expect(restored.skillWorkspace).toBe('fusion');
    expect(restored.tutorialStep).toBe('equip_skill');
    expect(restored.tutorialSkillId).toBe(session.tutorialSkillId);
    expect(restored.lastFusedSkillId).toBe(session.lastFusedSkillId);
    expect(restored.selectedHeroId).toBe(session.selectedHeroId);
    expect(restored.selectedSkillSlot).toBe(4);
  });

  it('ignores a corrupt session snapshot while preserving the valid profile', () => {
    const port = memoryPort();
    const session = createGuildSession();
    storeGuildSession(port, session);
    port.setItem(GUILD_SESSION_KEY, '{"version":1,"tutorialStep":"not-a-step"}');

    const restored = loadGuildSession(port);

    expect(restored.profile).toEqual(session.profile);
    expect(restored.tutorialStep).toBe('start_hunt');
    expect(restored.selectedHeroId).toBe(session.profile.defaultOrder[0]);
  });

  it('does not dismantle a fused skill that is still equipped', () => {
    const session = createGuildSession();
    const first = session.profile.skillInventory[0]!;
    const second = session.profile.skillInventory.find(
      (skill) =>
        skill.id !== first.id &&
        skill.stars === 1 &&
        skill.components[0].element === first.components[0].element,
    )!;
    if (first.stars !== 1 || second.stars !== 1) throw new Error('Expected starter skills');
    const fused = fuseSkills([first, second], 'fused:equipped-test', '測試融合技');
    const firstMember = session.profile.party[0]!;
    const equippedSession = {
      ...session,
      profile: {
        ...session.profile,
        skillInventory: [...session.profile.skillInventory, fused],
        party: [
          { ...firstMember, skillIds: [fused.id, ...firstMember.skillIds.slice(1)] },
          ...session.profile.party.slice(1),
        ],
      },
    };

    const next = reduceGuildSession(equippedSession, {
      type: 'DISMANTLE_SKILL',
      skillId: fused.id,
    });

    expect(next.profile).toBe(equippedSession.profile);
    expect(next.profile.skillInventory.some(({ id }) => id === fused.id)).toBe(true);
    expect(next.message).toContain('先從角色技能格換下');
  });

  it('preserves a reordered six-member party through a controller reload', () => {
    const port = memoryPort();
    const controller = createGuildSessionController(port);
    const original = controller.getState().profile.defaultOrder;

    controller.dispatch({
      type: 'MOVE_DEFAULT_HERO',
      adventurerId: original[1]!,
      direction: -1,
    });
    const reordered = controller.getState().profile.defaultOrder;
    const restored = createGuildSessionController(port).getState();

    expect(reordered[0]).toBe(original[1]);
    expect(restored.profile.defaultOrder).toEqual(reordered);
  });

  it('reloads the complete first-hunt progression profile without replacing it', () => {
    const port = memoryPort();
    const controller = createGuildSessionController(port);
    const questId = controller.getState().profile.unlockedQuestIds[0]!;
    controller.dispatch({ type: 'START_QUEST', questId });

    for (let action = 0; action < 60; action += 1) {
      const state = controller.getState();
      if (state.battle?.status === 'victory') break;
      const actorId = state.battle?.roundOrder?.activeAdventurerId;
      const actor = state.battle?.units.find(({ id }) => id === actorId);
      const targetId = state.battle?.selectedTargetId;
      if (!actorId || !actor || !targetId) throw new Error('Battle lost its active command');
      controller.dispatch({ type: 'SELECT_TARGET', targetId });
      controller.dispatch({ type: 'USE_SKILL', skillId: actor.skillIds[0]!, targetId });
    }

    expect(controller.getState().battle?.status).toBe('victory');
    controller.dispatch({ type: 'COLLECT_VICTORY' });
    const rewardState = controller.getState();
    const rewardItem = rewardState.rewards?.items[0];
    if (!rewardItem) throw new Error('Victory did not produce an equipment reward');
    controller.dispatch({
      type: 'EQUIP_REWARD_ITEM',
      itemId: rewardItem.id,
      adventurerId: rewardState.selectedHeroId,
    });
    controller.dispatch({ type: 'GO_TO_EQUIPMENT' });
    controller.dispatch({
      type: 'FORGE_ITEM',
      itemId: rewardItem.id,
      forgeAction: 'calibrate',
    });
    controller.dispatch({ type: 'NAVIGATE', page: 'skills' });
    const tutorialSkillId = controller.getState().tutorialSkillId!;
    controller.dispatch({ type: 'EQUIP_SKILL', skillId: tutorialSkillId });
    const original = controller.getState().profile.defaultOrder;
    controller.dispatch({
      type: 'MOVE_DEFAULT_HERO',
      adventurerId: original[1]!,
      direction: -1,
    });
    const reordered = controller.getState().profile.defaultOrder;
    controller.dispatch({ type: 'NAVIGATE', page: 'quest' });
    controller.dispatch({ type: 'START_QUEST', questId });

    const restored = createGuildSessionController(port).getState();

    expect(reordered[0]).toBe(original[1]);
    expect(restored.profile.defaultOrder).toEqual(reordered);
    expect(restored.profile.progressionEvents.length).toBeGreaterThan(0);
    expect(restored.profile.party.some(({ equipment }) => Object.keys(equipment).length > 0)).toBe(
      true,
    );
  });

  it('recovers from corrupt storage with a valid six-member profile', () => {
    const restored = loadGuildSession(
      memoryPort({
        [GUILD_SAVE_KEY]: '{not-json',
        [GUILD_PREFERENCES_KEY]: '[]',
      }),
    );

    expect(restored.profile.version).toBe(5);
    expect(restored.profile.party).toHaveLength(6);
  });
});
