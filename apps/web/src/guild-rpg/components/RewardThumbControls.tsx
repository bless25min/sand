import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { ItemChoice } from '@expedition/shared-types';
import { useState } from 'react';

import { wrapThumbIndex } from '../mobile/thumb-deck-model';
import { createFirstHuntCoach } from '../onboarding/first-hunt-coach';
import { createEquipmentSensationModel } from '../presentation/equipment-sensation-model';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { EquipmentCard } from './EquipmentCard';
import { ThumbCommandDeck, type ThumbDeckAction } from './ThumbCommandDeck';

interface RewardThumbControlsProps {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}

export function RewardThumbControls({ state, dispatch }: RewardThumbControlsProps) {
  const rewards = state.rewards!;
  const [itemIndex, setItemIndex] = useState(0);
  const [adventurerIndex, setAdventurerIndex] = useState(() => {
    const firstItem = rewards.items[0];
    const bestId = firstItem
      ? createEquipmentSensationModel(firstItem, state.profile, GUILD_GAME_CONTENT).bestAdventurer
          .id
      : state.profile.leaderId;
    return Math.max(
      0,
      state.profile.party.findIndex((member) => member.definitionId === bestId),
    );
  });
  const [sellConfirmationId, setSellConfirmationId] = useState<string>();
  const item = rewards.items[itemIndex];
  const adventurer = state.profile.party[adventurerIndex]!;
  const hero = GUILD_GAME_CONTENT.adventurers.find(
    (candidate) => candidate.id === adventurer.definitionId,
  )!;
  const allResolved = state.resolvedItemIds.length === rewards.items.length;
  const resolved = item ? state.resolvedItemIds.includes(item.id) : false;
  const coach = createFirstHuntCoach({
    tutorial: state.preferences.tutorial,
    screen: 'rewards',
    selectedBuildId: state.profile.selectedBuildId,
    ...(state.battle ? { questId: state.battle.questId } : {}),
    ...(state.battle?.selectedTargetId ? { selectedTargetId: state.battle.selectedTargetId } : {}),
    draftCardIds: [],
    previewEventCount: 0,
    rewardItemCount: rewards.items.length,
    resolvedItemCount: state.resolvedItemIds.length,
    hasBorderRecord: Boolean(state.profile.questRecords.border_pack),
    replaying: state.tutorialReplay,
    previewAcknowledged: state.tutorialPreviewAcknowledged,
    bossExecutionOpen: Boolean(
      state.battle?.combo?.activatedBossPhaseIds?.includes('alpha-execution'),
    ),
  });

  function nextItem() {
    if (rewards.items.length === 0) return;
    setSellConfirmationId(undefined);
    const nextIndex = wrapThumbIndex(itemIndex, rewards.items.length, 1);
    const next = rewards.items[nextIndex]!;
    const bestId = createEquipmentSensationModel(next, state.profile, GUILD_GAME_CONTENT)
      .bestAdventurer.id;
    setItemIndex(nextIndex);
    setAdventurerIndex(
      Math.max(
        0,
        state.profile.party.findIndex((member) => member.definitionId === bestId),
      ),
    );
  }

  function resolve(choice: ItemChoice) {
    if (!item) return;
    dispatch({
      type: 'CHOOSE_ITEM',
      itemId: item.id,
      choice,
      adventurerId: adventurer.definitionId,
    });
    nextItem();
  }

  let actions: readonly ThumbDeckAction[];
  if (allResolved || !item) {
    actions = [
      {
        id: 'return-guild',
        label: '返回公會',
        detail: '繼續整備',
        slot: 'primary',
        tone: 'primary',
        onPress: () => dispatch({ type: 'RETURN_GUILD' }),
      },
    ];
  } else {
    actions = [
      {
        id: 'equip',
        label: resolved ? '已處理' : '立即裝備',
        detail: `裝給${hero.name}`,
        slot: 'primary',
        tone: 'primary',
        disabled: resolved,
        onPress: () => resolve('equip'),
      },
      {
        id: 'keep',
        label: '放入背包',
        detail: `${state.profile.inventory.length}/20`,
        slot: 'secondary',
        disabled: resolved || state.profile.inventory.length >= 20,
        onPress: () => resolve('keep'),
      },
      {
        id: 'sell',
        label: sellConfirmationId === item.id ? '再次確認出售' : '出售',
        detail: `+${item.sellValue}G`,
        slot: 'utility',
        tone: 'danger',
        disabled: resolved,
        onPress: () => {
          if (sellConfirmationId === item.id) resolve('sell');
          else setSellConfirmationId(item.id);
        },
      },
      {
        id: 'next-item',
        label: '下一件',
        detail: `${itemIndex + 1}/${rewards.items.length}`,
        slot: 'choice-a',
        onPress: nextItem,
      },
      {
        id: 'next-hero',
        label: hero.name,
        detail: '比較對象',
        slot: 'choice-b',
        onPress: () =>
          setAdventurerIndex((current) => wrapThumbIndex(current, state.profile.party.length, 1)),
      },
    ];
  }

  return (
    <section className="gr-mobile-reward-stage">
      {item && (
        <EquipmentCard
          item={item}
          state={state}
          dispatch={dispatch}
          selectedAdventurerId={adventurer.definitionId}
          onAdventurerChange={(id) =>
            setAdventurerIndex(
              Math.max(
                0,
                state.profile.party.findIndex((member) => member.definitionId === id),
              ),
            )
          }
          hideActions
        />
      )}
      <ThumbCommandDeck
        ariaLabel="戰利品操作"
        eyebrow={allResolved ? 'LOOT COMPLETE' : `LOOT ${itemIndex + 1}/${rewards.items.length}`}
        title={allResolved || !item ? '戰利品已處理完成' : item.name}
        status={allResolved ? '可以返回公會' : `最佳裝備者：${hero.name}`}
        feedback={state.message}
        guide={coach}
        actions={actions}
      />
    </section>
  );
}
