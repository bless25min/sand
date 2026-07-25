import type {
  ComboEvent,
  ComboRuleDefinition,
  ComboRuleEffect,
  GuildBattleState,
} from '@expedition/shared-types';

export interface RuleEffectContext {
  battle: GuildBattleState;
  rule: ComboRuleDefinition;
  effect: ComboRuleEffect;
  parentCausalId: string;
}

export interface RuleEffectResult {
  battle: GuildBattleState;
  events: readonly ComboEvent[];
}

export type RuleEffectResolver = (context: RuleEffectContext) => RuleEffectResult;
