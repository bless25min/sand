import type {
  ComboEvent,
  ComboTriggerKind,
  GuildBattleState,
  RuleCatalog,
} from '@expedition/shared-types';

export function hasReachableTriggerCycle(
  initialTriggers: readonly ComboTriggerKind[],
  rules: RuleCatalog,
): boolean {
  const visiting = new Set<ComboTriggerKind>();
  const visited = new Set<ComboTriggerKind>();

  const visit = (trigger: ComboTriggerKind): boolean => {
    if (visiting.has(trigger)) return true;
    if (visited.has(trigger)) return false;
    visiting.add(trigger);
    for (const rule of Object.values(rules)) {
      if (rule.trigger !== trigger) continue;
      for (const emitted of rule.emitsTriggers ?? []) {
        if (visit(emitted)) return true;
      }
    }
    visiting.delete(trigger);
    visited.add(trigger);
    return false;
  };

  return initialTriggers.some(visit);
}

export function applyInfiniteEngine(battle: GuildBattleState) {
  if (!battle.combo) return { battle, events: [] as readonly ComboEvent[] };
  const event: ComboEvent = {
    id: battle.combo.events.length,
    causalId: `infinite-engine:${battle.sequence}`,
    kind: 'infinite_engine',
    message: 'INFINITE ENGINE：正回饋閉環已轉換為最高溢出獎勵。',
    amount: 1_000,
  };
  return {
    battle: {
      ...battle,
      combo: {
        ...battle.combo,
        events: [...battle.combo.events, event],
        metrics: {
          ...battle.combo.metrics,
          totalOverkill: battle.combo.metrics.totalOverkill + 1_000,
          annihilationOverflow: battle.combo.metrics.annihilationOverflow + 1_000,
        },
      },
    },
    events: [event] as readonly ComboEvent[],
  };
}
