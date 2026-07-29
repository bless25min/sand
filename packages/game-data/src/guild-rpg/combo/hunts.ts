import type {
  GuildElement,
  HuntDefinition,
  SkillDropPool,
  SkillSpecialization,
  TriggerCondition,
} from '@expedition/shared-types';

import { DEEPMINE_HUNTS } from '../campaign/deepmine';
import { EMBER_HUNTS } from '../campaign/ember';
import { FRONTIER_HUNTS } from '../campaign/frontier';
import { STORM_HUNTS } from '../campaign/storm';

const authoredHunts: readonly HuntDefinition[] = [
  ...FRONTIER_HUNTS,
  ...DEEPMINE_HUNTS,
  ...EMBER_HUNTS,
  ...STORM_HUNTS,
];

const HUNT_ELEMENTS: readonly GuildElement[] = [
  'grass',
  'grass',
  'grass',
  'water',
  'grass',
  'fire',
  'fire',
  'fire',
  'fire',
  'water',
  'water',
  'water',
];

const SPECIALIZATIONS: Readonly<Record<GuildElement, readonly SkillSpecialization[]>> = {
  fire: ['blast', 'stack', 'weaken', 'multistrike'],
  grass: ['stack', 'weaken', 'chain', 'blast'],
  water: ['empower', 'chain', 'multistrike', 'stack'],
};

const TRIGGERS: Readonly<Record<GuildElement, readonly TriggerCondition[]>> = {
  fire: [
    'target_burning',
    'consume_burn',
    'on_repeat_hit',
    'on_overkill',
    'previous_water',
    'lone_target',
  ],
  grass: [
    'target_poisoned',
    'target_burning',
    'consume_poison',
    'on_bounce',
    'previous_fire',
    'lone_target',
  ],
  water: [
    'target_tide',
    'consume_tide',
    'actor_strengthened',
    'on_echo',
    'previous_grass',
    'team_three_elements',
  ],
};

const CORES: Readonly<Record<GuildElement, readonly string[]>> = {
  fire: ['molten-armor', 'burn-burst', 'relay-prism'],
  grass: ['venom-depth', 'toxic-mist', 'lone-king-loop'],
  water: ['tide-relay', 'healing-echo', 'relay-prism'],
};

const dropPool = (huntId: string, element: GuildElement): SkillDropPool => ({
  id: huntId,
  elements: [element],
  specializationIds: SPECIALIZATIONS[element],
  triggerIds: TRIGGERS[element],
});

export const GUILD_HUNTS: readonly HuntDefinition[] = authoredHunts.map((hunt, index) => {
  const element = HUNT_ELEMENTS[index]!;
  const corePool = CORES[element];
  const coreStart = index % corePool.length;
  return {
    ...hunt,
    element,
    skillDropPool: dropPool(hunt.id, element),
    coreDropIds: [corePool[coreStart]!, corePool[(coreStart + 1) % corePool.length]!],
    ...(hunt.bossEnemyId ? { guaranteedBossDrops: 1 } : {}),
  };
});
