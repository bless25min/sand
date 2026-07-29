import type {
  EquipmentCoreDefinition,
  GuildElement,
  GuildGameContent,
  GuildProfile,
  GuildSkillItem,
  HuntEquipmentItem,
  QualityRank,
  SkillComponent,
  SkillSpecialization,
  TriggerCondition,
} from '@expedition/shared-types';

export interface LootRecommendation<T> {
  entry: T;
  links: number;
  explanation: string;
}

type LinkKey = GuildElement | SkillSpecialization;

const ELEMENT_REQUIREMENT: Partial<Record<TriggerCondition, GuildElement>> = {
  target_burning: 'fire',
  consume_burn: 'fire',
  consume_all_burn: 'fire',
  previous_fire: 'fire',
  target_poisoned: 'grass',
  consume_poison: 'grass',
  consume_all_poison: 'grass',
  previous_grass: 'grass',
  target_tide: 'water',
  consume_tide: 'water',
  consume_all_tide: 'water',
  previous_water: 'water',
};

const SPECIALIZATION_REQUIREMENT: Partial<Record<TriggerCondition, SkillSpecialization>> = {
  actor_strengthened: 'empower',
  target_weakened: 'weaken',
  layer_threshold: 'stack',
  on_repeat_hit: 'multistrike',
  on_bounce: 'chain',
  on_echo: 'chain',
  lone_target: 'chain',
  on_defeat: 'blast',
  on_overkill: 'blast',
};

const qualityOfSkill = (skill: GuildSkillItem): QualityRank =>
  Math.max(...skill.components.map(({ qualityRank }) => qualityRank)) as QualityRank;

const equippedSkills = (profile: GuildProfile) => {
  const equippedIds = new Set(profile.party.flatMap(({ skillIds }) => skillIds));
  return profile.skillInventory.filter(({ id }) => equippedIds.has(id));
};

const producedKeys = (component: SkillComponent): readonly LinkKey[] => [
  component.element,
  component.specializationId,
];

const requiredKeys = (triggerId: TriggerCondition): readonly LinkKey[] => [
  ...(ELEMENT_REQUIREMENT[triggerId] ? [ELEMENT_REQUIREMENT[triggerId]!] : []),
  ...(SPECIALIZATION_REQUIREMENT[triggerId] ? [SPECIALIZATION_REQUIREMENT[triggerId]!] : []),
];

const skillProduces = (skill: GuildSkillItem, keys: readonly LinkKey[]) =>
  skill.components.some((component) => producedKeys(component).some((key) => keys.includes(key)));

const skillNeeds = (skill: GuildSkillItem, keys: readonly LinkKey[]) =>
  skill.components.some((component) =>
    requiredKeys(component.triggerId).some((key) => keys.includes(key)),
  );

const coreKeys = (core: EquipmentCoreDefinition): readonly LinkKey[] => [
  ...(core.element ? [core.element] : []),
  ...(core.specializationId ? [core.specializationId] : []),
  ...(core.triggerId ? requiredKeys(core.triggerId) : []),
];

const equipmentLinks = (
  item: HuntEquipmentItem,
  skills: readonly GuildSkillItem[],
  content: GuildGameContent,
) => {
  const coreIds = item.cores?.map(({ id }) => id) ?? (item.coreId ? [item.coreId] : []);
  const keys = coreIds.flatMap((id) => {
    const core = content.equipmentCores.find((candidate) => candidate.id === id);
    return core ? coreKeys(core) : [];
  });
  return skills.filter((skill) => skillProduces(skill, keys)).length;
};

export function recommendEquipment(
  items: readonly HuntEquipmentItem[],
  profile: GuildProfile,
  content: GuildGameContent,
): LootRecommendation<HuntEquipmentItem> | undefined {
  const skills = equippedSkills(profile);
  const ranked = items
    .map((entry) => ({ entry, links: equipmentLinks(entry, skills, content) }))
    .sort(
      (left, right) =>
        right.links - left.links ||
        right.entry.qualityRank - left.entry.qualityRank ||
        right.entry.qualityScore - left.entry.qualityScore,
    );
  const best = ranked[0];
  if (!best) return undefined;
  return {
    ...best,
    explanation:
      best.links > 0
        ? `核心可接上 ${best.links} 個已配置技能`
        : '目前未形成連動，適合留作下一套組合',
  };
}

export function recommendSkill(
  skills: readonly GuildSkillItem[],
  profile: GuildProfile,
): LootRecommendation<GuildSkillItem> | undefined {
  const equipped = equippedSkills(profile);
  const ranked = skills
    .map((entry) => {
      const needs = entry.components.flatMap(({ triggerId }) => requiredKeys(triggerId));
      const produces = entry.components.flatMap(producedKeys);
      const incoming = equipped.filter((skill) => skillProduces(skill, needs)).length;
      const outgoing = equipped.filter((skill) => skillNeeds(skill, produces)).length;
      return { entry, links: incoming + outgoing, incoming, outgoing };
    })
    .sort(
      (left, right) =>
        right.links - left.links || qualityOfSkill(right.entry) - qualityOfSkill(left.entry),
    );
  const best = ranked[0];
  if (!best) return undefined;
  const clauses = [
    ...(best.incoming > 0 ? [`接上 ${best.incoming} 個已配置技能`] : []),
    ...(best.outgoing > 0 ? [`供給 ${best.outgoing} 個後續觸發`] : []),
  ];
  return {
    entry: best.entry,
    links: best.links,
    explanation: clauses.join('；') || '目前未形成連動，適合留作下一套組合',
  };
}
