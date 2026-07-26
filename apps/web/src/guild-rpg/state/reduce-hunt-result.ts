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
  const progression = applyHuntProgression(profile, battle, rewards, content);
  return {
    rewards,
    profile: progression.profile,
    message: rewards.successful
      ? `狩獵完成：獲得 ${rewards.experience} 經驗、${rewards.gold} 金幣。${
          progression.newChallengeIds.length > 0
            ? ` 新完成 ${progression.newChallengeIds.length} 項爽感挑戰！`
            : ''
        }`
      : '狩獵失敗：帶回已採集的敵人材料，裝備掉落未解鎖。',
  };
}
