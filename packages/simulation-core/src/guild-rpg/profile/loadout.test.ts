import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { describe, expect, it } from 'vitest';

import { createGuildProfile } from './create-profile';
import { equipAdventurerSkill } from './equip-adventurer-skill';

describe('six-skill adventurer loadouts', () => {
  it('starts all six heroes with six owned and always-available skills', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const ownedIds = new Set(profile.skillInventory.map(({ id }) => id));

    expect(profile.party).toHaveLength(6);
    for (const hero of profile.party) {
      expect(hero.skillIds).toHaveLength(6);
      expect(new Set(hero.skillIds).size).toBe(6);
      expect(hero.skillIds.every((skillId) => ownedIds.has(skillId))).toBe(true);
    }
  });

  it('lets any hero replace one of six slots with any owned skill', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const lyraSkill = profile.party.find(({ definitionId }) => definitionId === 'lyra')!
      .skillIds[0]!;
    const result = equipAdventurerSkill(profile, 'brann', 2, lyraSkill);
    const brann = result.profile.party.find(({ definitionId }) => definitionId === 'brann')!;

    expect(brann.skillIds).toHaveLength(6);
    expect(brann.skillIds[2]).toBe(lyraSkill);
    expect(result.message).toContain('布蘭');
  });

  it('rejects unknown skills and invalid slots without mutating the profile', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    expect(equipAdventurerSkill(profile, 'brann', 6, profile.skillInventory[0]!.id).profile).toBe(
      profile,
    );
    expect(equipAdventurerSkill(profile, 'brann', 0, 'missing').profile).toBe(profile);
  });
});
