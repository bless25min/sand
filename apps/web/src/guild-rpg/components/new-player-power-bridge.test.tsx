import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from '../state/create-game-state';
import { guildRpgReducer, type GuildRpgState } from '../state/game-reducer';
import { BattleScreen } from './BattleScreen';
import { ForgeWorkbench } from './ForgeWorkbench';
import { GuildMobileStage } from './GuildMobileStage';
import { LoadoutEditor } from './LoadoutEditor';

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

function reachPowerBridge(): GuildRpgState {
  let state = guildRpgReducer(createGuildRpgState(), {
    type: 'START_QUEST',
    questId: 'border_pack',
  });
  state = guildRpgReducer(state, { type: 'SELECT_TARGET', targetId: 'wolf_scout' });
  for (const cardId of FULL_WIPE_COMMAND) {
    state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId });
  }
  state = guildRpgReducer(state, { type: 'RELEASE_COMBO' });
  state = guildRpgReducer(state, { type: 'ADVANCE_PLAYBACK', count: 1_000 });
  state = guildRpgReducer(state, { type: 'COMPLETE_PLAYBACK' });
  for (const item of state.rewards!.items) {
    state = guildRpgReducer(state, {
      type: 'CHOOSE_ITEM',
      itemId: item.id,
      choice: 'equip',
      adventurerId: state.profile.leaderId,
    });
  }
  return guildRpgReducer(state, { type: 'RETURN_GUILD' });
}

describe('new player power bridge', () => {
  it('requires an explicit target click before the opening card', () => {
    const started = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    const beforeTarget = renderToStaticMarkup(<BattleScreen state={started} dispatch={dispatch} />);
    const acknowledged = guildRpgReducer(started, {
      type: 'SELECT_TARGET',
      targetId: 'wolf_scout',
    });
    const afterTarget = renderToStaticMarkup(
      <BattleScreen state={acknowledged} dispatch={dispatch} />,
    );

    expect(beforeTarget).toContain('打開目標選單');
    expect(beforeTarget).toContain('data-guide-id="tab:target" data-guide-focus="true"');
    expect(beforeTarget).not.toContain('data-selected="true" data-unit-id="wolf_scout"');
    expect(afterTarget).toContain('打出架盾');
    expect(afterTarget).toContain('data-guide-id="action:brann_brace" data-guide-focus="true"');
    expect(afterTarget).toContain('data-selected="true" data-unit-id="wolf_scout"');
  });

  it('turns preview into a readable cause and payoff summary', () => {
    let state = guildRpgReducer(createGuildRpgState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
    });
    state = guildRpgReducer(state, { type: 'SELECT_TARGET', targetId: 'wolf_scout' });
    for (const cardId of ['brann_brace', 'brann_riposte', 'brann_sweep']) {
      state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId });
    }
    const markup = renderToStaticMarkup(<BattleScreen state={state} dispatch={dispatch} />);

    expect(markup).toContain('因果路線');
    expect(markup).toContain('總傷害');
    expect(markup).toContain('擊殺');
    expect(markup).toContain('OVERKILL');
  });

  it('routes first victory through ricochet, forge, and a deterministic upgrade', () => {
    const postHunt = reachPowerBridge();
    const buildMarkup = renderToStaticMarkup(
      <GuildMobileStage state={postHunt} dispatch={dispatch} initialPage="build" />,
    );
    const ricochet = guildRpgReducer(postHunt, { type: 'SET_BUILD', buildId: 'ricochet' });
    const inventoryMarkup = renderToStaticMarkup(
      <GuildMobileStage state={ricochet} dispatch={dispatch} initialPage="inventory" />,
    );
    const forgeMarkup = renderToStaticMarkup(
      <ForgeWorkbench
        state={ricochet}
        dispatch={dispatch}
        guided
        onGuidedForge={() => undefined}
      />,
    );
    const forgeItem = ricochet.profile.party
      .flatMap((member) => Object.values(member.equipment))
      .find((item) => item?.sourceEnemyId);
    const forged = guildRpgReducer(ricochet, {
      type: 'FORGE_ITEM',
      itemId: forgeItem!.id,
      forgeAction: 'upgrade',
    });

    expect(postHunt.preferences.tutorial).toBe('active');
    expect(buildMarkup).toContain('找到殲滅彈射');
    expect(buildMarkup).toContain('data-guide-id="action:next-build" data-guide-focus="true"');
    expect(inventoryMarkup).toContain('點燃第一次鍛造');
    expect(inventoryMarkup).toContain('data-guide-id="action:open-forge" data-guide-focus="true"');
    expect(forgeMarkup).toContain('第一次鍛造');
    expect(forgeMarkup).toContain('data-guide-focus="true"');
    expect(forgeMarkup).toContain('力量強化');
    expect(forgeMarkup).not.toContain('規則灌注');
    expect(forged.profile.forgeSequence).toBe(1);
    expect(forged.message).toContain('鍛造完成');
  });

  it('replays the authored first hunt and progressively discloses the arsenal', () => {
    const postHunt = reachPowerBridge();
    const replay = guildRpgReducer(postHunt, { type: 'SET_TUTORIAL', tutorial: 'active' });
    const replayMarkup = renderToStaticMarkup(
      <GuildMobileStage state={replay} dispatch={dispatch} initialPage="quest" />,
    );
    const loadoutMarkup = renderToStaticMarkup(
      <LoadoutEditor state={postHunt} dispatch={dispatch} />,
    );

    expect(replayMarkup).toContain('邊境狼群');
    expect(replayMarkup).not.toContain('月路追獵');
    expect(loadoutMarkup).toContain('建議路線');
    expect(loadoutMarkup).toContain('展開全部 16 張');
    expect(loadoutMarkup).not.toContain('終焉聖歌');
  });
});
