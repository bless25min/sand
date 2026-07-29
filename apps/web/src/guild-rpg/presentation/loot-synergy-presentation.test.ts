import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { HuntEquipmentItem, OwnedSkill } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { createGuildProfile } from '@expedition/simulation-core';
import { recommendEquipment, recommendSkill } from './loot-synergy-presentation';

const profile = createGuildProfile(GUILD_GAME_CONTENT);
const fireSkill = profile.skillInventory.find(({ components }) =>
  components.some(({ element }) => element === 'fire'),
)!;
const burningSkill = profile.skillInventory.find(({ components }) =>
  components.some(({ triggerId }) => triggerId === 'target_burning'),
)!;

const equipment = (
  id: string,
  rarity: HuntEquipmentItem['rarity'],
  coreId: string,
): HuntEquipmentItem => ({
  id,
  baseId: id,
  name: id,
  slot: 'weapon',
  rarity,
  qualityRank: rarity === 'legendary' ? 5 : 1,
  mainStat: { stat: 'attack', value: rarity === 'legendary' ? 5 : 1 },
  affixes: [],
  sellValue: 1,
  sourceEnemyId: 'enemy',
  qualityScore: 0,
  jackpot: false,
  recommendedBuildIds: [],
  coreId,
  coreStrength: 1,
  cores: [{ id: coreId, strength: 1 }],
});

describe('loot synergy presentation', () => {
  it('recommends a connected common equipment core over unrelated legendary raw stats', () => {
    const connected = equipment('connected', 'common', 'burn-burst');
    const unrelated = equipment('unrelated', 'legendary', 'healing-echo');
    const fireOnlyProfile = {
      ...profile,
      party: profile.party.map((member, index) => ({
        ...member,
        skillIds: index === 0 ? [fireSkill.id, burningSkill.id] : [],
      })),
    };

    const recommendation = recommendEquipment(
      [unrelated, connected],
      fireOnlyProfile,
      GUILD_GAME_CONTENT,
    );

    expect(recommendation?.entry.id).toBe('connected');
    expect(recommendation?.links).toBeGreaterThan(0);
    expect(recommendation?.explanation).toContain('已配置技能');
  });

  it('explains how a new skill both consumes and feeds the current six-person chain', () => {
    const candidate: OwnedSkill = {
      ...fireSkill,
      id: 'candidate',
      stars: 1,
      components: [
        {
          ...fireSkill.components[0],
          triggerId: 'target_burning' as const,
        },
      ],
    };

    const recommendation = recommendSkill([candidate], profile);

    expect(recommendation?.entry.id).toBe('candidate');
    expect(recommendation?.links).toBeGreaterThan(0);
    expect(recommendation?.explanation).toMatch(/接上|供給/);
  });
});
