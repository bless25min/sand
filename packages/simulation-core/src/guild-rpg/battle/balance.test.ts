import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { EquipmentItem, GuildProfile } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { createSeededRandom } from '../../rng/seeded-random';
import { createGuildProfile } from '../profile/create-profile';
import { advanceGuildBattle } from './advance-battle';
import { createGuildBattle } from './create-battle';

function autoBattle(profile: GuildProfile, questIndex: number) {
  let battle = createGuildBattle({
    adventurers: GUILD_GAME_CONTENT.adventurers,
    quest: GUILD_GAME_CONTENT.quests[questIndex]!,
    party: [...profile.party],
    leaderId: profile.leaderId,
    leaderAuto: true,
    seed: `balance-${questIndex}`,
  });
  for (let index = 0; index < 3_000 && battle.status === 'active'; index += 1) {
    battle = advanceGuildBattle(
      battle,
      100,
      GUILD_GAME_CONTENT.skills,
      createSeededRandom(`${battle.seed}:${battle.sequence}`),
    );
  }
  return battle;
}

function trainingItem(slot: EquipmentItem['slot'], id: string): EquipmentItem {
  const stat = slot === 'weapon' ? 'attack' : slot === 'armor' ? 'defense' : 'speed';
  return {
    id,
    baseId: id,
    name: `遠征訓練${id}`,
    slot,
    rarity: 'rare',
    mainStat: { stat, value: slot === 'accessory' ? 5 : 16 },
    affixes: [{ stat: 'hp', value: 30 }],
    sellValue: 50,
  };
}

describe('guild RPG difficulty curve', () => {
  it('lets a fresh guild clear the tutorial quest in roughly 20-45 simulated seconds', () => {
    const result = autoBattle(createGuildProfile(GUILD_GAME_CONTENT), 0);

    expect(result.status).toBe('victory');
    expect(result.elapsedMs).toBeGreaterThanOrEqual(18_000);
    expect(result.elapsedMs).toBeLessThanOrEqual(45_000);
  });

  it('stops a lightly equipped level-two party from auto-clearing the dragon shrine', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const lightlyEquipped: GuildProfile = {
      ...profile,
      party: profile.party.map((member) => ({
        ...member,
        level: 2,
        equipment:
          member.definitionId === profile.leaderId
            ? { weapon: trainingItem('weapon', 'single-rare-weapon') }
            : {},
      })),
    };

    expect(autoBattle(lightlyEquipped, 2).status).toBe('defeat');
  });

  it('allows a trained, fully equipped level-four party to clear the final quest', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const trained: GuildProfile = {
      ...profile,
      party: profile.party.map((member) => ({
        ...member,
        level: 4,
        equipment: {
          weapon: trainingItem('weapon', `${member.definitionId}-weapon`),
          armor: trainingItem('armor', `${member.definitionId}-armor`),
          accessory: trainingItem('accessory', `${member.definitionId}-accessory`),
        },
      })),
    };

    expect(autoBattle(trained, 2).status).toBe('victory');
  });
});
