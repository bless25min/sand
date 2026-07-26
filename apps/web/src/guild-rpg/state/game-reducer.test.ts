import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { HuntRewards } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from './create-game-state';
import { guildRpgReducer } from './game-reducer';

const FULL_WIPE_COMMAND = [
  'brann_brace',
  'brann_riposte',
  'brann_shield_crash',
  'brann_sweep',
  'brann_fortress_breaker',
  'lyra_quickshot',
  'elin_prayer',
  'elin_aegis',
] as const;

describe('guild RPG reducer', () => {
  it('pauses the guided hunt clock, preserves player commands, and abandons safely', () => {
    const profileBefore = createGuildRpgState().profile;
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    const battleBefore = state.battle;

    expect(state.paused).toBe(true);
    expect(state.preferences.tutorial).toBe('active');
    state = guildRpgReducer(state, { type: 'TICK', elapsedMs: 13_000 });
    expect(state.battle).toBe(battleBefore);

    state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId: 'brann_brace' });
    expect(state.battle?.combo?.draft.cardIds).toEqual(['brann_brace']);
    state = guildRpgReducer(state, { type: 'SET_TUTORIAL', tutorial: 'skipped' });
    expect(state.paused).toBe(true);
    expect(state.preferences.tutorial).toBe('skipped');

    state = guildRpgReducer(state, { type: 'SET_PAUSED', paused: true });
    state = guildRpgReducer(state, { type: 'ABANDON_HUNT' });
    expect(state).toMatchObject({ screen: 'guild', paused: false });
    expect(state.battle).toBeUndefined();
    expect(state.profile).toEqual(profileBefore);
  });

  it('opens settings by pausing combat and updates only feature-local preferences', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    state = guildRpgReducer(state, { type: 'SET_TUTORIAL', tutorial: 'skipped' });

    state = guildRpgReducer(state, { type: 'SET_SETTINGS_OPEN', open: true });
    expect(state).toMatchObject({ paused: true, settingsOpen: true });
    state = guildRpgReducer(state, {
      type: 'UPDATE_PREFERENCES',
      preferences: {
        masterVolume: 0.2,
        musicEnabled: false,
        hapticsEnabled: false,
        motion: 'reduced',
      },
    });
    expect(state.preferences).toMatchObject({
      version: 1,
      tutorial: 'skipped',
      masterVolume: 0.2,
      musicEnabled: false,
      hapticsEnabled: false,
      motion: 'reduced',
    });
    expect(state.profile.version).toBe(3);
  });

  it('restores the exact pre-settings pause state when settings close', () => {
    let running = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    running = guildRpgReducer(running, { type: 'SET_TUTORIAL', tutorial: 'skipped' });
    running = guildRpgReducer(running, { type: 'SET_PAUSED', paused: false });
    running = guildRpgReducer(running, { type: 'SET_SETTINGS_OPEN', open: true });
    running = guildRpgReducer(running, { type: 'SET_SETTINGS_OPEN', open: false });
    expect(running).toMatchObject({ settingsOpen: false, paused: false });

    let manuallyPaused = guildRpgReducer(running, { type: 'SET_PAUSED', paused: true });
    manuallyPaused = guildRpgReducer(manuallyPaused, { type: 'SET_SETTINGS_OPEN', open: true });
    manuallyPaused = guildRpgReducer(manuallyPaused, { type: 'SET_SETTINGS_OPEN', open: false });
    expect(manuallyPaused).toMatchObject({ settingsOpen: false, paused: true });
  });

  it('auto-pauses every command decision and advances pressure only after explicit resume', () => {
    const initial = createGuildRpgState();
    let state = guildRpgReducer(
      { ...initial, preferences: { ...initial.preferences, tutorial: 'skipped' } },
      { type: 'START_QUEST', questId: 'border_pack' },
    );
    const untouched = state.battle;

    expect(state.paused).toBe(true);
    state = guildRpgReducer(state, { type: 'TICK', elapsedMs: 2_000 });
    expect(state.battle).toBe(untouched);

    state = guildRpgReducer(state, { type: 'SET_PAUSED', paused: false });
    state = guildRpgReducer(state, { type: 'TICK', elapsedMs: 400 });
    expect(state.battle?.elapsedMs).toBeGreaterThan(0);
    state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId: 'lyra_quickshot' });

    expect(state.paused).toBe(true);
  });

  it('keeps a tutorial replay paused when it is enabled from battle settings', () => {
    const initial = createGuildRpgState();
    let state = guildRpgReducer(
      {
        ...initial,
        profile: {
          ...initial.profile,
          questRecords: {
            ...initial.profile.questRecords,
            border_pack: { clears: 1, bestClearMs: 12_000 },
          },
        },
        preferences: { ...initial.preferences, tutorial: 'skipped' },
      },
      { type: 'START_QUEST', questId: 'border_pack' },
    );
    state = guildRpgReducer(state, { type: 'SET_SETTINGS_OPEN', open: true });
    state = guildRpgReducer(state, { type: 'SET_TUTORIAL', tutorial: 'active' });
    state = guildRpgReducer(state, { type: 'SET_SETTINGS_OPEN', open: false });

    expect(state).toMatchObject({
      screen: 'battle',
      paused: true,
      tutorialReplay: true,
      preferences: { tutorial: 'active' },
    });
  });

  it('keeps replay guidance active until a successful replay returns to the guild', () => {
    const recorded = {
      ...createGuildRpgState(),
      profile: {
        ...createGuildRpgState().profile,
        unlockedQuestIds: ['border_pack', 'abandoned_mine'],
        questRecords: {
          ...createGuildRpgState().profile.questRecords,
          border_pack: { clears: 1, bestClearMs: 12_000 },
        },
      },
    };
    let state = guildRpgReducer(recorded, { type: 'SET_TUTORIAL', tutorial: 'active' });
    state = guildRpgReducer(state, { type: 'START_QUEST', questId: 'border_pack' });
    expect(state).toMatchObject({
      screen: 'battle',
      paused: true,
      tutorialReplay: true,
      preferences: { tutorial: 'active' },
    });

    state = {
      ...state,
      screen: 'rewards',
      rewards: {
        questId: 'border_pack',
        clearMs: 12_000,
        successful: true,
        gold: 0,
        experience: 0,
        items: [],
        materials: [],
      },
    };
    state = guildRpgReducer(state, { type: 'RETURN_GUILD' });
    expect(state).toMatchObject({
      screen: 'guild',
      tutorialReplay: false,
      preferences: { tutorial: 'complete' },
    });
  });

  it('completes fresh guidance after the successful first hunt returns to the guild', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    state = {
      ...state,
      screen: 'rewards',
      rewards: {
        questId: 'border_pack',
        clearMs: 12_000,
        successful: true,
        gold: 0,
        experience: 0,
        items: [],
        materials: [],
      },
    };

    state = guildRpgReducer(state, { type: 'RETURN_GUILD' });

    expect(state).toMatchObject({
      screen: 'guild',
      tutorialReplay: false,
      preferences: { tutorial: 'complete' },
    });
  });

  it('does not attach border guidance to a different hunt during tutorial replay', () => {
    const recorded = {
      ...createGuildRpgState(),
      profile: {
        ...createGuildRpgState().profile,
        unlockedQuestIds: ['border_pack', 'abandoned_mine'],
        questRecords: {
          ...createGuildRpgState().profile.questRecords,
          border_pack: { clears: 1, bestClearMs: 12_000 },
        },
      },
    };
    let state = guildRpgReducer(recorded, { type: 'SET_TUTORIAL', tutorial: 'active' });
    state = guildRpgReducer(state, { type: 'START_QUEST', questId: 'abandoned_mine' });
    expect(state).toMatchObject({
      screen: 'battle',
      paused: true,
      preferences: { tutorial: 'active' },
    });
  });

  it('switches the active build only during guild preparation', () => {
    const initial = createGuildRpgState();
    const selected = guildRpgReducer(initial, {
      type: 'SET_BUILD',
      buildId: 'ricochet',
    });
    const invalid = guildRpgReducer(selected, {
      type: 'SET_BUILD',
      buildId: 'missing',
    });

    expect(selected.profile.selectedBuildId).toBe('ricochet');
    expect(invalid).toBe(selected);
    expect(
      guildRpgReducer(guildRpgReducer(selected, { type: 'START_QUEST', questId: 'border_pack' }), {
        type: 'SET_BUILD',
        buildId: 'retaliation',
      }).profile.selectedBuildId,
    ).toBe('ricochet');
  });

  it('mutates loadouts and forged equipped items only through guild intents', () => {
    const initial = createGuildRpgState();
    const build = GUILD_GAME_CONTENT.builds[0]!;
    const removedCardId = build.defaultCardIds[7]!;
    const addedCardId = build.cardIds.find((cardId) => !build.defaultCardIds.includes(cardId))!;
    const swapped = guildRpgReducer(initial, {
      type: 'SWAP_LOADOUT_CARD',
      buildId: build.id,
      removedCardId,
      addedCardId,
    });
    expect(swapped.profile.loadouts[build.id]).toContain(addedCardId);

    const forgeItem = {
      id: 'reducer-forge',
      baseId: 'scout_charm',
      name: '斥候追風符',
      slot: 'accessory' as const,
      rarity: 'rare' as const,
      mainStat: { stat: 'speed' as const, value: 5 },
      affixes: [],
      sellValue: 40,
      sourceEnemyId: 'wolf_scout',
    };
    const forgeReady = {
      ...swapped,
      profile: {
        ...swapped.profile,
        gold: 100,
        materials: { scout_fang: 1 },
        party: swapped.profile.party.map((member, index) =>
          index === 0 ? { ...member, equipment: { accessory: forgeItem } } : member,
        ),
      },
    };
    const forged = guildRpgReducer(forgeReady, {
      type: 'FORGE_ITEM',
      itemId: forgeItem.id,
      forgeAction: 'upgrade',
    });
    expect(forged.profile.gold).toBe(70);
    expect(forged.profile.party[0]?.equipment.accessory?.forgeRank).toBe(1);
    expect(forged.message).toContain('鍛造完成');
  });

  it('launches an authored Ascended replay after all twelve hunts are cleared', () => {
    const initial = createGuildRpgState();
    const complete = {
      ...initial,
      profile: {
        ...initial.profile,
        unlockedQuestIds: GUILD_GAME_CONTENT.quests.map((quest) => quest.id),
        questRecords: Object.fromEntries(
          GUILD_GAME_CONTENT.quests.map((quest) => [quest.id, { clears: 1 }]),
        ),
      },
    };
    const started = guildRpgReducer(complete, {
      type: 'START_QUEST',
      questId: 'border_pack',
      ascensionId: 'crimson_pressure',
    });

    expect(started.battle?.ascension).toMatchObject({
      id: 'crimson_pressure',
      routeLabel: '一令全滅路線',
      cueId: 'break',
    });
    expect(started.message).toContain('赤紅壓境');
  });

  it('plays a complete command before applying rewards and replay records', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });

    expect(state.screen).toBe('battle');
    expect(state.battle?.combo?.phase).toBe('composing');
    expect(state.battle?.combo?.availableCardIds).toHaveLength(8);

    for (const cardId of FULL_WIPE_COMMAND) {
      state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId });
    }
    expect(state.battle?.combo?.draft.cardIds).toEqual(FULL_WIPE_COMMAND);

    state = guildRpgReducer(state, { type: 'RELEASE_COMBO' });
    expect(state.screen).toBe('playback');
    expect(state.playback).toMatchObject({
      visibleEventCount: 0,
    });
    expect(state.rewards).toBeUndefined();
    expect(state.profile.questRecords.border_pack).toBeUndefined();

    state = guildRpgReducer(state, { type: 'ADVANCE_PLAYBACK', count: 1 });
    expect(state.screen).toBe('playback');
    expect(state.playback?.visibleEventCount).toBe(1);

    state = guildRpgReducer(state, { type: 'ADVANCE_PLAYBACK', count: 1_000 });
    expect(state.screen).toBe('playback');
    expect(state.playback?.visibleEventCount).toBeGreaterThan(1);

    state = guildRpgReducer(state, { type: 'COMPLETE_PLAYBACK' });
    expect(state.screen).toBe('rewards');
    expect(state.rewards?.items.length).toBeGreaterThan(2);
    expect(state.rewards).toMatchObject({
      successful: true,
      axes: {
        chainWipe: true,
        annihilation: true,
        perfectAnnihilation: true,
      },
    });
    const huntRewards = state.rewards as HuntRewards;
    expect(huntRewards.items).toHaveLength(4);
    expect(huntRewards.axes.sharedOverflow).toBeGreaterThan(0);
    expect(
      huntRewards.items.every((item) => item.qualityScore >= huntRewards.axes.sharedOverflow),
    ).toBe(true);
    expect(state.profile.questRecords.border_pack?.clears).toBe(1);
    expect(state.profile.questRecords.border_pack?.bestChain).toBe(8);
    expect(state.profile.completedChallengeIds).toEqual(
      expect.arrayContaining([
        'border-pack-hunt-one-command',
        'border-pack-hunt-overkill',
        'border-pack-hunt-build-route',
      ]),
    );
    expect(state.message).toContain('新完成');

    const [equipped, ...sold] = state.rewards!.items;
    for (const [index, item] of [equipped!, ...sold].entries()) {
      state = guildRpgReducer(state, {
        type: 'CHOOSE_ITEM',
        itemId: item.id,
        choice: index === 0 ? 'equip' : 'sell',
        adventurerId: 'lyra',
      });
    }

    expect(state.resolvedItemIds).toHaveLength(state.rewards!.items.length);
    expect(
      state.profile.party.find((member) => member.definitionId === 'lyra')?.equipment.accessory?.id,
    ).toBe(equipped?.id);

    state = guildRpgReducer(state, { type: 'RETURN_GUILD' });
    expect(state.screen).toBe('guild');
    expect(state.profile.unlockedQuestIds).toContain('moonroad_pursuit');
    expect(state.message).toContain('規則上線');
    expect(state.message).toContain('帶著新引擎重刷');

    const replay = guildRpgReducer(state, { type: 'START_QUEST', questId: 'border_pack' });
    expect(replay.screen).toBe('battle');
    expect(replay.battle?.seed).not.toBe('border_pack-1');
    expect(replay.battle?.combo?.draft.cardIds).toEqual([]);
  });

  it('returns an unfinished command to the same battle after playback', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId: 'brann_brace' });
    state = guildRpgReducer(state, { type: 'RELEASE_COMBO' });

    expect(state.screen).toBe('playback');
    expect(state.battle?.status).toBe('active');
    const resolvedBattle = state.battle;

    state = guildRpgReducer(state, { type: 'ADVANCE_PLAYBACK', count: 1_000 });
    state = guildRpgReducer(state, { type: 'COMPLETE_PLAYBACK' });

    expect(state.screen).toBe('battle');
    expect(state.battle).toBe(resolvedBattle);
    expect(state.battle?.combo?.phase).toBe('composing');
    expect(state.battle?.combo?.draft.cardIds).toEqual([]);
    expect(state.rewards).toBeUndefined();
  });

  it('lands playback skip on the complete climax before rewards', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    for (const cardId of FULL_WIPE_COMMAND) {
      state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId });
    }
    state = guildRpgReducer(state, { type: 'RELEASE_COMBO' });
    const eventCount = state.battle!.combo!.events.length - state.playback!.eventStartIndex;

    state = guildRpgReducer(state, { type: 'SKIP_PLAYBACK' });

    expect(state.screen).toBe('playback');
    expect(state.playback?.visibleEventCount).toBe(eventCount);
    expect(state.message).toContain('完整高潮');
  });

  it('freezes playback projection while settings are open', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId: 'brann_brace' });
    state = guildRpgReducer(state, { type: 'RELEASE_COMBO' });
    state = guildRpgReducer(state, { type: 'SET_SETTINGS_OPEN', open: true });
    const paused = state;

    state = guildRpgReducer(state, { type: 'ADVANCE_PLAYBACK', count: 5 });
    expect(state).toBe(paused);
    state = guildRpgReducer(state, { type: 'SKIP_PLAYBACK' });
    expect(state).toBe(paused);
    state = guildRpgReducer(state, { type: 'COMPLETE_PLAYBACK' });
    expect(state).toBe(paused);
  });

  it('pauses again at the next guided decision after an unfinished command playback', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    for (const cardId of ['brann_brace', 'brann_riposte', 'brann_sweep']) {
      state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId });
    }
    state = guildRpgReducer(state, { type: 'ACK_TUTORIAL_PREVIEW' });
    expect(state.tutorialPreviewAcknowledged).toBe(true);
    state = guildRpgReducer(state, { type: 'RELEASE_COMBO' });
    expect(state.tutorialPreviewAcknowledged).toBe(false);
    state = guildRpgReducer(state, { type: 'ADVANCE_PLAYBACK', count: 1_000 });
    state = guildRpgReducer(state, { type: 'COMPLETE_PLAYBACK' });

    expect(state).toMatchObject({
      screen: 'battle',
      paused: true,
      preferences: { tutorial: 'active' },
    });
  });

  it('reaches annihilation through the guided guard-break and boss-execution waves', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    for (const cardId of ['brann_brace', 'brann_riposte', 'brann_sweep']) {
      state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId });
    }
    state = guildRpgReducer(state, { type: 'RELEASE_COMBO' });
    state = guildRpgReducer(state, { type: 'ADVANCE_PLAYBACK', count: 1_000 });
    state = guildRpgReducer(state, { type: 'COMPLETE_PLAYBACK' });
    expect(state.battle?.combo?.activatedBossPhaseIds).toContain('alpha-execution');
    expect(state.battle?.selectedTargetId).toBe('wolf_alpha');

    for (const cardId of [
      'brann_brace',
      'brann_riposte',
      'brann_shield_crash',
      'brann_sweep',
      'brann_fortress_breaker',
    ]) {
      state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId });
    }
    state = guildRpgReducer(state, { type: 'ACK_TUTORIAL_PREVIEW' });
    expect(state.tutorialPreviewAcknowledged).toBe(true);
    state = guildRpgReducer(state, { type: 'RELEASE_COMBO' });
    state = guildRpgReducer(state, { type: 'ADVANCE_PLAYBACK', count: 1_000 });
    state = guildRpgReducer(state, { type: 'COMPLETE_PLAYBACK' });

    expect(state).toMatchObject({
      screen: 'rewards',
      rewards: { successful: true, axes: { annihilation: true } },
    });
  });

  it('opens and retargets the wolf execution phase exactly once after both guards fall', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    state = {
      ...state,
      battle: {
        ...state.battle!,
        selectedTargetId: 'wolf_scout',
        units: state.battle!.units.map((unit) =>
          ['wolf_scout', 'wolf_hunter'].includes(unit.id) ? { ...unit, currentHp: 1 } : unit,
        ),
      },
    };
    state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId: 'lyra_quickshot' });
    state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId: 'brann_sweep' });
    state = guildRpgReducer(state, { type: 'RELEASE_COMBO' });

    expect(state.battle?.selectedTargetId).toBe('wolf_alpha');
    expect(state.battle?.combo?.activatedBossPhaseIds).toEqual(['alpha-execution']);
    expect(state.battle?.combo?.events.filter((event) => event.kind === 'boss_phase')).toHaveLength(
      1,
    );
  });

  it('preserves the draft while enemies pressure composition and supports undo', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    state = guildRpgReducer(state, { type: 'SET_TUTORIAL', tutorial: 'skipped' });
    const secondEnemy = state.battle!.units.filter((unit) => unit.side === 'enemies')[1]!;
    const heroHp = state.battle!.units.find((unit) => unit.side === 'heroes')!.currentHp;

    state = guildRpgReducer(state, { type: 'SELECT_TARGET', targetId: secondEnemy.id });
    state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId: 'brann_brace' });
    state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId: 'brann_riposte' });
    state = guildRpgReducer(state, { type: 'UNDO_COMBO_CARD' });
    state = guildRpgReducer(state, { type: 'SET_SPEED', speed: 2 });
    state = guildRpgReducer(state, { type: 'SET_PAUSED', paused: false });
    state = guildRpgReducer(state, { type: 'TICK', elapsedMs: 13_000 });

    expect(state.battle?.selectedTargetId).toBe(secondEnemy.id);
    expect(state.battle?.combo?.draft.cardIds).toEqual(['brann_brace']);
    expect(state.battle?.units.find((unit) => unit.side === 'heroes')!.currentHp).toBeLessThan(
      heroHp,
    );
    expect(state.battle?.combo?.events.at(-1)?.kind).toBe('enemy_pressure');
    expect(state.speed).toBe(2);

    state = { ...state, battle: { ...state.battle!, status: 'defeat' } };
    state = guildRpgReducer(state, { type: 'RETURN_GUILD' });
    expect(state.screen).toBe('guild');
  });

  it('moves a failed hunt to material-only rewards', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    state = {
      ...state,
      battle: {
        ...state.battle!,
        status: 'defeat',
        units: state.battle!.units.map((unit) =>
          unit.side === 'heroes' ? { ...unit, currentHp: 0 } : unit,
        ),
      },
    };
    state = guildRpgReducer(state, { type: 'TICK', elapsedMs: 0 });

    expect(state.screen).toBe('rewards');
    expect(state.rewards?.items).toEqual([]);
    expect(state.rewards?.materials?.length).toBeGreaterThan(0);
  });
});
