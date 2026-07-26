import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { GuildProfile } from '@expedition/shared-types';
import { validateBuildLoadout } from '@expedition/simulation-core';

const GUILD_SAVE_KEY = 'expedition:guild-rpg:v3';
const LEGACY_GUILD_SAVE_KEYS = ['expedition:guild-rpg:v2', 'expedition:guild-rpg:v1'] as const;

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
      (Array.isArray(value.ruleIds) &&
        value.ruleIds.every((ruleId) => typeof ruleId === 'string'))) &&
    (value.sourceEnemyId === undefined || typeof value.sourceEnemyId === 'string') &&
    (value.forgeMaterialId === undefined || typeof value.forgeMaterialId === 'string') &&
    (value.forgeRank === undefined || isFiniteNumber(value.forgeRank))
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
      (record.bestClearMs === undefined || isFiniteNumber(record.bestClearMs)) &&
      (record.bestOverkill === undefined || isFiniteNumber(record.bestOverkill)) &&
      (record.bestLootMultiplier === undefined || isFiniteNumber(record.bestLootMultiplier)) &&
      (record.bestItemQuality === undefined || isFiniteNumber(record.bestItemQuality)) &&
      (record.bestChain === undefined || isFiniteNumber(record.bestChain)) &&
      (record.ascendedClears === undefined || isFiniteNumber(record.ascendedClears)),
  );
}

function isMaterials(value: unknown) {
  return (
    isRecord(value) &&
    Object.values(value).every((quantity) => isFiniteNumber(quantity) && quantity >= 0)
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isLoadouts(value: unknown): value is Record<string, string[]> {
  return isRecord(value) && Object.values(value).every(isStringArray);
}

function isProgressionEvents(value: unknown): value is Array<{
  id: string;
  kind: 'forge' | 'challenge' | 'ascension';
  label: string;
  detail: string;
}> {
  return (
    Array.isArray(value) &&
    value.every(
      (event) =>
        isRecord(event) &&
        typeof event.id === 'string' &&
        (event.kind === 'forge' || event.kind === 'challenge' || event.kind === 'ascension') &&
        typeof event.label === 'string' &&
        typeof event.detail === 'string',
    )
  );
}

function isCompatibleProfile(value: unknown) {
  if (!isRecord(value)) return false;
  if (
    (value.version !== 1 && value.version !== 2 && value.version !== 3) ||
    !Array.isArray(value.party) ||
    value.party.length !== 3
  ) {
    return false;
  }
  if (
    typeof value.leaderId !== 'string' ||
    !isFiniteNumber(value.gold) ||
    !isFiniteNumber(value.nextLootSeed) ||
    !Array.isArray(value.inventory) ||
    !value.inventory.every(isEquipment) ||
    !Array.isArray(value.unlockedQuestIds) ||
    !value.unlockedQuestIds.every((questId) => typeof questId === 'string') ||
    (value.selectedBuildId !== undefined && typeof value.selectedBuildId !== 'string') ||
    (value.materials !== undefined && !isMaterials(value.materials)) ||
    !isQuestRecords(value.questRecords)
  ) {
    return false;
  }
  if (
    (value.version === 2 || value.version === 3) &&
    (typeof value.selectedBuildId !== 'string' || !isMaterials(value.materials))
  ) {
    return false;
  }
  if (
    value.version === 3 &&
    (!isLoadouts(value.loadouts) ||
      !isStringArray(value.completedChallengeIds) ||
      !isStringArray(value.discoveredEquipmentIds) ||
      !isStringArray(value.discoveredRuleIds) ||
      !isFiniteNumber(value.forgeSequence) ||
      !isProgressionEvents(value.progressionEvents))
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

function normalizeLoadouts(value: unknown) {
  const stored = isLoadouts(value) ? value : {};
  return Object.fromEntries(
    GUILD_GAME_CONTENT.builds.map((build) => {
      const candidate = stored[build.id];
      const valid =
        candidate !== undefined &&
        validateBuildLoadout(build, candidate, GUILD_GAME_CONTENT.cards).valid;
      return [build.id, valid ? [...candidate] : [...build.defaultCardIds]];
    }),
  );
}

function normalizeEquipmentMaterial<T extends { baseId: string; forgeMaterialId?: string }>(
  item: T,
): T {
  if (item.forgeMaterialId) return item;
  const materialId = GUILD_GAME_CONTENT.equipmentBases.find(
    (base) => base.id === item.baseId,
  )?.forgeMaterialId;
  return materialId ? { ...item, forgeMaterialId: materialId } : item;
}

export function serializeGuildSave(profile: GuildProfile) {
  return JSON.stringify(profile);
}

export function parseGuildSave(serialized: string | null): GuildProfile | undefined {
  if (!serialized) return undefined;
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!isCompatibleProfile(parsed) || !isRecord(parsed)) return undefined;
    const profile: GuildProfile = {
      ...(parsed as unknown as GuildProfile),
      version: 3,
      gold: Math.max(200, parsed.gold as number),
      inventory: (parsed.inventory as GuildProfile['inventory']).map(normalizeEquipmentMaterial),
      party: (parsed.party as GuildProfile['party']).map((member) => ({
        ...member,
        equipment: Object.fromEntries(
          Object.entries(member.equipment).map(([slot, item]) => [
            slot,
            item ? normalizeEquipmentMaterial(item) : item,
          ]),
        ),
      })),
      materials: isMaterials(parsed.materials)
        ? (parsed.materials as Readonly<Record<string, number>>)
        : {},
      selectedBuildId:
        typeof parsed.selectedBuildId === 'string' ? parsed.selectedBuildId : 'retaliation',
      loadouts: normalizeLoadouts(parsed.loadouts),
      completedChallengeIds: isStringArray(parsed.completedChallengeIds)
        ? [...new Set(parsed.completedChallengeIds)]
        : [],
      discoveredEquipmentIds: isStringArray(parsed.discoveredEquipmentIds)
        ? [...new Set(parsed.discoveredEquipmentIds)]
        : [],
      discoveredRuleIds: isStringArray(parsed.discoveredRuleIds)
        ? [...new Set(parsed.discoveredRuleIds)]
        : [],
      forgeSequence: isFiniteNumber(parsed.forgeSequence) ? parsed.forgeSequence : 0,
      progressionEvents: isProgressionEvents(parsed.progressionEvents)
        ? parsed.progressionEvents.slice(-20)
        : [],
    };
    const questIndexById = new Map(
      GUILD_GAME_CONTENT.quests.map((quest, index) => [quest.id, index]),
    );
    let furthestUnlockedIndex = 0;
    for (const questId of profile.unlockedQuestIds) {
      furthestUnlockedIndex = Math.max(furthestUnlockedIndex, questIndexById.get(questId) ?? 0);
    }
    for (const [questId, record] of Object.entries(profile.questRecords)) {
      if (record.clears <= 0) continue;
      const questIndex = questIndexById.get(questId);
      if (questIndex !== undefined) {
        furthestUnlockedIndex = Math.max(furthestUnlockedIndex, questIndex + 1);
      }
    }
    return {
      ...profile,
      unlockedQuestIds: GUILD_GAME_CONTENT.quests
        .slice(0, Math.min(furthestUnlockedIndex + 1, GUILD_GAME_CONTENT.quests.length))
        .map((quest) => quest.id),
    };
  } catch {
    return undefined;
  }
}

export function loadGuildSave(storage: Pick<Storage, 'getItem'>) {
  return [GUILD_SAVE_KEY, ...LEGACY_GUILD_SAVE_KEYS]
    .map((key) => parseGuildSave(storage.getItem(key)))
    .find((profile) => profile !== undefined);
}

export function storeGuildSave(storage: Pick<Storage, 'setItem'>, profile: GuildProfile) {
  storage.setItem(GUILD_SAVE_KEY, serializeGuildSave(profile));
}
