import type { GuildCodexEntry } from '@expedition/shared-types';

import { GUILD_ZONES } from '../campaign/zones';
import { GUILD_COMBO_BUILDS } from '../combo/builds';
import { GUILD_HUNTS } from '../combo/hunts';
import { GUILD_COMBO_RULES } from '../combo/rules';
import { GUILD_QUESTS } from '../quests';
import { GUILD_HUNT_CHALLENGES } from './challenges';

function uniqueByRef(entries: readonly GuildCodexEntry[]) {
  return [...new Map(entries.map((entry) => [`${entry.category}:${entry.refId}`, entry])).values()];
}

const enemyEntries = GUILD_QUESTS.flatMap((quest) =>
  quest.enemies.map((enemy): GuildCodexEntry => ({
    id: `enemy:${enemy.id}`,
    category: 'enemy',
    refId: enemy.id,
    name: enemy.name,
    description: `${quest.name}的敵軍目標；擊破後收錄完整戰鬥紀錄。`,
  })),
);

const equipmentEntries = GUILD_HUNTS.flatMap((hunt) => [
  ...hunt.enemies.flatMap((enemy) =>
    enemy.equipment.map((item): GuildCodexEntry => ({
      id: `equipment:${item.id}`,
      category: 'equipment',
      refId: item.id,
      name: item.name,
      description: `${item.slot} · ${item.mainStat} · 來自 ${enemy.material.name}`,
    })),
  ),
  ...(hunt.annihilationChest
    ? [
        {
          id: `equipment:${hunt.annihilationChest.id}`,
          category: 'equipment' as const,
          refId: hunt.annihilationChest.id,
          name: hunt.annihilationChest.name,
          description: '殲滅寶箱專屬裝備。',
        },
      ]
    : []),
]);

export const GUILD_CODEX_ENTRIES: readonly GuildCodexEntry[] = uniqueByRef([
  ...enemyEntries,
  ...equipmentEntries,
  ...Object.values(GUILD_COMBO_RULES).map((rule) => ({
    id: `rule:${rule.id}`,
    category: 'rule' as const,
    refId: rule.id,
    name: rule.name,
    description: rule.description,
  })),
  ...GUILD_COMBO_BUILDS.map((build) => ({
    id: `build:${build.id}`,
    category: 'build' as const,
    refId: build.id,
    name: build.name,
    description: build.fantasy,
  })),
  ...GUILD_ZONES.map((zone) => ({
    id: `zone:${zone.id}`,
    category: 'zone' as const,
    refId: zone.id,
    name: zone.name,
    description: zone.description,
  })),
  ...GUILD_HUNT_CHALLENGES.map((challenge) => ({
    id: `challenge:${challenge.id}`,
    category: 'challenge' as const,
    refId: challenge.id,
    name: challenge.name,
    description: challenge.description,
  })),
]);
