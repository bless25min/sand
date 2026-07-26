import type { GuildGameContent, QuestRecord } from '@expedition/shared-types';

type CampaignZoneStatus = 'locked' | 'active' | 'cleared';

export interface CampaignZoneProgress {
  id: string;
  status: CampaignZoneStatus;
  clearedQuestCount: number;
  totalQuestCount: number;
  currentQuestId?: string;
}

interface CampaignProgressInput {
  content: GuildGameContent;
  unlockedQuestIds: readonly string[];
  questRecords: Readonly<Record<string, QuestRecord>>;
}

export function createCampaignProgressModel({
  content,
  unlockedQuestIds,
  questRecords,
}: CampaignProgressInput) {
  const unlocked = new Set(unlockedQuestIds);
  const clearedQuestCount = content.quests.filter((quest) => questRecords[quest.id]).length;
  const zones: readonly CampaignZoneProgress[] = content.zones.map((zone) => {
    const cleared = zone.questIds.filter((questId) => questRecords[questId]).length;
    const currentQuestId = zone.questIds.find(
      (questId) => unlocked.has(questId) && !questRecords[questId],
    );
    const status: CampaignZoneStatus =
      cleared === zone.questIds.length
        ? 'cleared'
        : zone.questIds.some((questId) => unlocked.has(questId))
          ? 'active'
          : 'locked';
    return {
      id: zone.id,
      status,
      clearedQuestCount: cleared,
      totalQuestCount: zone.questIds.length,
      ...(currentQuestId ? { currentQuestId } : {}),
    };
  });
  let lastClearedZoneIndex = -1;
  zones.forEach((zone, index) => {
    if (zone.status === 'cleared') lastClearedZoneIndex = index;
  });
  const complete = clearedQuestCount === content.quests.length;
  const currentQuestId = zones.find((zone) => zone.currentQuestId)?.currentQuestId;
  const transitionLabel =
    lastClearedZoneIndex >= 0 ? content.zones[lastClearedZoneIndex]?.transitionLabel : undefined;

  return {
    zones,
    clearedQuestCount,
    totalQuestCount: content.quests.length,
    complete,
    ...(currentQuestId ? { currentQuestId } : {}),
    ...(transitionLabel ? { transitionLabel } : {}),
    headline: complete
      ? `全戰役完破 · ${content.quests.length} 場無限重刷`
      : `戰役推進 · ${clearedQuestCount}/${content.quests.length}`,
  };
}
