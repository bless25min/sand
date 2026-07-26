import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from '../state/create-game-state';
import { guildRpgReducer, type GuildRpgState } from '../state/game-reducer';
import { BattleScreen } from './BattleScreen';
import { GuildMobileStage } from './GuildMobileStage';
import { GuildScreen } from './GuildScreen';
import { RewardScreen } from './RewardScreen';

const dispatch = () => undefined;
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

function reachRewards(): GuildRpgState {
  let state = guildRpgReducer(createGuildRpgState(), {
    type: 'START_QUEST',
    questId: 'border_pack',
  });
  for (const cardId of FULL_WIPE_COMMAND) {
    state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId });
  }
  state = guildRpgReducer(state, { type: 'RELEASE_COMBO' });
  state = guildRpgReducer(state, { type: 'ADVANCE_PLAYBACK', count: 1_000 });
  return guildRpgReducer(state, { type: 'COMPLETE_PLAYBACK' });
}

function returnWithInventory(): GuildRpgState {
  let state = reachRewards();
  state = guildRpgReducer(state, {
    type: 'CHOOSE_ITEM',
    itemId: state.rewards!.items[0]!.id,
    choice: 'keep',
    adventurerId: state.profile.leaderId,
  });
  return guildRpgReducer(state, { type: 'RETURN_GUILD' });
}

function reachFailedRewards(): GuildRpgState {
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
  return guildRpgReducer(state, { type: 'TICK', elapsedMs: 0 });
}

function reachExecutionWindow(): GuildRpgState {
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
  for (const cardId of ['lyra_quickshot', 'brann_sweep']) {
    state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId });
  }
  state = guildRpgReducer(state, { type: 'RELEASE_COMBO' });
  state = guildRpgReducer(state, { type: 'ADVANCE_PLAYBACK', count: 1_000 });
  return guildRpgReducer(state, { type: 'COMPLETE_PLAYBACK' });
}

describe('right-thumb mobile flow', () => {
  it('renders one complete, focused instruction for each fresh guild step', () => {
    const buildMarkup = renderToStaticMarkup(
      <GuildMobileStage state={createGuildRpgState()} dispatch={dispatch} />,
    );
    const questMarkup = renderToStaticMarkup(
      <GuildMobileStage state={createGuildRpgState()} dispatch={dispatch} initialPage="quest" />,
    );

    expect(buildMarkup).toContain('新手引導 1/2');
    expect(buildMarkup).toContain('前往第一個任務');
    expect(buildMarkup).toContain('反擊壁壘已就緒。現在只要切到任務分頁。');
    expect(buildMarkup).toContain('data-guide-id="tab:quest" data-guide-focus="true"');
    expect(buildMarkup.match(/data-guide-focus="true"/g) ?? []).toHaveLength(1);
    expect(questMarkup).toContain('新手引導 2/2');
    expect(questMarkup).toContain('出發邊境狼群');
    expect(questMarkup).toContain('data-guide-id="action:start-quest" data-guide-focus="true"');
    expect(questMarkup.match(/data-guide-focus="true"/g) ?? []).toHaveLength(1);
  });

  it('hides advanced mission intelligence only during fresh guidance', () => {
    const guided = renderToStaticMarkup(
      <GuildMobileStage state={createGuildRpgState()} dispatch={dispatch} initialPage="quest" />,
    );
    const fresh = createGuildRpgState();
    const skipped = renderToStaticMarkup(
      <GuildMobileStage
        state={{
          ...fresh,
          preferences: { ...fresh.preferences, tutorial: 'skipped' },
        }}
        dispatch={dispatch}
        initialPage="quest"
      />,
    );

    expect(guided).toContain('現在只要按下開始遠征');
    expect(guided).not.toContain('處刑順序');
    expect(guided).not.toContain('專屬掉落');
    expect(skipped).toContain('處刑順序');
    expect(skipped).toContain('專屬掉落');
  });

  it('reserves the mobile battle grid for header and battlefield at every height', () => {
    const battleCss = readFileSync(new URL('../mobile-battle.css', import.meta.url), 'utf8');
    const deckCss = readFileSync(new URL('../thumb-command-deck.css', import.meta.url), 'utf8');

    expect(battleCss).toContain('grid-template-areas:');
    expect(battleCss).toContain("'header'");
    expect(battleCss).toContain("'battlefield'");
    expect(battleCss).toContain('.gr-battle > .gr-coach');
    expect(battleCss).toContain('@media (max-width: 800px) and (max-height: 720px)');
    expect(deckCss).toContain('.gr-thumb-deck__guide');
    expect(deckCss).toContain("[data-guide-focus='true']");
    expect(deckCss).toContain('padding-bottom: calc(372px + env(safe-area-inset-bottom))');
  });

  it('keeps guild navigation and the quest action in the thumb command deck', () => {
    const fresh = createGuildRpgState();
    const markup = renderToStaticMarkup(
      <GuildScreen
        state={{
          ...fresh,
          preferences: { ...fresh.preferences, tutorial: 'skipped' },
        }}
        dispatch={dispatch}
      />,
    );

    expect(markup).toContain('data-thumb-command-deck="true"');
    expect(markup).toContain('aria-label="公會操作分頁"');
    expect(markup).toContain('>任務<');
    expect(markup).toContain('>隊伍<');
    expect(markup).toContain('>背包<');
    expect(markup).toContain('檔案館');
    expect(markup).toContain('data-thumb-slot="primary"');
    expect(markup).toContain('開始遠征');
  });

  it('pins all four guild tabs to predictable thumb slots', () => {
    const css = readFileSync(new URL('../thumb-command-deck.css', import.meta.url), 'utf8');

    expect(css).toContain('.gr-thumb-deck__tabs button:nth-child(4)');
    expect(css).toMatch(/nth-child\(4\)[^{]*\{[^}]*grid-area:\s*4\s*\/\s*3/s);
  });

  it('shows four switchable build graphs during guild preparation', () => {
    const markup = renderToStaticMarkup(
      <GuildScreen state={createGuildRpgState()} dispatch={dispatch} />,
    );

    expect(markup).toContain('反擊壁壘');
    expect(markup).toContain('殲滅彈射');
    expect(markup).toContain('溢療裁決');
    expect(markup).toContain('軍令風暴');
    expect(markup).toContain('切換 Build');
    expect(markup).toContain('目前規則');
  });

  it('renders four readable warfronts and mobile campaign intelligence', () => {
    const state = createGuildRpgState();
    const unguidedState = {
      ...state,
      preferences: { ...state.preferences, tutorial: 'skipped' as const },
    };
    const desktopMarkup = renderToStaticMarkup(<GuildScreen state={state} dispatch={dispatch} />);
    const mobileMarkup = renderToStaticMarkup(
      <GuildMobileStage state={unguidedState} dispatch={dispatch} initialPage="quest" />,
    );

    expect(desktopMarkup.match(/data-campaign-zone=/g)).toHaveLength(4);
    expect(desktopMarkup).toContain('灰牙邊境');
    expect(desktopMarkup).toContain('風暴王城');
    expect(desktopMarkup).toContain('戰役推進 · 0/12');
    expect(desktopMarkup).toContain('狼群護王：先斬雙衛，再開孤王處刑窗。');
    expect(mobileMarkup).toContain('ZONE 1/4');
    expect(mobileMarkup).toContain('戰役 0/12');
    expect(mobileMarkup).toContain('處刑順序');
    expect(mobileMarkup).toContain('殲滅寶箱');
  });

  it('turns campaign completion into an unmistakable replay state', () => {
    const fresh = createGuildRpgState();
    const state = createGuildRpgState({
      ...fresh.profile,
      unlockedQuestIds: GUILD_GAME_CONTENT.quests.map((quest) => quest.id),
      questRecords: Object.fromEntries(
        GUILD_GAME_CONTENT.quests.map((quest) => [quest.id, { clears: 1 }]),
      ),
    });
    const markup = renderToStaticMarkup(<GuildScreen state={state} dispatch={dispatch} />);

    expect(markup.match(/data-campaign-zone="[^"]+" data-zone-status="cleared"/g)).toHaveLength(4);
    expect(markup).toContain('CAMPAIGN CONQUERED');
    expect(markup).toContain('全戰役完破 · 12 場無限重刷');
    expect(markup).toContain('完破重刷');
  });

  it('returns mobile players directly to the newly opened hunt', () => {
    const fresh = createGuildRpgState();
    const state = createGuildRpgState({
      ...fresh.profile,
      unlockedQuestIds: ['border_pack', 'moonroad_pursuit'],
      questRecords: { border_pack: { clears: 1 } },
    });
    const markup = renderToStaticMarkup(
      <GuildMobileStage state={state} dispatch={dispatch} initialPage="quest" />,
    );

    expect(markup).toContain('月路追獵');
    expect(markup).toContain('ZONE 1/4');
    expect(markup).toContain('戰役 1/12');
  });

  it('makes Build selection a first-class mobile thumb page', () => {
    const fresh = createGuildRpgState();
    const markup = renderToStaticMarkup(
      <GuildMobileStage
        state={{
          ...fresh,
          preferences: { ...fresh.preferences, tutorial: 'skipped' },
        }}
        dispatch={dispatch}
        initialPage="build"
      />,
    );

    expect(markup).toContain('>Build<');
    expect(markup).toContain('目前 Build');
    expect(markup).toContain('data-thumb-slot="primary"');
    expect(markup).toContain('盾牆蓄爆');
    expect(markup).toContain('牌組編成');
  });

  it('starts a fresh first hunt on Build before showing the quest action', () => {
    const markup = renderToStaticMarkup(
      <GuildMobileStage state={createGuildRpgState()} dispatch={dispatch} />,
    );

    expect(markup).toContain('data-mobile-page="build"');
    expect(markup).toContain('前往第一個任務');
  });

  it('offers party and inventory decisions without leaving the guild thumb zone', () => {
    const fresh = createGuildRpgState();
    const partyMarkup = renderToStaticMarkup(
      <GuildMobileStage
        state={{
          ...fresh,
          preferences: { ...fresh.preferences, tutorial: 'skipped' },
        }}
        dispatch={dispatch}
        initialPage="party"
      />,
    );
    const inventoryState = returnWithInventory();
    const inventoryMarkup = renderToStaticMarkup(
      <GuildMobileStage
        state={{
          ...inventoryState,
          preferences: { ...inventoryState.preferences, tutorial: 'skipped' },
        }}
        dispatch={dispatch}
        initialPage="inventory"
      />,
    );

    expect(partyMarkup).toContain('設為隊長');
    expect(partyMarkup).toContain('下一位');
    expect(inventoryMarkup).toContain(inventoryState.profile.inventory[0]!.name);
    expect(inventoryMarkup).toContain('裝備給');
    expect(inventoryMarkup).toContain('下一頁');
    expect(inventoryMarkup).toContain('開啟鍛造');
  });

  it('keeps the mobile forge reachable when the backpack page has no visible items', () => {
    const markup = renderToStaticMarkup(
      <GuildMobileStage
        state={createGuildRpgState()}
        dispatch={dispatch}
        initialPage="inventory"
      />,
    );

    expect(markup).toContain('完成遠征並保留裝備後');
    expect(markup).toContain('開啟鍛造');
  });

  it('keeps card, command, target, undo, and release controls in the battle thumb deck', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    state = guildRpgReducer(state, { type: 'SELECT_TARGET', targetId: 'wolf_scout' });
    state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId: 'brann_brace' });
    const guidedMarkup = renderToStaticMarkup(<BattleScreen state={state} dispatch={dispatch} />);
    const markup = renderToStaticMarkup(
      <BattleScreen
        state={{
          ...state,
          preferences: { ...state.preferences, tutorial: 'skipped' },
        }}
        dispatch={dispatch}
      />,
    );

    expect(markup).toContain('data-thumb-command-deck="true"');
    expect(markup).toContain('aria-label="戰鬥操作分頁"');
    expect(markup).toContain('>卡牌<');
    expect(markup).toContain('>軍令<');
    expect(markup).toContain('>目標<');
    expect(markup).toContain('>系統<');
    expect(guidedMarkup).toContain('GUIDED HUNT');
    expect(guidedMarkup).toContain('下一張選 盾後反擊');
    expect(guidedMarkup).toContain('軍令引導 3/6');
    expect(guidedMarkup).toContain('data-guide-id="action:brann_riposte" data-guide-focus="true"');
    expect(guidedMarkup.match(/data-guide-focus="true"/g) ?? []).toHaveLength(1);
    expect(markup).toContain('開啟設定');
    expect(markup).toContain('撤銷上一步');
    expect(markup).toContain('提早釋放');
    expect(markup).not.toContain('行動 0%');
    expect(markup).toContain('壓力 0%');
    expect(markup).toContain('data-thumb-slot="primary"');
  });

  it('keeps the guided target correction visible from the default battle page', () => {
    const started = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    const state = {
      ...started,
      battle: {
        ...started.battle!,
        selectedTargetId: 'wolf_alpha',
      },
    };

    const markup = renderToStaticMarkup(<BattleScreen state={state} dispatch={dispatch} />);

    expect(markup).toContain('data-guide-id="tab:target" data-guide-focus="true"');
    expect(markup.match(/data-guide-focus="true"/g) ?? []).toHaveLength(1);
  });

  it('turns the guided primary action into recovery, preview confirmation, then release', () => {
    let wrong = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    wrong = guildRpgReducer(wrong, { type: 'SELECT_TARGET', targetId: 'wolf_scout' });
    wrong = guildRpgReducer(wrong, { type: 'APPEND_COMBO_CARD', cardId: 'lyra_quickshot' });
    expect(renderToStaticMarkup(<BattleScreen state={wrong} dispatch={dispatch} />)).toContain(
      '撤銷錯誤卡',
    );

    let preview = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    preview = guildRpgReducer(preview, { type: 'SELECT_TARGET', targetId: 'wolf_scout' });
    for (const cardId of ['brann_brace', 'brann_riposte', 'brann_sweep']) {
      preview = guildRpgReducer(preview, { type: 'APPEND_COMBO_CARD', cardId });
    }
    expect(renderToStaticMarkup(<BattleScreen state={preview} dispatch={dispatch} />)).toContain(
      '確認預演',
    );

    preview = guildRpgReducer(preview, { type: 'ACK_TUTORIAL_PREVIEW' });
    expect(renderToStaticMarkup(<BattleScreen state={preview} dispatch={dispatch} />)).toContain(
      '釋放軍令',
    );
  });

  it('keeps every loot decision and return state in the reward thumb deck', () => {
    const state = reachRewards();
    expect(state.screen).toBe('rewards');

    const markup = renderToStaticMarkup(<RewardScreen state={state} dispatch={dispatch} />);
    const resolvedMarkup = renderToStaticMarkup(
      <RewardScreen
        state={{ ...state, resolvedItemIds: state.rewards!.items.map((item) => item.id) }}
        dispatch={dispatch}
      />,
    );

    expect(markup).toContain('aria-label="戰利品操作"');
    expect(markup).toContain('data-loot-rain="true"');
    expect(markup).toContain('CHAIN WIPE');
    expect(markup).toContain('ANNIHILATION');
    expect(markup).toContain('敵人材料');
    expect(markup).toContain('使用推薦裝備者');
    expect(markup).toContain('立即裝備');
    expect(markup).toContain('放入背包');
    expect(markup).toContain('出售');
    expect(resolvedMarkup).toContain('返回公會');
  });

  it('makes the opened wolf execution window unmistakable on the battlefield', () => {
    const markup = renderToStaticMarkup(
      <BattleScreen state={reachExecutionWindow()} dispatch={dispatch} />,
    );

    expect(markup).toContain('data-execution-window="true"');
    expect(markup).toContain('孤王處刑窗');
    expect(markup).toContain('處刑目標');
  });

  it('keeps the next boss-execution card in the visible thumb slots', () => {
    let state = reachExecutionWindow();
    state = guildRpgReducer(state, { type: 'SELECT_TARGET', targetId: 'wolf_alpha' });
    state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId: 'brann_brace' });

    const markup = renderToStaticMarkup(<BattleScreen state={state} dispatch={dispatch} />);
    expect(markup).toContain('處決鏈 2/5：選 盾後反擊');
    expect(markup).toContain('>盾後反擊<');
  });

  it('renders a material-only failed hunt with an immediate safe return', () => {
    const state = reachFailedRewards();
    const markup = renderToStaticMarkup(<RewardScreen state={state} dispatch={dispatch} />);

    expect(markup).toContain('撤退結算');
    expect(markup).toContain('敵人材料');
    expect(markup).toContain('返回公會');
    expect(markup).not.toContain('立即裝備');
    expect(markup).not.toContain('新委託已解鎖');
  });
});
