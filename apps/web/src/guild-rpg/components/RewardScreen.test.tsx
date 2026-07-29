import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { OwnedSkill } from '@expedition/shared-types';

import { createGuildRpgState } from '../state/create-game-state';
import { guildRpgReducer, type GuildRpgState } from '../state/game-reducer';
import { RewardScreen } from './RewardScreen';

const dispatch = () => undefined;

const winHunt = () => {
  let state = guildRpgReducer(createGuildRpgState(), {
    type: 'START_QUEST',
    questId: 'border_pack',
  });
  for (let turns = 0; state.screen === 'battle' && turns < 60; turns += 1) {
    if (state.battle?.status === 'victory') {
      return guildRpgReducer(state, { type: 'COLLECT_VICTORY' });
    }
    const target = state.battle!.units.find(
      ({ side, currentHp }) => side === 'enemies' && currentHp > 0,
    )!;
    const actorId = state.battle!.roundOrder!.activeAdventurerId;
    const member = state.profile.party.find(({ definitionId }) => definitionId === actorId)!;
    state = guildRpgReducer(state, {
      type: 'USE_SKILL',
      skillId: member.skillIds[turns % member.skillIds.length]!,
      targetId: target.id,
    });
  }
  return state;
};

describe('RewardScreen', () => {
  it('fits twenty non-material drops in one selectable summary without a pager', () => {
    const won = winHunt();
    const item = won.rewards!.items[0]!;
    const skill = won.rewards!.skillDrops[0]!;
    const state: GuildRpgState = {
      ...won,
      rewards: {
        ...won.rewards!,
        items: Array.from({ length: 19 }, (_, index) => ({
          ...item,
          id: `item-${index}`,
          name: `${item.name}${index + 1}`,
        })),
        skillDrops: [{ ...skill, id: 'skill-1', name: `${skill.name}1` }],
      },
    };

    const markup = renderToStaticMarkup(<RewardScreen state={state} dispatch={dispatch} />);

    expect(markup.match(/data-loot-item=/g) ?? []).toHaveLength(20);
    expect(markup).toContain('data-loot-count="20"');
    expect(markup).toContain('data-loot-density="max"');
    expect(markup).not.toContain('data-pager="loot"');
    expect(markup).not.toContain('class="gr-loot-detail-drawer"');
    expect(markup).toContain('data-material-count=');
    expect(markup.match(/data-loot-kind="skill"/g) ?? []).toHaveLength(1);
  });

  it('celebrates newly completed challenges and personal records above loot', () => {
    const won = winHunt();
    const challengeId = GUILD_GAME_CONTENT.challenges.find(
      ({ questId, kind }) => questId === 'border_pack' && kind === 'one_command',
    )!.id;
    const state: GuildRpgState = {
      ...won,
      newChallengeIds: [challengeId],
      recordHighlights: ['最高 OVERKILL 324', '最長連鎖 6'],
    };

    const markup = renderToStaticMarkup(<RewardScreen state={state} dispatch={dispatch} />);

    expect(markup).toContain('data-reward-achievements="true"');
    expect(markup).toContain('新完成');
    expect(markup).toContain('一輪全滅');
    expect(markup).toContain('最高 OVERKILL 324');
    expect(markup).toContain('最長連鎖 6');
  });

  it('colors every loot tile by rarity instead of elemental attribute', () => {
    const won = winHunt();
    const skill = won.rewards!.skillDrops[0]!;
    const state: GuildRpgState = {
      ...won,
      rewards: {
        ...won.rewards!,
        items: [],
        skillDrops: ([1, 3, 5] as const).map(
          (qualityRank) =>
            ({
              ...skill,
              id: `skill-${qualityRank}`,
              stars: 1,
              components: [
                {
                  ...skill.components[0],
                  qualityRank,
                },
              ],
            }) as OwnedSkill,
        ),
      },
    };

    const markup = renderToStaticMarkup(<RewardScreen state={state} dispatch={dispatch} />);
    const css = readFileSync(new URL('../guild-rewards.css', import.meta.url), 'utf8');

    expect(markup).toContain('data-rarity="common"');
    expect(markup).toContain('data-rarity="rare"');
    expect(markup).toContain('data-rarity="legendary"');
    expect(markup).not.toContain('data-rarity="skill"');
    expect(markup).not.toContain('data-element=');
    expect(css).not.toMatch(/\[data-rarity='skill'\]\[data-element=/);
    expect(css).toContain('grid-template-columns: repeat(4');
  });
});
