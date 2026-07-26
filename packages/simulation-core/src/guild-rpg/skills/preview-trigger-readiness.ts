import type { GuildBattleState, GuildSkillItem, TriggerCondition } from '@expedition/shared-types';

import { triggerMatches } from './resolve-trigger';

export type TriggerReadiness = 'ready' | 'pending-impact' | 'not-ready';

const IMPACT_TRIGGERS = new Set<TriggerCondition>([
  'after_skill',
  'on_repeat_hit',
  'on_bounce',
  'on_echo',
  'on_defeat',
  'on_overkill',
]);

export function previewTriggerReadiness(input: {
  battle: GuildBattleState;
  actorId: string;
  targetId: string;
  skill: GuildSkillItem;
}) {
  return input.skill.components.map((component) => {
    if (IMPACT_TRIGGERS.has(component.triggerId)) {
      return { componentId: component.id, readiness: 'pending-impact' as const };
    }
    const readiness = triggerMatches(component.triggerId, {
      battle: input.battle,
      actorId: input.actorId,
      targetId: input.targetId,
      element: component.element,
      hitIndex: 0,
      isBounce: false,
      isEcho: false,
      defeated: false,
      overkill: 0,
    })
      ? 'ready'
      : 'not-ready';
    return { componentId: component.id, readiness };
  });
}
