import type { HuntChallengeDefinition } from '@expedition/shared-types';

import { GUILD_COMBO_BUILDS } from '../combo/builds';
import { GUILD_HUNTS } from '../combo/hunts';
import { GUILD_QUESTS } from '../quests';

const ROUTE_BUILD_IDS = GUILD_COMBO_BUILDS.map((build) => build.id);

export const GUILD_HUNT_CHALLENGES: readonly HuntChallengeDefinition[] = GUILD_HUNTS.flatMap(
  (hunt, index) => {
    const quest = GUILD_QUESTS.find((candidate) => candidate.id === hunt.questId)!;
    const routeBuildId = ROUTE_BUILD_IDS[index % ROUTE_BUILD_IDS.length]!;
    const routeBuild = GUILD_COMBO_BUILDS.find((build) => build.id === routeBuildId)!;
    const executionEnemyId = hunt.bossEnemyId ?? hunt.enemies.at(-1)!.enemyId;
    const overkillThreshold = 180 + index * 60;
    return [
      {
        id: `${hunt.id}-one-command`,
        huntId: hunt.id,
        questId: hunt.questId,
        name: `${quest.name} · 一令全滅`,
        description: '只釋放一次完整軍令就讓整場敵軍歸零。',
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
        name: `${quest.name} · ${routeBuild.name}`,
        description: `以「${routeBuild.name}」規則路線完成狩獵。`,
        kind: 'build_route',
        requiredBuildId: routeBuildId,
        cueId: 'rule-online',
        rewardLabel: routeBuild.payoffLabel,
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
