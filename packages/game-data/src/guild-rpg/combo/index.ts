import type { ComboContent } from '@expedition/shared-types';

import { GUILD_COMBO_BUILDS } from './builds';
import { GUILD_COMBO_CARDS } from './cards';
import { GUILD_COMBO_RULES } from './rules';

export { GUILD_COMBO_BUILDS, GUILD_COMBO_CARDS, GUILD_COMBO_RULES };

export const GUILD_COMBO_CONTENT: ComboContent = {
  cards: GUILD_COMBO_CARDS,
  rules: GUILD_COMBO_RULES,
  builds: GUILD_COMBO_BUILDS,
};
