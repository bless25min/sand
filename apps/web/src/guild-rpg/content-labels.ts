import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type {
  GuildElement,
  GuildEquipmentSlot,
  GuildItemRarity,
  SkillSpecialization,
  TriggerCondition,
} from '@expedition/shared-types';

export const elementName = (id: GuildElement) =>
  GUILD_GAME_CONTENT.elements.find((entry) => entry.id === id)?.name ?? id;

export const specializationName = (id: SkillSpecialization) =>
  GUILD_GAME_CONTENT.skillSpecializations.find((entry) => entry.id === id)?.name ?? id;

export const triggerName = (id: TriggerCondition) =>
  GUILD_GAME_CONTENT.triggerConditions.find((entry) => entry.id === id)?.name ?? id;

export const equipmentSlotName = (slot: GuildEquipmentSlot) =>
  ({ weapon: '武器', armor: '護甲', accessory: '飾品' })[slot];

export const rarityName = (rarity: GuildItemRarity) =>
  ({
    common: '普通',
    uncommon: '精良',
    rare: '稀有',
    epic: '史詩',
    legendary: '傳奇',
  })[rarity];
