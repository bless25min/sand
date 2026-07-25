import type { GuildBattleState } from '../battle-state';
import type { HuntDefinition } from '../hunt';
import type { CardCatalog } from './content';
import type { CommandDraft } from './runtime';
import type { RuleCatalog } from './rules';

export type ComboPreviewMilestone =
  'multi-kill' | 'chain-wipe' | 'boss-execution' | 'annihilation' | 'chest';

export interface PreviewComboCommandInput {
  battle: GuildBattleState;
  draft: CommandDraft;
  cards: CardCatalog;
  rules: RuleCatalog;
  hunt?: HuntDefinition;
}

export interface ComboCommandPreview {
  diagnostics: readonly string[];
  eventCount: number;
  totalDamage: number;
  defeatedEnemyIds: readonly string[];
  overkill: number;
  milestones: readonly ComboPreviewMilestone[];
}
