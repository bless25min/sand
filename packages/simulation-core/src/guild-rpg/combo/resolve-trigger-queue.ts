import type {
  ComboEvent,
  ComboTriggerKind,
  TriggerQueueInput,
  TriggerQueueResult,
} from '@expedition/shared-types';

import { resolveRuleEffect } from './effect-registry';
import { applyInfiniteEngine, hasReachableTriggerCycle } from './infinite-engine';

interface QueuedTrigger {
  trigger: ComboTriggerKind;
  causalId: string;
  hasParent: boolean;
}

const TAG_TRIGGER: Readonly<Record<string, ComboTriggerKind | undefined>> = {
  hit: 'hit',
  critical: 'critical',
  block: 'block',
  heal_overflow: 'heal_overflow',
  killed: 'kill',
  overkill: 'overkill',
};

function initialQueue(input: TriggerQueueInput): QueuedTrigger[] {
  return [
    {
      trigger: 'command_start',
      causalId: `command-start:${input.battle.sequence}`,
      hasParent: false,
    },
    ...input.command.steps.flatMap((step): QueuedTrigger[] => [
      { trigger: 'card_played', causalId: step.causalId, hasParent: true },
      ...step.emittedTags.flatMap((tag): QueuedTrigger[] => {
        const trigger = TAG_TRIGGER[tag];
        return trigger ? [{ trigger, causalId: step.causalId, hasParent: true }] : [];
      }),
    ]),
  ];
}

export function resolveTriggerQueue(input: TriggerQueueInput): TriggerQueueResult {
  if (!input.battle.combo) return { battle: input.battle, events: [], infinite: false };
  const queue = initialQueue(input);
  if (
    hasReachableTriggerCycle(
      queue.map((entry) => entry.trigger),
      input.rules,
    )
  ) {
    const infinite = applyInfiniteEngine(input.battle);
    return { ...infinite, infinite: true };
  }

  let battle = input.battle;
  const emittedEvents: ComboEvent[] = [];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const source = queue.shift()!;
    for (const rule of Object.values(input.rules)) {
      if (rule.trigger !== source.trigger) continue;
      const reactionKey = `${source.causalId}:${source.trigger}:${rule.id}`;
      if (seen.has(reactionKey)) continue;
      seen.add(reactionKey);

      const runtime = battle.combo!;
      const ruleEvent: ComboEvent = {
        id: runtime.events.length,
        causalId: `rule:${rule.id}:${runtime.events.length}`,
        ...(source.hasParent ? { parentCausalId: source.causalId } : {}),
        kind: 'rule_triggered',
        message: `${rule.name}因 ${source.trigger} 觸發。`,
      };
      battle = {
        ...battle,
        combo: { ...runtime, events: [...runtime.events, ruleEvent] },
      };
      emittedEvents.push(ruleEvent);

      for (const effect of rule.effects) {
        const resolution = resolveRuleEffect({
          battle,
          rule,
          effect,
          parentCausalId: ruleEvent.causalId,
        });
        battle = resolution.battle;
        emittedEvents.push(...resolution.events);
      }
      for (const trigger of rule.emitsTriggers ?? []) {
        queue.push({ trigger, causalId: ruleEvent.causalId, hasParent: true });
      }
    }
  }

  return { battle, events: emittedEvents, infinite: false };
}
