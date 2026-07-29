import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { GuildProfile } from '@expedition/shared-types';
import { migrateProfileV5 } from '@expedition/simulation-core';

export const GUILD_SAVE_KEY = 'expedition:guild-rpg:v5';
export const GUILD_SAVE_BACKUP_KEY = 'expedition:guild-rpg:v4:backup';
const LEGACY_GUILD_SAVE_KEYS = [
  'expedition:guild-rpg:v4',
  'expedition:guild-rpg:v3',
  'expedition:guild-rpg:v2',
  'expedition:guild-rpg:v1',
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown) =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string');

const isEquipmentLoadout = (value: unknown) =>
  isRecord(value) &&
  Object.values(value).every(
    (item) =>
      item === undefined ||
      (isRecord(item) &&
        typeof item.id === 'string' &&
        typeof item.slot === 'string' &&
        isRecord(item.mainStat)),
  );

const isLegacyProfile = (value: unknown) =>
  isRecord(value) &&
  (value.version === 1 || value.version === 2 || value.version === 3) &&
  Array.isArray(value.party) &&
  value.party.length === 3 &&
  value.party.every(
    (member) =>
      isRecord(member) &&
      typeof member.definitionId === 'string' &&
      typeof member.level === 'number' &&
      typeof member.experience === 'number' &&
      isEquipmentLoadout(member.equipment),
  ) &&
  typeof value.leaderId === 'string' &&
  typeof value.gold === 'number' &&
  isStringArray(value.unlockedQuestIds) &&
  isRecord(value.questRecords);

const isCompleteProfile = (value: unknown, version: 4 | 5) =>
  isRecord(value) &&
  value.version === version &&
  typeof value.leaderId === 'string' &&
  Array.isArray(value.party) &&
  value.party.length === 6 &&
  value.party.every(
    (member) =>
      isRecord(member) &&
      typeof member.definitionId === 'string' &&
      isEquipmentLoadout(member.equipment) &&
      isStringArray(member.skillIds) &&
      member.skillIds.length === 6,
  ) &&
  isStringArray(value.defaultOrder) &&
  value.defaultOrder.length === 6 &&
  Array.isArray(value.skillInventory) &&
  Array.isArray(value.inventory) &&
  isRecord(value.materials) &&
  typeof value.gold === 'number' &&
  isStringArray(value.unlockedQuestIds) &&
  isRecord(value.questRecords) &&
  typeof value.nextLootSeed === 'number' &&
  isStringArray(value.completedChallengeIds) &&
  isStringArray(value.discoveredEquipmentIds) &&
  isStringArray(value.discoveredCoreIds) &&
  typeof value.forgeSequence === 'number' &&
  isRecord(value.forgeLocks) &&
  Array.isArray(value.progressionEvents);

const isV4Profile = (value: unknown) => isCompleteProfile(value, 4);
const isV5Profile = (value: unknown): value is GuildProfile => isCompleteProfile(value, 5);

export function serializeGuildSave(profile: GuildProfile) {
  return JSON.stringify(profile);
}

export function parseGuildSave(serialized: string | null): GuildProfile | undefined {
  if (!serialized) return undefined;
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (isV5Profile(parsed)) return migrateProfileV5(parsed, GUILD_GAME_CONTENT);
    if (isV4Profile(parsed)) return migrateProfileV5(parsed, GUILD_GAME_CONTENT);
    if (isLegacyProfile(parsed)) return migrateProfileV5(parsed, GUILD_GAME_CONTENT);
    return undefined;
  } catch {
    return undefined;
  }
}

export function loadGuildSave(
  storage: Pick<Storage, 'getItem'> & Partial<Pick<Storage, 'setItem'>>,
) {
  const current = parseGuildSave(storage.getItem(GUILD_SAVE_KEY));
  if (current) return current;

  for (const key of LEGACY_GUILD_SAVE_KEYS) {
    const source = storage.getItem(key);
    const migrated = parseGuildSave(source);
    if (!source || !migrated) continue;
    storage.setItem?.(GUILD_SAVE_BACKUP_KEY, source);
    storage.setItem?.(GUILD_SAVE_KEY, serializeGuildSave(migrated));
    return migrated;
  }
  return undefined;
}

export function storeGuildSave(storage: Pick<Storage, 'setItem'>, profile: GuildProfile) {
  storage.setItem(GUILD_SAVE_KEY, serializeGuildSave(profile));
}
