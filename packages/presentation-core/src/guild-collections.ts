import type {
  EquipmentItem,
  GuildEquipmentSlot,
  GuildGameContent,
  GuildProfile,
  GuildSkillItem,
} from '@expedition/shared-types';

const PAGE_SIZE = 6;
const EQUIPMENT_SLOTS = [
  'weapon',
  'armor',
  'accessory',
] as const satisfies readonly GuildEquipmentSlot[];

const heroModels = (profile: GuildProfile, content: GuildGameContent, selectedHeroId: string) =>
  profile.defaultOrder.map((id) => {
    const definition = content.adventurers.find((candidate) => candidate.id === id);
    if (!definition) throw new Error(`Unknown adventurer ${id}`);
    return { id, name: definition.name, selected: id === selectedHeroId };
  });

const skillSummary = (skill: GuildSkillItem, content: GuildGameContent) => {
  const component = skill.components[0];
  const element = content.elements.find(({ id }) => id === component.element);
  const specialization = content.skillSpecializations.find(
    ({ id }) => id === component.specializationId,
  );
  const trigger = content.triggerConditions.find(({ id }) => id === component.triggerId);
  return {
    id: skill.id,
    name: skill.name,
    stars: skill.stars,
    element: component.element,
    elementName: element?.name ?? component.element,
    specialization: specialization?.name ?? component.specializationId,
    trigger: trigger?.name ?? component.triggerId,
    components: skill.components.map((entry) => ({
      id: entry.id,
      power: entry.power,
      layers: entry.layerStrength,
      addition: entry.triggerAddition,
      repeats: entry.repeatCount,
      triggerId: entry.triggerId,
    })),
  };
};

export function createSkillPageModel(
  profile: GuildProfile,
  content: GuildGameContent,
  options: {
    heroId: string;
    slotIndex: number;
    page: number;
    element?: string;
    stars?: number;
  },
) {
  const member = profile.party.find(({ definitionId }) => definitionId === options.heroId);
  if (!member) throw new Error(`Unknown party member ${options.heroId}`);
  const filtered = profile.skillInventory.filter(
    (skill) =>
      (!options.element || skill.components.some(({ element }) => element === options.element)) &&
      (!options.stars || skill.stars === options.stars),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.max(0, Math.min(pageCount - 1, options.page));
  return {
    heroes: heroModels(profile, content, options.heroId),
    selectedHero: heroModels(profile, content, options.heroId).find(({ selected }) => selected)!,
    slots: member.skillIds.map((skillId, index) => {
      const skill = profile.skillInventory.find(({ id }) => id === skillId);
      return {
        index,
        selected: index === options.slotIndex,
        skill: skill ? skillSummary(skill, content) : undefined,
      };
    }),
    skills: filtered
      .slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
      .map((skill) => skillSummary(skill, content)),
    page,
    pageCount,
    total: filtered.length,
  };
}

export function createFusionPageModel(profile: GuildProfile, selectedIds: readonly string[]) {
  const equipped = new Set(profile.party.flatMap(({ skillIds }) => skillIds));
  const summarize = (skill: GuildSkillItem) => ({
    id: skill.id,
    name: skill.name,
    stars: skill.stars,
    element: skill.components[0].element,
    equipped: equipped.has(skill.id),
    selected: selectedIds.includes(skill.id),
    components: skill.components.map(({ id, triggerId }) => ({ id, triggerId })),
  });
  return {
    candidates: profile.skillInventory
      .filter((skill) => skill.stars === 1 && !equipped.has(skill.id))
      .map(summarize),
    fused: profile.skillInventory.filter((skill) => skill.stars > 1).map(summarize),
    selectedCount: selectedIds.length,
    canFuse: selectedIds.length >= 2 && selectedIds.length <= 3,
  };
}

const compareItem = (item: EquipmentItem, equipped?: EquipmentItem) => {
  if (!equipped) return '目前欄位空白';
  if (equipped.mainStat.stat !== item.mainStat.stat) {
    return `${equipped.mainStat.stat} → ${item.mainStat.stat}`;
  }
  const difference = item.mainStat.value - equipped.mainStat.value;
  return `相較目前 ${difference >= 0 ? '+' : ''}${difference}`;
};

export function createEquipmentPageModel(
  profile: GuildProfile,
  content: GuildGameContent,
  options: { heroId: string; page: number; selectedSalvageIds: readonly string[] },
) {
  const member = profile.party.find(({ definitionId }) => definitionId === options.heroId);
  if (!member) throw new Error(`Unknown party member ${options.heroId}`);
  const pageCount = Math.max(1, Math.ceil(profile.inventory.length / PAGE_SIZE));
  const page = Math.max(0, Math.min(pageCount - 1, options.page));
  return {
    heroes: heroModels(profile, content, options.heroId),
    slots: EQUIPMENT_SLOTS.map((slot) => ({ slot, item: member.equipment[slot] })),
    items: profile.inventory.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE).map((item) => ({
      ...item,
      comparison: compareItem(item, member.equipment[item.slot]),
      selectedForSalvage: options.selectedSalvageIds.includes(item.id),
      protected: Boolean(item.locked || item.favorite),
    })),
    page,
    pageCount,
    total: profile.inventory.length,
  };
}
