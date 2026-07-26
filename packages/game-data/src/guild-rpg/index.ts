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
import { GUILD_ELEMENTS } from './skill-build/attributes';
import { GUILD_EQUIPMENT_CORES } from './skill-build/equipment-cores';
import { GUILD_SKILL_FORMS } from './skill-build/skill-forms';
import { GUILD_SKILL_SPECIALIZATIONS } from './skill-build/specializations';
import { GUILD_TRIGGER_CONDITIONS } from './skill-build/triggers';

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
  GUILD_ELEMENTS,
  GUILD_EQUIPMENT_CORES,
  GUILD_SKILL_FORMS,
  GUILD_SKILL_SPECIALIZATIONS,
  GUILD_TRIGGER_CONDITIONS,
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
  skillForms: GUILD_SKILL_FORMS,
  equipmentCores: GUILD_EQUIPMENT_CORES,
  elements: GUILD_ELEMENTS,
  skillSpecializations: GUILD_SKILL_SPECIALIZATIONS,
  triggerConditions: GUILD_TRIGGER_CONDITIONS,
};

export { validateSkillBuildContent } from './skill-build/validate';
