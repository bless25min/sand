import type { HuntRewards } from '@expedition/shared-types';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from '../state/create-game-state';
import { guildRpgReducer, type GuildRpgState } from '../state/game-reducer';
import { parseGuildSave, serializeGuildSave } from '../storage/guild-save';
import { BattleScreen } from './BattleScreen';
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

function start() {
  return guildRpgReducer(createGuildRpgState(), {
    type: 'START_QUEST',
    questId: 'border_pack',
  });
}

function reachRewards(): GuildRpgState {
  let state = start();
  for (const cardId of FULL_WIPE_COMMAND) {
    state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId });
  }
  return guildRpgReducer(state, { type: 'RELEASE_COMBO' });
}

describe('complete combo hunt presentation', () => {
  it('shows enemy traits, early-release language, and a staged causal trace', () => {
    let state = start();
    state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId: 'brann_brace' });
    const markup = renderToStaticMarkup(<BattleScreen state={state} dispatch={dispatch} />);

    expect(markup).toContain('狼群壁壘');
    expect(markup).toContain('提早釋放');
    expect(markup).toContain('data-escalation-stage="stack"');
    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-label="戰鬥操作分頁"');
  });

  it('presents annihilation escalation, exclusive loot, and replay records', () => {
    const rewardsState = reachRewards();
    const rewards = rewardsState.rewards as HuntRewards;
    const rewardMarkup = renderToStaticMarkup(
      <RewardScreen state={rewardsState} dispatch={dispatch} />,
    );
    const guildState = guildRpgReducer(
      {
        ...rewardsState,
        resolvedItemIds: rewards.items.map((item) => item.id),
      },
      { type: 'RETURN_GUILD' },
    );
    const guildMarkup = renderToStaticMarkup(
      <GuildScreen state={guildState} dispatch={dispatch} />,
    );

    expect(rewardMarkup).toContain('PERFECT ANNIHILATION');
    expect(rewardMarkup).toContain('BOSS + GUARDS CHEST');
    expect(rewardMarkup).toContain('data-escalation-stage="overflow"');
    expect(rewardMarkup).toContain('OVERKILL QUALITY');
    expect(guildMarkup).toContain('最高溢傷');
    expect(guildMarkup).toContain('掉落效率');
    expect(guildMarkup).toContain('最高品質');
  });

  it('persists replay performance and provides reduced-motion mobile playback', () => {
    const state = reachRewards();
    const restored = parseGuildSave(serializeGuildSave(state.profile));
    const mobileCss = readFileSync(new URL('../mobile-battle.css', import.meta.url), 'utf8');
    const commandCss = readFileSync(new URL('../battle-command.css', import.meta.url), 'utf8');

    expect(restored?.questRecords.border_pack?.bestOverkill).toBeGreaterThan(0);
    expect(restored?.questRecords.border_pack?.bestLootMultiplier).toBeGreaterThan(1);
    expect(mobileCss).toContain('.gr-combo-playback');
    expect(commandCss).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
