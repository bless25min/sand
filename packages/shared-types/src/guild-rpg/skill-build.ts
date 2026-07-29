export type GuildElement = 'fire' | 'grass' | 'water';
export type StatusLayer = 'burn' | 'poison' | 'tide';
export type QualityRank = 1 | 2 | 3 | 4 | 5;

export type SkillSpecialization =
  'blast' | 'stack' | 'weaken' | 'chain' | 'empower' | 'multistrike';

export type TriggerCondition =
  | 'battle_open'
  | 'round_open'
  | 'first_actor'
  | 'final_actor'
  | 'after_skill'
  | 'target_burning'
  | 'target_poisoned'
  | 'target_tide'
  | 'actor_strengthened'
  | 'target_weakened'
  | 'layer_threshold'
  | 'consume_burn'
  | 'consume_poison'
  | 'consume_tide'
  | 'consume_all_burn'
  | 'consume_all_poison'
  | 'consume_all_tide'
  | 'consume_mixed'
  | 'on_hit'
  | 'on_repeat_hit'
  | 'on_bounce'
  | 'on_echo'
  | 'on_defeat'
  | 'on_overkill'
  | 'previous_fire'
  | 'previous_grass'
  | 'previous_water'
  | 'ally_same_element'
  | 'team_three_elements'
  | 'lone_target';

export interface IntegerRollRange {
  min: number;
  max: number;
}

export interface GuildElementDefinition {
  id: GuildElement;
  name: string;
  status: StatusLayer;
  fantasy: string;
  layerRoll: IntegerRollRange;
}

export interface SkillSpecializationDefinition {
  id: SkillSpecialization;
  name: string;
  description: string;
  powerRoll: IntegerRollRange;
  repeatRoll: IntegerRollRange;
}

export type TriggerFamily = 'timing' | 'status' | 'consume' | 'impact' | 'relay';

export interface TriggerConditionDefinition {
  id: TriggerCondition;
  family: TriggerFamily;
  name: string;
  description: string;
  additionRoll: IntegerRollRange;
}

export interface SkillFormDefinition {
  id: string;
  name: string;
  element: GuildElement;
  specializationId: SkillSpecialization;
  triggerId: TriggerCondition;
}

export interface SkillComponent {
  id: string;
  qualityRank: QualityRank;
  formId: string;
  element: GuildElement;
  specializationId: SkillSpecialization;
  triggerId: TriggerCondition;
  power: number;
  layerStrength: number;
  triggerAddition: number;
  repeatCount: number;
}

export interface OwnedSkill {
  id: string;
  name: string;
  stars: 1;
  components: readonly [SkillComponent];
  sourceHuntId?: string;
}

export interface FusedSkill {
  id: string;
  name: string;
  stars: 2 | 3;
  components:
    | readonly [SkillComponent, SkillComponent]
    | readonly [SkillComponent, SkillComponent, SkillComponent];
  sourceSkills: readonly [OwnedSkill, OwnedSkill] | readonly [OwnedSkill, OwnedSkill, OwnedSkill];
}

export type GuildSkillItem = OwnedSkill | FusedSkill;

export interface SkillDropPool {
  id: string;
  elements: readonly GuildElement[];
  specializationIds: readonly SkillSpecialization[];
  triggerIds: readonly TriggerCondition[];
}

export type StatusLayers = Readonly<Record<StatusLayer, number>>;

export interface RoundOrder {
  defaultOrder: readonly string[];
  currentOrder: readonly string[];
  actedIds: readonly string[];
  activeAdventurerId?: string;
  carryCurrentOrder: boolean;
}

export interface SkillHistoryEntry {
  actorId: string;
  skillId: string;
  element: GuildElement;
  roundIndex: number;
}

export interface EquipmentCoreDefinition {
  id: string;
  name: string;
  description: string;
  element?: GuildElement;
  specializationId?: SkillSpecialization;
  triggerId?: TriggerCondition;
}
