import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { createGuildRpgState } from '../state/create-game-state';
import { guildRpgReducer } from '../state/game-reducer';
import { BattleScreen } from './BattleScreen';
import { GuildScreen } from './GuildScreen';

function releaseReadyState() {
  const state = createGuildRpgState();
  const item = {
    id: 'ui-forge',
    baseId: 'scout_charm',
    name: '斥候追風符',
    slot: 'accessory' as const,
    rarity: 'rare' as const,
    mainStat: { stat: 'speed' as const, value: 5 },
    affixes: [],
    sellValue: 40,
    sourceEnemyId: 'wolf_scout',
  };
  return {
    ...state,
    profile: {
      ...state.profile,
      inventory: [item],
      gold: 200,
      materials: { scout_fang: 3 },
      unlockedQuestIds: GUILD_GAME_CONTENT.quests.map((quest) => quest.id),
      questRecords: Object.fromEntries(
        GUILD_GAME_CONTENT.quests.map((quest) => [
          quest.id,
          {
            clears: 1,
            bestClearMs: 5_000,
            bestOverkill: 999,
            bestChain: 8,
            bestItemQuality: 777,
          },
        ]),
      ),
      completedChallengeIds: GUILD_GAME_CONTENT.challenges.slice(0, 4).map((entry) => entry.id),
      discoveredEquipmentIds: ['scout_charm'],
      discoveredRuleIds: ['retaliation_bash'],
    },
  };
}

describe('formal-release long-term loop surfaces', () => {
  it('keeps loadout, forge, archive, records, challenges, and Ascended launch visible', () => {
    const markup = renderToStaticMarkup(
      <GuildScreen state={releaseReadyState()} dispatch={vi.fn()} />,
    );

    expect(markup).toContain('LOADOUT · 8 / 16');
    expect(markup).toContain('gr-longterm-feedback');
    expect(markup).toContain('鍛造工坊');
    expect(markup).toContain('斥候狼牙');
    expect(markup).toContain('格擋反震');
    expect(markup).toContain('遠征檔案館');
    expect(markup).toContain('圖鑑條目');
    expect(markup).toContain('灰牙斥候');
    expect(markup).toContain('已收錄');
    expect(markup).toContain('挑戰 4/48');
    expect(markup).toContain('最佳連鎖');
    expect(markup).toContain('ASCENDED 遠征');
    expect(markup).toContain('赤紅壓境');
  });

  it('carries the chosen Ascension route and spectacle cue into the battle header', () => {
    const state = guildRpgReducer(releaseReadyState(), {
      type: 'START_QUEST',
      questId: 'border_pack',
      ascensionId: 'annihilation_weather',
    });
    const markup = renderToStaticMarkup(<BattleScreen state={state} dispatch={vi.fn()} />);

    expect(markup).toContain('data-ascension="annihilation_weather"');
    expect(markup).toContain('data-cue="annihilation"');
    expect(markup).toContain('data-motif="storm"');
    expect(markup).toContain('極限 Overkill 路線');
    expect(markup).toContain('殲滅天候');
  });
});
