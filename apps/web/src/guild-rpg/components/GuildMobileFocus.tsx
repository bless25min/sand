import type {
  AdventurerDefinition,
  EquipmentItem,
  GuildAdventurer,
  QuestDefinition,
} from '@expedition/shared-types';

import type { GuildMobilePage } from '../mobile/thumb-deck-model';
import type { GuildRpgAction } from '../state/game-reducer';
import { AdventurerCard } from './AdventurerCard';
import { InventoryItemCard } from './InventoryItemCard';

interface GuildMobileFocusProps {
  page: GuildMobilePage;
  quest: QuestDefinition;
  questUnlocked: boolean;
  member: GuildAdventurer;
  hero: AdventurerDefinition;
  isLeader: boolean;
  visibleItems: readonly EquipmentItem[];
  selectedItemId?: string | undefined;
  dispatch: React.Dispatch<GuildRpgAction>;
}

export function GuildMobileFocus({
  page,
  quest,
  questUnlocked,
  member,
  hero,
  isLeader,
  visibleItems,
  selectedItemId,
  dispatch,
}: GuildMobileFocusProps) {
  if (page === 'quest') {
    return (
      <article className={`gr-card gr-quest ${questUnlocked ? '' : 'is-locked'}`}>
        <p>{questUnlocked ? `建議 Lv.${quest.recommendedLevel}` : '尚未解鎖'}</p>
        <h2>{quest.name}</h2>
        <p>{quest.description}</p>
        <strong>{quest.enemies.length} 隊敵軍</strong>
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
