import type {
  GuildCodexCategory,
  GuildCodexEntry,
  GuildGameContent,
  GuildProfile,
} from '@expedition/shared-types';

const CATEGORIES: readonly GuildCodexCategory[] = [
  'enemy',
  'equipment',
  'rule',
  'build',
  'zone',
  'challenge',
];

export const CODEX_CATEGORY_LABEL: Readonly<Record<GuildCodexCategory, string>> = {
  enemy: '敵人',
  equipment: '裝備',
  rule: '規則',
  build: 'Build',
  zone: '區域',
  challenge: '挑戰',
};

function questCleared(profile: GuildProfile, questId: string) {
  return (profile.questRecords[questId]?.clears ?? 0) > 0;
}

export function isCodexEntryComplete(
  entry: GuildCodexEntry,
  profile: GuildProfile,
  content: GuildGameContent,
) {
  if (entry.category === 'enemy') {
    return content.quests.some(
      (quest) =>
        quest.enemies.some((enemy) => enemy.id === entry.refId) && questCleared(profile, quest.id),
    );
  }
  if (entry.category === 'equipment') {
    return profile.discoveredEquipmentIds.includes(entry.refId);
  }
  if (entry.category === 'rule') return profile.discoveredRuleIds.includes(entry.refId);
  if (entry.category === 'challenge') {
    return profile.completedChallengeIds.includes(entry.refId);
  }
  if (entry.category === 'zone') {
    const zone = content.zones.find((candidate) => candidate.id === entry.refId);
    return Boolean(zone?.questIds.every((questId) => questCleared(profile, questId)));
  }
  const routeChallenges = content.challenges.filter(
    (challenge) => challenge.kind === 'build_route' && challenge.requiredBuildId === entry.refId,
  );
  return routeChallenges.some((challenge) => profile.completedChallengeIds.includes(challenge.id));
}

export function createArchiveModel(profile: GuildProfile, content: GuildGameContent) {
  const categories = CATEGORIES.map((category) => {
    const entries = content.codexEntries.filter((entry) => entry.category === category);
    return {
      category,
      label: CODEX_CATEGORY_LABEL[category],
      complete: entries.filter((entry) => isCodexEntryComplete(entry, profile, content)).length,
      total: entries.length,
    };
  });
  const records = Object.values(profile.questRecords);
  const values = (key: 'bestClearMs' | 'bestOverkill' | 'bestChain' | 'bestItemQuality') =>
    records.map((record) => record[key]).filter((value): value is number => value !== undefined);
  return {
    categories,
    complete: categories.reduce((sum, category) => sum + category.complete, 0),
    total: categories.reduce((sum, category) => sum + category.total, 0),
    campaignComplete: content.quests.every((quest) => questCleared(profile, quest.id)),
    records: {
      fastestClearMs: values('bestClearMs').sort((left, right) => left - right)[0],
      bestOverkill: Math.max(0, ...values('bestOverkill')),
      bestChain: Math.max(0, ...values('bestChain')),
      bestItemQuality: Math.max(0, ...values('bestItemQuality')),
      ascendedClears: records.reduce((sum, record) => sum + (record.ascendedClears ?? 0), 0),
    },
  };
}
