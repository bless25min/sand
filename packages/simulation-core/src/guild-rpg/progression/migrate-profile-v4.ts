import type {
  EquipmentItem,
  EquipmentLoadout,
  GuildGameContent,
  GuildProfile,
  QuestRecord,
} from '@expedition/shared-types';

import { createGuildProfile } from '../profile/create-profile';
import { createOwnedSkill } from '../skills/create-owned-skill';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stringArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];

const numberRecord = (value: unknown) =>
  isRecord(value)
    ? Object.fromEntries(
        Object.entries(value).filter(
          (entry): entry is [string, number] =>
            typeof entry[1] === 'number' && Number.isFinite(entry[1]),
        ),
      )
    : {};

const legacyCards = (value: unknown) => {
  if (!isRecord(value)) return [];
  return [...new Set(Object.values(value).flatMap(stringArray))];
};

export function migrateProfileV4(value: unknown, content: GuildGameContent): GuildProfile {
  if (isRecord(value) && value.version === 4) return value as unknown as GuildProfile;

  const base = createGuildProfile(content);
  if (!isRecord(value) || ![1, 2, 3].includes(Number(value.version))) return base;
  const oldParty = Array.isArray(value.party) ? value.party.filter(isRecord) : [];
  const oldById = new Map(
    oldParty
      .filter((member) => typeof member.definitionId === 'string')
      .map((member) => [member.definitionId as string, member]),
  );
  const legacyEssence = oldParty.reduce((total, member) => {
    const level = typeof member.level === 'number' ? Math.max(1, member.level) : 1;
    const experience = typeof member.experience === 'number' ? Math.max(0, member.experience) : 0;
    return total + (level - 1) * 10 + experience;
  }, 0);
  const importedSkills = legacyCards(value.loadouts).map((cardId, index) => {
    const form = content.skillForms[index % content.skillForms.length]!;
    return createOwnedSkill({
      id: `legacy:${cardId}`,
      name: `舊技能轉化・${cardId}`,
      formId: form.id,
      content,
    });
  });
  const materials = numberRecord(value.materials);

  return {
    ...base,
    leaderId:
      typeof value.leaderId === 'string' &&
      content.adventurers.some(({ id }) => id === value.leaderId)
        ? value.leaderId
        : base.leaderId,
    party: base.party.map((member) => {
      const legacy = oldById.get(member.definitionId);
      return {
        ...member,
        equipment:
          legacy && isRecord(legacy.equipment)
            ? (legacy.equipment as EquipmentLoadout)
            : member.equipment,
      };
    }),
    skillInventory: [...base.skillInventory, ...importedSkills],
    inventory: Array.isArray(value.inventory)
      ? (value.inventory.filter(isRecord) as unknown as EquipmentItem[])
      : [],
    materials: {
      ...materials,
      legacy_essence: (materials.legacy_essence ?? 0) + legacyEssence,
    },
    gold: typeof value.gold === 'number' ? Math.max(200, value.gold) : base.gold,
    unlockedQuestIds: stringArray(value.unlockedQuestIds).length
      ? stringArray(value.unlockedQuestIds)
      : base.unlockedQuestIds,
    questRecords: isRecord(value.questRecords)
      ? (value.questRecords as Readonly<Record<string, QuestRecord>>)
      : {},
    nextLootSeed:
      typeof value.nextLootSeed === 'number' && Number.isFinite(value.nextLootSeed)
        ? value.nextLootSeed
        : 1,
    completedChallengeIds: stringArray(value.completedChallengeIds),
    discoveredEquipmentIds: stringArray(value.discoveredEquipmentIds),
    discoveredCoreIds: stringArray(value.discoveredCoreIds ?? value.discoveredRuleIds),
    forgeSequence:
      typeof value.forgeSequence === 'number' && Number.isFinite(value.forgeSequence)
        ? value.forgeSequence
        : 0,
    progressionEvents: [],
  };
}
