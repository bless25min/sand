import type { GuildBattleState } from '../battle-state';
import type { RuleCatalog } from './rules';
import type { ComboEvent, CompiledCommand } from './runtime';

export interface TriggerQueueInput {
  battle: GuildBattleState;
  command: CompiledCommand;
  rules: RuleCatalog;
}

export interface TriggerQueueResult {
  battle: GuildBattleState;
  events: readonly ComboEvent[];
  infinite: boolean;
}
