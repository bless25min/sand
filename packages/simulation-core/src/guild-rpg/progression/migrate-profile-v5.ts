import type {
  EquipmentItem,
  EquipmentLoadout,
  GuildGameContent,
  GuildProfile,
  GuildSkillItem,
  QualityRank,
  SkillComponent,
} from '@expedition/shared-types';

import { createGuildProfile } from '../profile/create-profile';
import { migrateProfileV4 } from './migrate-profile-v4';
import { clampQualityRank, QUALITY_RANK_BY_RARITY } from './quality-rank';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const toQualityRank = (value: number, min: number, max: number): QualityRank =>
  clampQualityRank(1 + Math.round((4 * (value - min)) / Math.max(1, max - min)));

const migrateComponent = (component: SkillComponent): SkillComponent => {
  if (component.qualityRank >= 1 && component.qualityRank <= 5) return component;
  const power = toQualityRank(component.power, 4, 14);
  const layerStrength = toQualityRank(component.layerStrength, 2, 5);
  const triggerAddition = toQualityRank(component.triggerAddition, 1, 12);
  const qualityRank = Math.max(power, layerStrength, triggerAddition) as QualityRank;
  return {
    ...component,
    qualityRank,
    power,
    layerStrength,
    triggerAddition,
    repeatCount: Math.max(1, Math.min(6, Math.round(component.repeatCount))),
  };
};

const migrateSkill = (skill: GuildSkillItem): GuildSkillItem =>
  ({
    ...skill,
    components: skill.components.map(migrateComponent),
    ...('sourceSkills' in skill
      ? { sourceSkills: skill.sourceSkills.map((source) => migrateSkill(source)) }
      : {}),
  }) as unknown as GuildSkillItem;

const migrateItem = (item: EquipmentItem): EquipmentItem => {
  const qualityRank = QUALITY_RANK_BY_RARITY[item.rarity];
  const clampStrength = (value: number) => Math.max(1, Math.min(qualityRank, Math.round(value)));
  const cores = item.cores?.map((core) => ({ ...core, strength: clampStrength(core.strength) }));
  return {
    ...item,
    qualityRank,
    mainStat: { ...item.mainStat, value: qualityRank },
    affixes: item.affixes.map((affix) => ({ ...affix, value: clampStrength(affix.value) })),
    ...(item.coreStrength !== undefined ? { coreStrength: clampStrength(item.coreStrength) } : {}),
    ...(cores ? { cores } : {}),
  };
};

const migrateLoadout = (loadout: EquipmentLoadout): EquipmentLoadout => ({
  ...(loadout.weapon ? { weapon: migrateItem(loadout.weapon) } : {}),
  ...(loadout.armor ? { armor: migrateItem(loadout.armor) } : {}),
  ...(loadout.accessory ? { accessory: migrateItem(loadout.accessory) } : {}),
});

export function migrateProfileV5(value: unknown, content: GuildGameContent): GuildProfile {
  if (isRecord(value) && value.version === 5) return value as unknown as GuildProfile;
  const legacy = isRecord(value) && value.version === 4 ? value : migrateProfileV4(value, content);
  if (!isRecord(legacy)) return createGuildProfile(content);
  const source = legacy as unknown as GuildProfile;
  return {
    ...source,
    version: 5,
    party: source.party.map((member) => ({
      ...member,
      equipment: migrateLoadout(member.equipment),
    })),
    skillInventory: source.skillInventory.map(migrateSkill),
    inventory: source.inventory.map(migrateItem),
  };
}
