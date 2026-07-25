import type { GuildGameContent } from '@expedition/shared-types';

import { GUILD_ADVENTURERS } from './adventurers';
import { GUILD_EQUIPMENT_AFFIXES, GUILD_EQUIPMENT_BASES } from './equipment';
import { GUILD_QUESTS } from './quests';
import { GUILD_SKILLS } from './skills';

export {
  GUILD_ADVENTURERS,
  GUILD_EQUIPMENT_AFFIXES,
  GUILD_EQUIPMENT_BASES,
  GUILD_QUESTS,
  GUILD_SKILLS,
};

export const GUILD_GAME_CONTENT: GuildGameContent = {
  adventurers: GUILD_ADVENTURERS,
  skills: GUILD_SKILLS,
  quests: GUILD_QUESTS,
  equipmentBases: GUILD_EQUIPMENT_BASES,
  equipmentAffixes: GUILD_EQUIPMENT_AFFIXES,
};
