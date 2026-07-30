import type { GuildEquipmentSlot, GuildGameContent, GuildProfile } from '@expedition/shared-types';

export type GuildShellPage = 'quest' | 'party' | 'skills' | 'equipment';

const DESTINATIONS: readonly { id: GuildShellPage; label: string; shortLabel: string }[] = [
  { id: 'quest', label: '遠征', shortLabel: '戰' },
  { id: 'party', label: '隊伍', shortLabel: '隊' },
  { id: 'skills', label: '技能', shortLabel: '技' },
  { id: 'equipment', label: '裝備', shortLabel: '裝' },
];

export function resolveGuildShellLayout(viewport: { width: number; height: number }) {
  const mode = viewport.width < 720 ? 'mobile-portrait' : 'desktop-landscape';
  const headerHeight = mode === 'mobile-portrait' ? 64 : 58;
  const navigationHeight = mode === 'mobile-portrait' ? 72 : 82;
  return {
    mode,
    design: { width: viewport.width, height: viewport.height },
    header: { height: headerHeight },
    viewport: { height: Math.max(240, viewport.height - headerHeight - navigationHeight) },
    navigation: { height: navigationHeight, columns: 4 as const },
  };
}

export function createGuildShellModel(activePage: GuildShellPage) {
  return {
    activePage,
    destinations: DESTINATIONS.map((destination) => ({
      ...destination,
      selected: destination.id === activePage,
    })),
  };
}

export function createQuestPageModel(profile: GuildProfile, content: GuildGameContent) {
  const unlocked = new Set(profile.unlockedQuestIds);
  const completed = new Set(profile.completedChallengeIds);
  return {
    zones: content.zones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      subtitle: zone.subtitle,
      description: zone.description,
      quests: zone.questIds.map((questId) => {
        const quest = content.quests.find(({ id }) => id === questId);
        if (!quest) throw new Error(`Unknown quest ${questId}`);
        const record = profile.questRecords[questId];
        return {
          id: quest.id,
          name: quest.name,
          description: quest.description,
          unlocked: unlocked.has(quest.id),
          cleared: (record?.clears ?? 0) > 0,
          record,
          challenges: content.challenges
            .filter(({ questId: candidate }) => candidate === quest.id)
            .map((challenge) => ({
              id: challenge.id,
              name: challenge.name,
              description: challenge.description,
              rewardLabel: challenge.rewardLabel,
              complete: completed.has(challenge.id),
            })),
        };
      }),
    })),
    ascensions: content.ascensions.map((ascension) => ({
      id: ascension.id,
      name: ascension.name,
      description: ascension.description,
      routeLabel: ascension.routeLabel,
    })),
  };
}

const EQUIPMENT_SLOTS = [
  'weapon',
  'armor',
  'accessory',
] as const satisfies readonly GuildEquipmentSlot[];

export function createPartyPageModel(
  profile: GuildProfile,
  content: GuildGameContent,
  selectedHeroId: string,
) {
  const byId = new Map(profile.party.map((member) => [member.definitionId, member]));
  return {
    members: profile.defaultOrder.map((heroId, index) => {
      const member = byId.get(heroId);
      const definition = content.adventurers.find(({ id }) => id === heroId);
      if (!member || !definition) throw new Error(`Unknown party member ${heroId}`);
      return {
        id: heroId,
        name: definition.name,
        title: definition.title,
        role: definition.role,
        order: index + 1,
        selected: heroId === selectedHeroId,
        skillCount: member.skillIds.length,
        equipmentSlots: EQUIPMENT_SLOTS.map((slot) => ({
          slot,
          item: member.equipment[slot],
        })),
      };
    }),
  };
}
