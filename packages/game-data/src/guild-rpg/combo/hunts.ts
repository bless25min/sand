import type { HuntDefinition } from '@expedition/shared-types';

import { DEEPMINE_HUNTS } from '../campaign/deepmine';
import { EMBER_HUNTS } from '../campaign/ember';
import { FRONTIER_HUNTS } from '../campaign/frontier';
import { STORM_HUNTS } from '../campaign/storm';

export const GUILD_HUNTS: readonly HuntDefinition[] = [
  ...FRONTIER_HUNTS,
  ...DEEPMINE_HUNTS,
  ...EMBER_HUNTS,
  ...STORM_HUNTS,
];
