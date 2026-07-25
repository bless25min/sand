import type { CardCatalog } from './content';

export const COMBO_EFFECT_KINDS = [
  'damage',
  'heal',
  'shield',
  'status',
  'repeat',
  'copy',
  'spread',
  'convert',
  'detonate',
  'summon',
] as const;
export const COMBO_TRIGGER_KINDS = [
  'command_start',
  'card_played',
  'hit',
  'critical',
  'block',
  'heal_overflow',
  'kill',
  'overkill',
] as const;
export const COMBO_SELECTOR_KINDS = [
  'self',
  'target',
  'all',
  'marked',
  'adjacent',
  'lowest_hp',
  'highest_hp',
  'last_killed',
] as const;
export const COMBO_TRANSFORM_KINDS = [
  'repeat',
  'fork',
  'ricochet',
  'pierce',
  'convert_element',
  'copy_next',
  'delay',
  'multiply',
] as const;

export type ComboRuleEffectKind = (typeof COMBO_EFFECT_KINDS)[number];
export type ComboTriggerKind = (typeof COMBO_TRIGGER_KINDS)[number];
export type ComboSelectorKind = (typeof COMBO_SELECTOR_KINDS)[number];
export type ComboTransformKind = (typeof COMBO_TRANSFORM_KINDS)[number];

export interface ComboRuleEffect {
  kind: ComboRuleEffectKind;
  amount?: number;
  statusId?: string;
}

export interface ComboRuleDefinition {
  id: string;
  name: string;
  description: string;
  trigger: ComboTriggerKind;
  selector: ComboSelectorKind;
  effects: readonly ComboRuleEffect[];
  transforms: readonly ComboTransformKind[];
  emitsTriggers?: readonly ComboTriggerKind[];
}

export type RuleCatalog = Readonly<Record<string, ComboRuleDefinition>>;

export interface BuildDefinition {
  id: string;
  name: string;
  description: string;
  cardIds: readonly string[];
  ruleIds: readonly string[];
}

export interface ComboContent {
  cards: CardCatalog;
  rules: RuleCatalog;
  builds: readonly BuildDefinition[];
}

export interface CompiledBuild {
  buildId: string;
  cardIds: readonly string[];
  ruleIds: readonly string[];
}

export interface ContentDiagnostic {
  code: string;
  path: string;
  message: string;
}
