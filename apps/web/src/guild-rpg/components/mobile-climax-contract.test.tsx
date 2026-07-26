import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from '../state/create-game-state';
import { guildRpgReducer, type GuildRpgState } from '../state/game-reducer';
import { ComboPlaybackScreen } from './ComboPlaybackScreen';
import { RewardScreen } from './RewardScreen';
import { ThumbCommandDeck, type ThumbDeckAction } from './ThumbCommandDeck';

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

function releaseFullCommand(): GuildRpgState {
  let state = guildRpgReducer(createGuildRpgState(), {
    type: 'START_QUEST',
    questId: 'border_pack',
  });
  for (const cardId of FULL_WIPE_COMMAND) {
    state = guildRpgReducer(state, { type: 'APPEND_COMBO_CARD', cardId });
  }
  return guildRpgReducer(state, { type: 'RELEASE_COMBO' });
}

function reachRewards(): GuildRpgState {
  let state = releaseFullCommand();
  state = guildRpgReducer(state, { type: 'ADVANCE_PLAYBACK', count: 1_000 });
  return guildRpgReducer(state, { type: 'COMPLETE_PLAYBACK' });
}

describe('mobile climax reclamation', () => {
  it('reveals only the one command requested by active guidance', () => {
    const actions: readonly ThumbDeckAction[] = [
      {
        id: 'equip',
        label: '立即裝備',
        slot: 'primary',
        onPress: dispatch,
      },
      {
        id: 'sell',
        label: '出售',
        slot: 'utility',
        onPress: dispatch,
      },
    ];
    const markup = renderToStaticMarkup(
      <ThumbCommandDeck
        ariaLabel="測試操作"
        eyebrow="LOOT"
        title="測試"
        feedback="不應浮在戰場上"
        onSkipGuide={dispatch}
        guide={{
          step: 'loot',
          paused: true,
          phaseLabel: '掉落引導',
          stepNumber: 1,
          stepTotal: 1,
          title: '裝上力量',
          message: '使用推薦裝備者。',
          focusId: 'action:equip',
        }}
        actions={actions}
        tabs={[
          { id: 'quest', label: '任務', selected: false, onSelect: dispatch },
          { id: 'inventory', label: '背包', selected: true, onSelect: dispatch },
        ]}
      />,
    );

    expect(markup).toContain('data-guide-active="true"');
    expect(markup).toContain('立即裝備');
    expect(markup).toContain('略過引導');
    expect(markup).not.toContain('>出售<');
    expect(markup).not.toContain('>任務<');
    expect(markup).not.toContain('gr-thumb-deck__feedback');
    expect(markup.match(/data-guide-focus="true"/g) ?? []).toHaveLength(1);
  });

  it('gives playback the full viewport instead of reserving a command deck', () => {
    const state = releaseFullCommand();
    const markup = renderToStaticMarkup(<ComboPlaybackScreen state={state} dispatch={dispatch} />);
    const battleCss = readFileSync(new URL('../mobile-battle.css', import.meta.url), 'utf8');
    const deckCss = readFileSync(new URL('../thumb-command-deck.css', import.meta.url), 'utf8');

    expect(markup).toContain('class="gr-battle gr-playback-screen"');
    expect(battleCss).toContain('.gr-playback-screen');
    expect(battleCss).toMatch(/\.gr-playback-screen\s*\{[^}]*padding-bottom:\s*10px/s);
    expect(battleCss).toContain('.gr-playback__controls');
    expect(deckCss).toContain("[data-guide-active='true']");
  });

  it('puts the current drop before optional mobile summaries and avoids zero-time copy', () => {
    const state = reachRewards();
    const markup = renderToStaticMarkup(<RewardScreen state={state} dispatch={dispatch} />);
    const rewardCss = readFileSync(new URL('../mobile-rewards.css', import.meta.url), 'utf8');

    expect(state.rewards!.clearMs).toBe(0);
    expect(markup).toContain('殲滅完成');
    expect(markup).not.toContain('0.0 SEC');
    expect(markup.indexOf('gr-mobile-reward-stage')).toBeLessThan(
      markup.indexOf('gr-hunt-summary'),
    );
    expect(rewardCss).toContain('.gr-hunt-summary');
    expect(rewardCss).toContain('.gr-mobile-reward-stage > .gr-reward-card');
    expect(rewardCss).toMatch(/\.gr-mobile-reward-stage > \.gr-reward-card\s*\{[^}]*max-height:/s);
  });
});
