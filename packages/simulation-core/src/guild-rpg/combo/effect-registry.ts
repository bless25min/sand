import { COMBO_EFFECT_KINDS, type ComboRuleEffect } from '@expedition/shared-types';

import { resolveDamageEffect } from './effects/resolve-damage-effect';
import { resolveRoutingEffect } from './effects/resolve-routing-effect';
import type { RuleEffectContext, RuleEffectResolver, RuleEffectResult } from './rule-effect';

export const COMBO_EFFECT_REGISTRY = Object.fromEntries(
  COMBO_EFFECT_KINDS.map((kind) => [
    kind,
    kind === 'damage' ? resolveDamageEffect : resolveRoutingEffect,
  ]),
) as Readonly<Record<ComboRuleEffect['kind'], RuleEffectResolver>>;

export function resolveRuleEffect(context: RuleEffectContext): RuleEffectResult {
  return COMBO_EFFECT_REGISTRY[context.effect.kind](context);
}
