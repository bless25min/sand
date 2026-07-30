import type {
  GuildBattleState,
  GuildGameContent,
  GuildProfile,
  HuntRewards,
} from '@expedition/shared-types';
import {
  applyHuntProgression,
  calculateHuntRewards,
  createSeededRandom,
} from '@expedition/simulation-core';

export interface HuntResult {
  profile: GuildProfile;
  rewards: HuntRewards;
  newChallengeIds: readonly string[];
  recordHighlights: readonly string[];
  message: string;
}

function createRecordHighlights(
  before: GuildProfile,
  after: GuildProfile,
  battle: GuildBattleState,
) {
  const previous = before.questRecords[battle.questId];
  const current = after.questRecords[battle.questId];
  if (!current) return [];
  const highlights: string[] = [];
  if ((current.bestOverkill ?? 0) > (previous?.bestOverkill ?? 0)) {
    highlights.push(`最高 OVERKILL ${current.bestOverkill}`);
  }
  if ((current.bestChain ?? 0) > (previous?.bestChain ?? 0)) {
    highlights.push(`最長連鎖 ${current.bestChain}`);
  }
  if ((current.bestItemQuality ?? 0) > (previous?.bestItemQuality ?? 0)) {
    highlights.push(`裝備品質 ${current.bestItemQuality}`);
  }
  if (battle.ascension && (current.ascendedClears ?? 0) > (previous?.ascendedClears ?? 0)) {
    highlights.push(`${battle.ascension.name}制霸 ${current.ascendedClears}`);
  }
  return highlights;
}

export function reduceHuntResult(
  profile: GuildProfile,
  battle: GuildBattleState,
  content: GuildGameContent,
): HuntResult | undefined {
  if (battle.status === 'active') return undefined;
  const hunt = content.hunts.find((candidate) => candidate.questId === battle.questId);
  if (!hunt) throw new Error(`Unknown hunt for quest: ${battle.questId}`);
  const rewards = calculateHuntRewards(
    { profile, battle, hunt, equipmentAffixes: content.equipmentAffixes, content },
    createSeededRandom(`${battle.seed}:hunt-loot`),
  );
  const progression = applyHuntProgression(profile, battle, rewards, content);
  return {
    rewards,
    profile: progression.profile,
    newChallengeIds: progression.newChallengeIds,
    recordHighlights: createRecordHighlights(profile, progression.profile, battle),
    message: rewards.successful
      ? `狩獵完成：獲得 ${rewards.items.length} 件裝備、${rewards.skillDrops.length} 張技能與 ${rewards.gold} 金幣。${
          progression.newChallengeIds.length > 0
            ? ` 新完成 ${progression.newChallengeIds.length} 項爽感挑戰！`
            : ''
        }`
      : '狩獵失敗：帶回已採集的敵人材料，裝備掉落未解鎖。',
  };
}
