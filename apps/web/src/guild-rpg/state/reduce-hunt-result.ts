import type {
  GuildBattleState,
  GuildGameContent,
  GuildProfile,
  HuntRewards,
} from '@expedition/shared-types';
import {
  applyQuestRewards,
  calculateHuntRewards,
  createSeededRandom,
} from '@expedition/simulation-core';

interface HuntResult {
  profile: GuildProfile;
  rewards: HuntRewards;
  message: string;
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
    { profile, battle, hunt, equipmentAffixes: content.equipmentAffixes },
    createSeededRandom(`${battle.seed}:hunt-loot`),
  );
  return {
    rewards,
    profile: applyQuestRewards(profile, rewards, content.quests),
    message: rewards.successful
      ? `狩獵完成：獲得 ${rewards.experience} 經驗、${rewards.gold} 金幣。`
      : '狩獵失敗：帶回已採集的敵人材料，裝備掉落未解鎖。',
  };
}
