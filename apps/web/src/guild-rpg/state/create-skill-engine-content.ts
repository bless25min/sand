import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { GuildProfile } from '@expedition/shared-types';
import type { SkillEngineContent } from '@expedition/simulation-core';

export const createSkillEngineContent = (profile: GuildProfile): SkillEngineContent => ({
  skills: Object.fromEntries(profile.skillInventory.map((skill) => [skill.id, skill])),
  elements: GUILD_GAME_CONTENT.elements,
  specializations: GUILD_GAME_CONTENT.skillSpecializations,
  triggers: GUILD_GAME_CONTENT.triggerConditions,
  forms: GUILD_GAME_CONTENT.skillForms,
  hunts: GUILD_GAME_CONTENT.hunts,
});
