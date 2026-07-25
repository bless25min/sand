import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { useState } from 'react';

import { createInventoryThumbActions } from '../mobile/inventory-thumb-actions';
import { createBuildThumbActions } from '../mobile/build-thumb-actions';
import { createPartyThumbActions } from '../mobile/party-thumb-actions';
import { createQuestThumbActions } from '../mobile/quest-thumb-actions';
import { pageSlice, type GuildMobilePage } from '../mobile/thumb-deck-model';
import { createFirstHuntCoach } from '../onboarding/first-hunt-coach';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { GuildMobileFocus } from './GuildMobileFocus';
import { ThumbCommandDeck } from './ThumbCommandDeck';

interface GuildMobileStageProps {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
  initialPage?: GuildMobilePage;
}

export function GuildMobileStage({ state, dispatch, initialPage }: GuildMobileStageProps) {
  const [page, setPage] = useState<GuildMobilePage>(
    initialPage ?? (state.preferences.tutorial === 'active' ? 'build' : 'quest'),
  );
  const [buildIndex, setBuildIndex] = useState(() =>
    Math.max(
      0,
      GUILD_GAME_CONTENT.builds.findIndex((build) => build.id === state.profile.selectedBuildId),
    ),
  );
  const [questIndex, setQuestIndex] = useState(0);
  const [partyIndex, setPartyIndex] = useState(0);
  const [inventoryPage, setInventoryPage] = useState(0);
  const [itemIndex, setItemIndex] = useState(0);
  const [equipHeroIndex, setEquipHeroIndex] = useState(() =>
    Math.max(
      0,
      state.profile.party.findIndex((member) => member.definitionId === state.profile.leaderId),
    ),
  );

  const quest = GUILD_GAME_CONTENT.quests[questIndex]!;
  const build = GUILD_GAME_CONTENT.builds[buildIndex]!;
  const member = state.profile.party[partyIndex]!;
  const hero = GUILD_GAME_CONTENT.adventurers.find(
    (candidate) => candidate.id === member.definitionId,
  )!;
  const equipMember = state.profile.party[equipHeroIndex]!;
  const equipHero = GUILD_GAME_CONTENT.adventurers.find(
    (candidate) => candidate.id === equipMember.definitionId,
  )!;
  const inventoryPageCount = Math.max(1, Math.ceil(state.profile.inventory.length / 2));
  const safeInventoryPage = inventoryPage % inventoryPageCount;
  const visibleItems = pageSlice(state.profile.inventory, safeInventoryPage, 2);
  const selectedItem = visibleItems[itemIndex] ?? visibleItems[0];
  const unlocked = state.profile.unlockedQuestIds.includes(quest.id);
  const coach = createFirstHuntCoach({
    tutorial: state.preferences.tutorial,
    screen: 'guild',
    selectedBuildId: state.profile.selectedBuildId,
    draftCardIds: [],
    previewEventCount: 0,
    rewardItemCount: 0,
    resolvedItemCount: 0,
    hasBorderRecord: Boolean(state.profile.questRecords.border_pack),
    replaying: state.tutorialReplay,
    previewAcknowledged: state.tutorialPreviewAcknowledged,
    bossExecutionOpen: false,
  });

  const title =
    page === 'build'
      ? build.name
      : page === 'quest'
        ? quest.name
        : page === 'party'
          ? `${hero.name} · Lv.${member.level}`
          : (selectedItem?.name ?? '背包是空的');
  const actions =
    page === 'build'
      ? createBuildThumbActions({
          build,
          buildCount: GUILD_GAME_CONTENT.builds.length,
          activeBuildId: state.profile.selectedBuildId,
          dispatch,
          setBuildIndex,
        })
      : page === 'quest'
        ? createQuestThumbActions({
            quest,
            questCount: GUILD_GAME_CONTENT.quests.length,
            unlocked,
            replay: Boolean(state.profile.questRecords[quest.id]),
            dispatch,
            setQuestIndex,
          })
        : page === 'party'
          ? createPartyThumbActions({
              memberId: member.definitionId,
              heroName: hero.name,
              isLeader: member.definitionId === state.profile.leaderId,
              partyLength: state.profile.party.length,
              dispatch,
              setPartyIndex,
            })
          : createInventoryThumbActions({
              visibleItems,
              selectedItem,
              inventoryLength: state.profile.inventory.length,
              inventoryPage: safeInventoryPage,
              inventoryPageCount,
              equipHeroName: equipHero.name,
              equipMemberId: equipMember.definitionId,
              partyLength: state.profile.party.length,
              dispatch,
              setItemIndex,
              setInventoryPage,
              setEquipHeroIndex,
            });

  return (
    <section className="gr-mobile-guild-stage" data-mobile-page={page}>
      <div className="gr-mobile-guild-stage__focus">
        <GuildMobileFocus
          page={page}
          build={build}
          quest={quest}
          questUnlocked={unlocked}
          member={member}
          hero={hero}
          selectedBuildId={state.profile.selectedBuildId}
          isLeader={member.definitionId === state.profile.leaderId}
          visibleItems={visibleItems}
          selectedItemId={selectedItem?.id}
          dispatch={dispatch}
        />
      </div>
      <ThumbCommandDeck
        ariaLabel="公會操作"
        eyebrow="RIGHT THUMB · GUILD"
        title={title}
        status={coach?.message ?? state.message}
        tabs={[
          {
            id: 'build',
            label: 'Build',
            selected: page === 'build',
            onSelect: () => setPage('build'),
          },
          {
            id: 'quest',
            label: '任務',
            selected: page === 'quest',
            onSelect: () => setPage('quest'),
          },
          {
            id: 'party',
            label: '隊伍',
            selected: page === 'party',
            onSelect: () => setPage('party'),
          },
          {
            id: 'inventory',
            label: '背包',
            selected: page === 'inventory',
            onSelect: () => setPage('inventory'),
          },
        ]}
        actions={actions}
      />
    </section>
  );
}
