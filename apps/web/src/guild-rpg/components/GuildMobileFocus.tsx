import type {
  AdventurerDefinition,
  BuildDefinition,
  EquipmentItem,
  GuildAdventurer,
  QuestDefinition,
  ZoneDefinition,
} from '@expedition/shared-types';
import { GUILD_GAME_CONTENT } from '@expedition/game-data';

import type { GuildMobilePage } from '../mobile/thumb-deck-model';
import { createHuntSensationModel } from '../presentation/hunt-sensation-model';
import type { CampaignZoneProgress } from '../presentation/campaign-progress-model';
import type { GuildRpgAction } from '../state/game-reducer';
import { AdventurerCard } from './AdventurerCard';
import { InventoryItemCard } from './InventoryItemCard';

interface GuildMobileFocusProps {
  page: GuildMobilePage;
  build: BuildDefinition;
  quest: QuestDefinition;
  zone: ZoneDefinition;
  zoneIndex: number;
  zoneProgress: CampaignZoneProgress;
  campaignClearedQuestCount: number;
  campaignTotalQuestCount: number;
  campaignComplete: boolean;
  questUnlocked: boolean;
  member: GuildAdventurer;
  hero: AdventurerDefinition;
  selectedBuildId: string;
  isLeader: boolean;
  visibleItems: readonly EquipmentItem[];
  selectedItemId?: string | undefined;
  dispatch: React.Dispatch<GuildRpgAction>;
}

export function GuildMobileFocus({
  page,
  build,
  quest,
  zone,
  zoneIndex,
  zoneProgress,
  campaignClearedQuestCount,
  campaignTotalQuestCount,
  campaignComplete,
  questUnlocked,
  member,
  hero,
  selectedBuildId,
  isLeader,
  visibleItems,
  selectedItemId,
  dispatch,
}: GuildMobileFocusProps) {
  if (page === 'build') {
    return (
      <article className="gr-card gr-mobile-build" data-build-accent={build.accent}>
        <p>{build.payoffLabel}</p>
        <h2>{build.name}</h2>
        <strong>{build.fantasy}</strong>
        <span>
          招牌路線：
          {build.signatureCardIds
            .map((cardId) => GUILD_GAME_CONTENT.cards[cardId]?.name ?? cardId)
            .join(' → ')}
        </span>
      </article>
    );
  }

  if (page === 'quest') {
    const sensation = createHuntSensationModel(quest.id, selectedBuildId, GUILD_GAME_CONTENT);
    const hunt = GUILD_GAME_CONTENT.hunts.find((candidate) => candidate.questId === quest.id)!;
    return (
      <article
        className={`gr-card gr-quest gr-mobile-campaign-card ${questUnlocked ? '' : 'is-locked'}`}
        data-zone-status={zoneProgress.status}
      >
        <div className="gr-mobile-campaign-card__route">
          <span>
            ZONE {zoneIndex + 1}/{GUILD_GAME_CONTENT.zones.length} · {zone.name}
          </span>
          <b>
            戰役 {campaignClearedQuestCount}/{campaignTotalQuestCount}
          </b>
        </div>
        <p>
          {campaignComplete
            ? '全戰役完破 · 無限重刷'
            : questUnlocked
              ? `建議 Lv.${quest.recommendedLevel}`
              : '尚未解鎖'}
        </p>
        <h2>{quest.name}</h2>
        <p>{quest.description}</p>
        <div className="gr-mobile-campaign-card__intel">
          <strong>{hunt.pressureLabel}</strong>
          <span>{hunt.counterBrief}</span>
          <span>處刑順序：{sensation.executionOrder.join(' → ')}</span>
          <span>專屬掉落：{sensation.exclusiveDropNames.join('、')}</span>
          {sensation.chestName && <b>殲滅寶箱：{sensation.chestName}</b>}
        </div>
      </article>
    );
  }

  if (page === 'party') {
    return (
      <AdventurerCard
        adventurer={member}
        definition={hero}
        isLeader={isLeader}
        onSetLeader={() => dispatch({ type: 'SET_LEADER', adventurerId: member.definitionId })}
      />
    );
  }

  if (visibleItems.length === 0) {
    return <div className="gr-empty">完成遠征並保留裝備後，物品會出現在這裡。</div>;
  }

  return (
    <div className="gr-mobile-inventory-pair">
      {visibleItems.map((item) => (
        <InventoryItemCard item={item} selected={item.id === selectedItemId} key={item.id} />
      ))}
    </div>
  );
}
