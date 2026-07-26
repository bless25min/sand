import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { useState } from 'react';

import { createInventoryThumbActions } from '../mobile/inventory-thumb-actions';
import { createBuildThumbActions } from '../mobile/build-thumb-actions';
import { createPartyThumbActions } from '../mobile/party-thumb-actions';
import { createQuestThumbActions } from '../mobile/quest-thumb-actions';
import { pageSlice, type GuildMobilePage } from '../mobile/thumb-deck-model';
import { createFirstHuntCoach } from '../onboarding/first-hunt-coach';
import { createCampaignProgressModel } from '../presentation/campaign-progress-model';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { GuildMobileFocus } from './GuildMobileFocus';
import { ThumbCommandDeck } from './ThumbCommandDeck';
import { ArchiveCommandCenter } from './ArchiveCommandCenter';
import { ForgeWorkbench } from './ForgeWorkbench';
import { LoadoutEditor } from './LoadoutEditor';

interface GuildMobileStageProps {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
  initialPage?: GuildMobilePage;
}

export function GuildMobileStage({ state, dispatch, initialPage }: GuildMobileStageProps) {
  const [utilityPanel, setUtilityPanel] = useState<'loadout' | 'forge' | 'archive'>();
  const campaign = createCampaignProgressModel({
    content: GUILD_GAME_CONTENT,
    unlockedQuestIds: state.profile.unlockedQuestIds,
    questRecords: state.profile.questRecords,
  });
  const [page, setPage] = useState<GuildMobilePage>(
    initialPage ?? (state.preferences.tutorial === 'active' ? 'build' : 'quest'),
  );
  const [buildIndex, setBuildIndex] = useState(() =>
    Math.max(
      0,
      GUILD_GAME_CONTENT.builds.findIndex((build) => build.id === state.profile.selectedBuildId),
    ),
  );
  const [questIndex, setQuestIndex] = useState(() =>
    Math.max(
      0,
      GUILD_GAME_CONTENT.quests.findIndex(
        (quest) => quest.id === (state.tutorialReplay ? 'border_pack' : campaign.currentQuestId),
      ),
    ),
  );
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
  const zoneIndex = GUILD_GAME_CONTENT.zones.findIndex((zone) => zone.questIds.includes(quest.id));
  const zone = GUILD_GAME_CONTENT.zones[zoneIndex]!;
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
    focusedBuildId: build.id,
    forgeSequence: state.profile.forgeSequence,
    draftCardIds: [],
    previewEventCount: 0,
    rewardItemCount: 0,
    resolvedItemCount: 0,
    hasBorderRecord: Boolean(state.profile.questRecords.border_pack),
    replaying: state.tutorialReplay,
    previewAcknowledged: state.tutorialPreviewAcknowledged,
    bossExecutionOpen: false,
    mobilePage: page,
  });

  const title =
    page === 'build'
      ? build.name
      : page === 'quest'
        ? quest.name
        : page === 'party'
          ? `${hero.name} · Lv.${member.level}`
          : (selectedItem?.name ?? '背包是空的');
  const baseActions =
    page === 'build'
      ? createBuildThumbActions({
          build,
          buildCount: GUILD_GAME_CONTENT.builds.length,
          activeBuildId: state.profile.selectedBuildId,
          dispatch,
          setBuildIndex,
          onOpenLoadout: () => setUtilityPanel('loadout'),
        })
      : page === 'quest'
        ? createQuestThumbActions({
            quest,
            questCount: GUILD_GAME_CONTENT.quests.length,
            unlocked,
            replay: Boolean(state.profile.questRecords[quest.id]),
            dispatch,
            setQuestIndex,
            onOpenArchive: () => setUtilityPanel('archive'),
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
  const actions =
    coach?.focusId === 'action:open-forge'
      ? [
          {
            id: 'open-forge',
            label: '開啟鍛造',
            detail: '第一次力量強化',
            slot: 'primary' as const,
            tone: 'primary' as const,
            onPress: () => setUtilityPanel('forge'),
          },
        ]
      : baseActions;

  return (
    <section className="gr-mobile-guild-stage" data-mobile-page={page}>
      <div className="gr-mobile-guild-stage__focus">
        <GuildMobileFocus
          page={page}
          build={build}
          quest={quest}
          zone={zone}
          zoneIndex={zoneIndex}
          zoneProgress={campaign.zones[zoneIndex]!}
          campaignClearedQuestCount={campaign.clearedQuestCount}
          campaignTotalQuestCount={campaign.totalQuestCount}
          campaignComplete={campaign.complete}
          questUnlocked={unlocked}
          member={member}
          hero={hero}
          selectedBuildId={state.profile.selectedBuildId}
          isLeader={member.definitionId === state.profile.leaderId}
          visibleItems={visibleItems}
          selectedItemId={selectedItem?.id}
          guided={Boolean(coach)}
          dispatch={dispatch}
          onOpenForge={() => setUtilityPanel('forge')}
        />
      </div>
      <ThumbCommandDeck
        ariaLabel="公會操作"
        eyebrow="RIGHT THUMB · GUILD"
        title={title}
        status={state.message}
        guide={coach}
        onSkipGuide={() => dispatch({ type: 'SET_TUTORIAL', tutorial: 'skipped' })}
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
      {utilityPanel && (
        <div className="gr-mobile-utility-overlay" role="dialog" aria-modal="true">
          {utilityPanel === 'loadout' ? (
            <LoadoutEditor
              state={state}
              dispatch={dispatch}
              onClose={() => setUtilityPanel(undefined)}
              onOpenSettings={() => {
                setUtilityPanel(undefined);
                dispatch({ type: 'SET_SETTINGS_OPEN', open: true });
              }}
            />
          ) : utilityPanel === 'forge' ? (
            <ForgeWorkbench
              state={state}
              dispatch={dispatch}
              onClose={() => setUtilityPanel(undefined)}
              guided={coach?.step === 'forge'}
              onGuidedForge={() => setUtilityPanel(undefined)}
            />
          ) : (
            <ArchiveCommandCenter
              state={state}
              dispatch={dispatch}
              onClose={() => setUtilityPanel(undefined)}
            />
          )}
        </div>
      )}
    </section>
  );
}
