export interface CommandDraft {
  cardIds: readonly string[];
}

export interface CompiledCommandStep {
  cardId: string;
  causalId: string;
  emittedTags: readonly string[];
}

export interface CompiledCommand {
  cardIds: readonly string[];
  steps: readonly CompiledCommandStep[];
  diagnostics: readonly string[];
}

export type ComboEventKind =
  | 'card_played'
  | 'damage'
  | 'healing'
  | 'shield'
  | 'unit_defeated'
  | 'overkill'
  | 'boss_phase'
  | 'enemy_pressure'
  | 'rule_triggered'
  | 'infinite_engine'
  | 'victory'
  | 'defeat';

export interface ComboEvent {
  id: number;
  causalId: string;
  parentCausalId?: string;
  kind: ComboEventKind;
  message: string;
  actorId?: string;
  targetId?: string;
  amount?: number;
  phaseId?: string;
  cueId?: string;
}

export interface ComboMetrics {
  comboCount: number;
  totalDamage: number;
  totalOverkill: number;
  defeatedEnemyIds: readonly string[];
  annihilationOverflow: number;
}

export interface ComboRuntimeState {
  phase: 'composing' | 'resolving' | 'complete';
  draft: CommandDraft;
  availableCardIds: readonly string[];
  events: readonly ComboEvent[];
  metrics: ComboMetrics;
  activatedBossPhaseIds?: readonly string[];
  lastCommandEventStartIndex?: number;
  lastCommandEnemyStartHpRatios?: Readonly<Record<string, number>>;
}
