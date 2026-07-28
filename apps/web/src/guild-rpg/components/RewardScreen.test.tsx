import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

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
        items: Array.from({ length: 12 }, (_, index) => ({
          ...item,
          id: `item-${index}`,
          name: `${item.name}${index + 1}`,
        })),
        skillDrops: Array.from({ length: 8 }, (_, index) => ({
          ...skill,
          id: `skill-${index}`,
          name: `${skill.name}${index + 1}`,
        })),
      },
    };

    const markup = renderToStaticMarkup(<RewardScreen state={state} dispatch={dispatch} />);

    expect(markup.match(/data-loot-item=/g) ?? []).toHaveLength(20);
    expect(markup).toContain('data-loot-count="20"');
    expect(markup).toContain('data-loot-density="max"');
    expect(markup).not.toContain('data-pager="loot"');
    expect(markup).not.toContain('class="gr-loot-detail-drawer"');
    expect(markup).toContain('data-material-count=');
  });
});
