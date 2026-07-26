import type {
  GuildBattleState,
  GuildGameContent,
  GuildProfile,
  HuntDefinition,
  HuntRewards,
} from '@expedition/shared-types';

import { applyQuestRewards } from '../rewards/apply-rewards';

function executionCompleted(battle: GuildBattleState, hunt: HuntDefinition, enemyId?: string) {
  if (!enemyId) return false;
  const defeatEvent = battle.combo?.events.find(
    (event) => event.kind === 'unit_defeated' && event.targetId === enemyId,
  );
  const overkillEvent = battle.combo?.events.find(
    (event) =>
      event.kind === 'overkill' &&
      event.targetId === enemyId &&
      event.parentCausalId !== undefined &&
      event.parentCausalId === defeatEvent?.parentCausalId,
  );
  if (!defeatEvent || !overkillEvent) return false;
  if (!hunt.bossEnemyId) return true;
  const phaseIds = hunt.bossPhases?.map((phase) => phase.id) ?? [];
  const activeIds = new Set(battle.combo?.activatedBossPhaseIds ?? []);
  return phaseIds.length === 0 || phaseIds.every((phaseId) => activeIds.has(phaseId));
}

export function evaluateHuntChallenges(
  profile: GuildProfile,
  battle: GuildBattleState,
  hunt: HuntDefinition,
  content: GuildGameContent,
) {
  if (battle.status !== 'victory') return [];
  const metrics = battle.combo?.metrics;
  const playedCardIds = new Set(
    battle.combo?.events
      .filter((event) => event.kind === 'card_played')
      .map((event) => event.cardId)
      .filter((cardId): cardId is string => Boolean(cardId)) ?? [],
  );
  return content.challenges.filter((challenge) => {
    if (challenge.huntId !== hunt.id) return false;
    if (challenge.kind === 'one_command') return (metrics?.commandCount ?? 0) === 1;
    if (challenge.kind === 'overkill') {
      return (metrics?.totalOverkill ?? 0) >= (challenge.overkillThreshold ?? Infinity);
    }
    if (challenge.kind === 'build_route') {
      const build = content.builds.find((candidate) => candidate.id === challenge.requiredBuildId);
      return (
        profile.selectedBuildId === challenge.requiredBuildId &&
        Boolean(build) &&
        build!.signatureCardIds.every((cardId) => playedCardIds.has(cardId))
      );
    }
    return executionCompleted(battle, hunt, challenge.executionEnemyId);
  });
}

export function applyHuntProgression(
  profile: GuildProfile,
  battle: GuildBattleState,
  rewards: HuntRewards,
  content: GuildGameContent,
) {
  const rewarded = applyQuestRewards(profile, rewards, content.quests);
  if (!rewards.successful) {
    return { profile: rewarded, newChallengeIds: [] as string[] };
  }
  const hunt = content.hunts.find((candidate) => candidate.id === rewards.huntId);
  if (!hunt) throw new Error(`Unknown hunt progression: ${rewards.huntId}`);
  const completed = evaluateHuntChallenges(profile, battle, hunt, content);
  const previouslyCompleted = new Set(profile.completedChallengeIds);
  const newChallenges = completed.filter((challenge) => !previouslyCompleted.has(challenge.id));
  const completedChallengeIds = [
    ...new Set([...profile.completedChallengeIds, ...completed.map((challenge) => challenge.id)]),
  ];
  const record = rewarded.questRecords[rewards.questId]!;
  const build = content.builds.find((candidate) => candidate.id === profile.selectedBuildId);
  const discoveredRuleIds = [
    ...new Set([
      ...profile.discoveredRuleIds,
      ...(build?.ruleIds ?? []),
      ...rewards.items.flatMap((item) => item.ruleIds ?? []),
    ]),
  ];
  const discoveredEquipmentIds = [
    ...new Set([...profile.discoveredEquipmentIds, ...rewards.items.map((item) => item.baseId)]),
  ];
  const progressionEvents = [
    ...profile.progressionEvents,
    ...newChallenges.map((challenge) => ({
      id: `challenge-${battle.seed}-${challenge.id}`,
      kind: 'challenge' as const,
      label: challenge.rewardLabel,
      detail: challenge.name,
    })),
    ...(battle.ascension
      ? [
          {
            id: `ascension-${battle.seed}-${battle.ascension.id}-${profile.nextLootSeed}`,
            kind: 'ascension' as const,
            label: `${battle.ascension.name}制霸`,
            detail: battle.ascension.routeLabel,
          },
        ]
      : []),
  ].slice(-20);

  return {
    profile: {
      ...rewarded,
      completedChallengeIds,
      discoveredEquipmentIds,
      discoveredRuleIds,
      progressionEvents,
      questRecords: {
        ...rewarded.questRecords,
        [rewards.questId]: {
          ...record,
          bestChain: Math.max(
            record.bestChain ?? 0,
            battle.combo?.metrics.bestCommandCardCount ?? 0,
          ),
          ascendedClears: (record.ascendedClears ?? 0) + (battle.ascension ? 1 : 0),
        },
      },
    },
    newChallengeIds: newChallenges.map((challenge) => challenge.id),
  };
}
