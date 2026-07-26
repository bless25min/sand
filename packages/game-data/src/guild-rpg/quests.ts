import type { QuestDefinition } from '@expedition/shared-types';

import { DEEPMINE_QUESTS } from './campaign/deepmine';
import { EMBER_QUESTS } from './campaign/ember';
import { FRONTIER_QUESTS } from './campaign/frontier';
import { STORM_QUESTS } from './campaign/storm';

export const GUILD_QUESTS: readonly QuestDefinition[] = [
  ...FRONTIER_QUESTS,
  ...DEEPMINE_QUESTS,
  ...EMBER_QUESTS,
  ...STORM_QUESTS,
];
