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
  'brann_sweep',
  'lyra_mark',
  'lyra_piercing_shot',
  'lyra_ricochet',
  'elin_prayer',
  'elin_overflow_bolt',
  'elin_radiant_burst',
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

describe('right-thumb mobile flow', () => {
  it('keeps guild navigation and the quest action in the thumb command deck', () => {
    const markup = renderToStaticMarkup(
      <GuildScreen state={createGuildRpgState()} dispatch={dispatch} />,
    );

    expect(markup).toContain('data-thumb-command-deck="true"');
    expect(markup).toContain('aria-label="公會操作分頁"');
    expect(markup).toContain('>任務<');
    expect(markup).toContain('>隊伍<');
    expect(markup).toContain('>背包<');
    expect(markup).toContain('data-thumb-slot="primary"');
    expect(markup).toContain('開始遠征');
  });

  it('shows three switchable build graphs during guild preparation', () => {
    const markup = renderToStaticMarkup(
      <GuildScreen state={createGuildRpgState()} dispatch={dispatch} />,
    );

    expect(markup).toContain('反擊壁壘');
    expect(markup).toContain('殲滅彈射');
    expect(markup).toContain('溢療裁決');
    expect(markup).toContain('切換 Build');
    expect(markup).toContain('目前規則');
  });

  it('makes Build selection a first-class mobile thumb page', () => {
    const markup = renderToStaticMarkup(
      <GuildMobileStage state={createGuildRpgState()} dispatch={dispatch} initialPage="build" />,
    );

    expect(markup).toContain('>Build<');
    expect(markup).toContain('目前 Build');
    expect(markup).toContain('data-thumb-slot="primary"');
    expect(markup).toContain('盾牆蓄爆');
  });

  it('starts a fresh first hunt on Build before showing the quest action', () => {
    const markup = renderToStaticMarkup(
      <GuildMobileStage state={createGuildRpgState()} dispatch={dispatch} />,
    );

    expect(markup).toContain('data-mobile-page="build"');
    expect(markup).toContain('先確認反擊壁壘');
  });

  it('offers party and inventory decisions without leaving the guild thumb zone', () => {
    const partyMarkup = renderToStaticMarkup(
      <GuildMobileStage state={createGuildRpgState()} dispatch={dispatch} initialPage="party" />,
    );
    const inventoryState = returnWithInventory();
    const inventoryMarkup = renderToStaticMarkup(
      <GuildMobileStage state={inventoryState} dispatch={dispatch} initialPage="inventory" />,
    );

    expect(partyMarkup).toContain('設為隊長');
    expect(partyMarkup).toContain('下一位');
    expect(inventoryMarkup).toContain(inventoryState.profile.inventory[0]!.name);
    expect(inventoryMarkup).toContain('裝備給');
    expect(inventoryMarkup).toContain('下一頁');
  });

  it('keeps card, command, target, undo, and release controls in the battle thumb deck', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId: 'brann_brace' });
    const markup = renderToStaticMarkup(<BattleScreen state={state} dispatch={dispatch} />);

    expect(markup).toContain('data-thumb-command-deck="true"');
    expect(markup).toContain('aria-label="戰鬥操作分頁"');
    expect(markup).toContain('>卡牌<');
    expect(markup).toContain('>軍令<');
    expect(markup).toContain('>目標<');
    expect(markup).toContain('>系統<');
    expect(markup).toContain('GUIDED HUNT');
    expect(markup).toContain('下一張選 盾後反擊');
    expect(markup).toContain('開啟設定');
    expect(markup).toContain('撤銷上一步');
    expect(markup).toContain('提早釋放');
    expect(markup).not.toContain('行動 0%');
    expect(markup).toContain('壓力 0%');
    expect(markup).toContain('data-thumb-slot="primary"');
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
