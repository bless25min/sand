import type { GuildProfile } from '@expedition/shared-types';

const GUILD_SAVE_KEY = 'expedition:guild-rpg:v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const SLOTS = new Set(['weapon', 'armor', 'accessory']);
const RARITIES = new Set(['common', 'uncommon', 'rare', 'epic', 'legendary']);
const STATS = new Set(['hp', 'attack', 'defense', 'speed', 'healing']);

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isModifier(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.stat === 'string' &&
    STATS.has(value.stat) &&
    isFiniteNumber(value.value)
  );
}

function isEquipment(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.baseId === 'string' &&
    typeof value.name === 'string' &&
    typeof value.slot === 'string' &&
    SLOTS.has(value.slot) &&
    typeof value.rarity === 'string' &&
    RARITIES.has(value.rarity) &&
    isModifier(value.mainStat) &&
    Array.isArray(value.affixes) &&
    value.affixes.every(isModifier) &&
    isFiniteNumber(value.sellValue) &&
    (value.ruleIds === undefined ||
      (Array.isArray(value.ruleIds) && value.ruleIds.every((ruleId) => typeof ruleId === 'string')))
  );
}

function isLoadout(value: unknown) {
  if (!isRecord(value)) return false;
  return Object.entries(value).every(
    ([slot, item]) => SLOTS.has(slot) && (item === undefined || isEquipment(item)),
  );
}

function isQuestRecords(value: unknown) {
  if (!isRecord(value)) return false;
  return Object.values(value).every(
    (record) =>
      isRecord(record) &&
      isFiniteNumber(record.clears) &&
      (record.bestClearMs === undefined || isFiniteNumber(record.bestClearMs)),
  );
}

function isValidProfile(value: unknown): value is GuildProfile {
  if (!isRecord(value)) return false;
  if (value.version !== 1 || !Array.isArray(value.party) || value.party.length !== 3) return false;
  if (
    typeof value.leaderId !== 'string' ||
    !isFiniteNumber(value.gold) ||
    !isFiniteNumber(value.nextLootSeed) ||
    !Array.isArray(value.inventory) ||
    !value.inventory.every(isEquipment) ||
    !Array.isArray(value.unlockedQuestIds) ||
    !value.unlockedQuestIds.every((questId) => typeof questId === 'string') ||
    (value.selectedBuildId !== undefined && typeof value.selectedBuildId !== 'string') ||
    !isQuestRecords(value.questRecords)
  ) {
    return false;
  }
  return value.party.every(
    (member) =>
      isRecord(member) &&
      typeof member.definitionId === 'string' &&
      isFiniteNumber(member.level) &&
      member.level >= 1 &&
      isFiniteNumber(member.experience) &&
      isLoadout(member.equipment),
  );
}

export function serializeGuildSave(profile: GuildProfile) {
  return JSON.stringify(profile);
}

export function parseGuildSave(serialized: string | null): GuildProfile | undefined {
  if (!serialized) return undefined;
  try {
    const parsed: unknown = JSON.parse(serialized);
    return isValidProfile(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function loadGuildSave(storage: Pick<Storage, 'getItem'>) {
  return parseGuildSave(storage.getItem(GUILD_SAVE_KEY));
}

export function storeGuildSave(storage: Pick<Storage, 'setItem'>, profile: GuildProfile) {
  storage.setItem(GUILD_SAVE_KEY, serializeGuildSave(profile));
}
