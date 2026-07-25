import type { SpectacleCueId } from '../spectacle';

export type ComboTag = string;
export type ComboEffectTarget = 'self' | 'selected_enemy' | 'all_enemies' | 'lowest_hp_ally';

interface ComboEffectBase {
  target: ComboEffectTarget;
  amount: number;
}

export interface ComboDamageEffect extends ComboEffectBase {
  kind: 'damage';
}

export interface ComboHealEffect extends ComboEffectBase {
  kind: 'heal';
}

export interface ComboShieldEffect extends ComboEffectBase {
  kind: 'shield';
}

export type ComboEffectDefinition = ComboDamageEffect | ComboHealEffect | ComboShieldEffect;

export interface ComboCardDefinition {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  cueId?: SpectacleCueId;
  requiresTags?: readonly ComboTag[];
  emitsTags: readonly ComboTag[];
  effects: readonly ComboEffectDefinition[];
}

export type CardCatalog = Readonly<Record<string, ComboCardDefinition>>;
