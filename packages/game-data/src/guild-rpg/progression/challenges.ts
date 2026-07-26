import type { HuntChallengeDefinition } from '@expedition/shared-types';

import { GUILD_HUNTS } from '../combo/hunts';
import { GUILD_QUESTS } from '../quests';

const ROUTE_NAMES = ['三相接力', '反應連鎖', '層數爆發'] as const;

export const GUILD_HUNT_CHALLENGES: readonly HuntChallengeDefinition[] = GUILD_HUNTS.flatMap(
  (hunt, index) => {
    const quest = GUILD_QUESTS.find((candidate) => candidate.id === hunt.questId)!;
    const routeName = ROUTE_NAMES[index % ROUTE_NAMES.length]!;
    const executionEnemyId = hunt.bossEnemyId ?? hunt.enemies.at(-1)!.enemyId;
    const overkillThreshold = 180 + index * 60;
    return [
      {
        id: `${hunt.id}-one-command`,
        huntId: hunt.id,
        questId: hunt.questId,
        name: `${quest.name} · 一輪全滅`,
        description: '在六人第一輪接力結束前讓整場敵軍歸零。',
        kind: 'one_command',
        cueId: 'annihilation',
        rewardLabel: 'ONE COMMAND WIPE',
      },
      {
        id: `${hunt.id}-overkill`,
        huntId: hunt.id,
        questId: hunt.questId,
        name: `${quest.name} · 超量暴決`,
        description: `累積至少 ${overkillThreshold} 點 Overkill。`,
        kind: 'overkill',
        overkillThreshold,
        cueId: 'overkill',
        rewardLabel: `OVERKILL ${overkillThreshold}+`,
      },
      {
        id: `${hunt.id}-build-route`,
        huntId: hunt.id,
        questId: hunt.questId,
        name: `${quest.name} · ${routeName}`,
        description: '在同一場狩獵中實際打出火、草、水三種屬性。',
        kind: 'build_route',
        cueId: 'rule-online',
        rewardLabel: routeName,
      },
      {
        id: `${hunt.id}-execution`,
        huntId: hunt.id,
        questId: hunt.questId,
        name: `${quest.name} · 處刑完成`,
        description: '打開並完成這場狩獵的指定處刑條件。',
        kind: 'execution',
        executionEnemyId,
        cueId: 'boss-execution',
        rewardLabel: 'EXECUTION COMPLETE',
      },
    ];
  },
);
