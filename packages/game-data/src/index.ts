import type { SkillDefinition } from '@expedition/shared-types';

import { BEAST_HUNTER_MARKSMAN } from './classes/beast-hunter-marksman';
import { HEAVY_SHIELD_GUARD } from './classes/heavy-shield-guard';
import { BEAST_HUNTING_MANUAL } from './skills/beast-hunting-manual';
import { SHIELD_WALL_TRAINING } from './skills/shield-wall-training';

export { getMaterialDefinition, GREYFANG_MATERIALS } from './greyfang-materials';
export { HORNPLATE_SHIELD, HORNPLATE_SHIELD_RECIPE } from './hornplate-shield';
export { EXPERIENCE_RULES } from './progression/experience-rules';
export { BEAST_HUNTER_MARKSMAN, HEAVY_SHIELD_GUARD };
export { SHIELD_WALL_TRAINING } from './skills/shield-wall-training';
export { BEAST_HUNTING_MANUAL } from './skills/beast-hunting-manual';

export const LEGION_SKILLS: Readonly<Record<string, SkillDefinition>> = {
  [SHIELD_WALL_TRAINING.id]: SHIELD_WALL_TRAINING,
  [BEAST_HUNTING_MANUAL.id]: BEAST_HUNTING_MANUAL,
};

export * from './guild-rpg/index';
