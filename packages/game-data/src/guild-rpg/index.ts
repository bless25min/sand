import type { GuildGameContent } from '@expedition/shared-types';

import { GUILD_ADVENTURERS } from './adventurers';
import {
  GUILD_COMBO_BUILDS,
  GUILD_COMBO_CARDS,
  GUILD_COMBO_CONTENT,
  GUILD_COMBO_RULES,
  GUILD_HUNTS,
} from './combo';
import { GUILD_EQUIPMENT_AFFIXES, GUILD_EQUIPMENT_BASES } from './equipment';
import { GUILD_QUESTS } from './quests';
import { GUILD_SKILLS } from './skills';
import { GUILD_ZONES } from './campaign/zones';
import { GUILD_ASCENSIONS, GUILD_CODEX_ENTRIES, GUILD_HUNT_CHALLENGES } from './progression';

export {
  GUILD_ADVENTURERS,
  GUILD_COMBO_CARDS,
  GUILD_COMBO_BUILDS,
  GUILD_COMBO_CONTENT,
  GUILD_COMBO_RULES,
  GUILD_HUNTS,
  GUILD_EQUIPMENT_AFFIXES,
  GUILD_EQUIPMENT_BASES,
  GUILD_QUESTS,
  GUILD_SKILLS,
  GUILD_ZONES,
  GUILD_ASCENSIONS,
  GUILD_CODEX_ENTRIES,
  GUILD_HUNT_CHALLENGES,
};

export const GUILD_GAME_CONTENT: GuildGameContent = {
  zones: GUILD_ZONES,
  adventurers: GUILD_ADVENTURERS,
  cards: GUILD_COMBO_CARDS,
  rules: GUILD_COMBO_RULES,
  builds: GUILD_COMBO_BUILDS,
  hunts: GUILD_HUNTS,
  skills: GUILD_SKILLS,
  quests: GUILD_QUESTS,
  equipmentBases: GUILD_EQUIPMENT_BASES,
  equipmentAffixes: GUILD_EQUIPMENT_AFFIXES,
  challenges: GUILD_HUNT_CHALLENGES,
  ascensions: GUILD_ASCENSIONS,
  codexEntries: GUILD_CODEX_ENTRIES,
};
