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
  const events = battle.combo?.events ?? battle.events;
  const defeatEvent = events.find(
    (event) => event.kind === 'unit_defeated' && event.targetId === enemyId,
  );
  const overkillEvent = events.find(
    (event) =>
      event.kind === 'overkill' &&
      event.targetId === enemyId &&
      (battle.combo === undefined ||
        (event.parentCausalId !== undefined &&
          event.parentCausalId === defeatEvent?.parentCausalId)),
  );
  if (!defeatEvent || !overkillEvent) return false;
  if (!battle.combo) return true;
  if (!hunt.bossEnemyId) return true;
  const phaseIds = hunt.bossPhases?.map((phase) => phase.id) ?? [];
  const activeIds = new Set(battle.combo?.activatedBossPhaseIds ?? []);
  return phaseIds.length === 0 || phaseIds.every((phaseId) => activeIds.has(phaseId));
}

export function evaluateHuntChallenges(
  _profile: GuildProfile,
  battle: GuildBattleState,
  hunt: HuntDefinition,
  content: GuildGameContent,
) {
  if (battle.status !== 'victory') return [];
  const metrics = battle.combo?.metrics;
  const v4Overkill = battle.events
    .filter(({ kind }) => kind === 'overkill')
    .reduce((sum, { amount }) => sum + (amount ?? 0), 0);
  const maxSkillRound = Math.max(
    0,
    ...(battle.skillHistory?.map(({ roundIndex }) => roundIndex) ?? []),
  );
  return content.challenges.filter((challenge) => {
    if (challenge.huntId !== hunt.id) return false;
    if (challenge.kind === 'one_command') {
      return battle.combo ? (metrics?.commandCount ?? 0) === 1 : maxSkillRound === 1;
    }
    if (challenge.kind === 'overkill') {
      return (metrics?.totalOverkill ?? v4Overkill) >= (challenge.overkillThreshold ?? Infinity);
    }
    if (challenge.kind === 'build_route') {
      return new Set(battle.skillHistory?.map(({ element }) => element) ?? []).size === 3;
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
  const completedChallengeIds = Array.from(
    new Set([...profile.completedChallengeIds, ...completed.map((challenge) => challenge.id)]),
  );
  const record = rewarded.questRecords[rewards.questId]!;
  const discoveredCoreIds = Array.from(
    new Set([
      ...profile.discoveredCoreIds,
      ...rewards.items.flatMap((item) =>
        item.cores?.length ? item.cores.map(({ id }) => id) : item.coreId ? [item.coreId] : [],
      ),
    ]),
  );
  const discoveredEquipmentIds = Array.from(
    new Set([...profile.discoveredEquipmentIds, ...rewards.items.map((item) => item.baseId)]),
  );
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
      discoveredCoreIds,
      progressionEvents,
      questRecords: {
        ...rewarded.questRecords,
        [rewards.questId]: {
          ...record,
          bestChain: Math.max(
            record.bestChain ?? 0,
            battle.combo?.metrics.bestCommandCardCount ??
              Math.max(
                0,
                ...battle.events
                  .filter(({ kind }) => kind === 'relay')
                  .map(({ amount }) => amount ?? 0),
              ),
          ),
          ascendedClears: (record.ascendedClears ?? 0) + (battle.ascension ? 1 : 0),
        },
      },
    },
    newChallengeIds: newChallenges.map((challenge) => challenge.id),
  };
}
