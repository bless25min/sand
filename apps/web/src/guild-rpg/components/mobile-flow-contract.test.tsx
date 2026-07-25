import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from '../state/create-game-state';
import { guildRpgReducer, type GuildRpgState } from '../state/game-reducer';
import { BattleScreen } from './BattleScreen';
import { GuildMobileStage } from './GuildMobileStage';
import { GuildScreen } from './GuildScreen';
import { RewardScreen } from './RewardScreen';

const dispatch = () => undefined;

function reachRewards(): GuildRpgState {
  let state = guildRpgReducer(createGuildRpgState(), {
    type: 'START_QUEST',
    questId: 'border_pack',
  });
  for (let index = 0; index < 2_000 && state.screen === 'battle'; index += 1) {
    state = guildRpgReducer(state, { type: 'TICK', elapsedMs: 100 });
    if (state.battle?.pendingLeaderId) {
      state = guildRpgReducer(state, {
        type: 'USE_SKILL',
        skillId: 'focused_shot',
        targetId: state.battle.selectedTargetId!,
      });
    }
  }
  return state;
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

  it('keeps target, skill, and tactics controls in the battle thumb deck', () => {
    const state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    const markup = renderToStaticMarkup(<BattleScreen state={state} dispatch={dispatch} />);

    expect(markup).toContain('data-thumb-command-deck="true"');
    expect(markup).toContain('aria-label="戰鬥操作分頁"');
    expect(markup).toContain('>技能<');
    expect(markup).toContain('>目標<');
    expect(markup).toContain('>戰術<');
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
    expect(markup).toContain('立即裝備');
    expect(markup).toContain('放入背包');
    expect(markup).toContain('出售');
    expect(resolvedMarkup).toContain('返回公會');
  });
});
