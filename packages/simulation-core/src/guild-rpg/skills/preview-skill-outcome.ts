import type {
  BattleUnit,
  GuildBattleEvent,
  StatusLayers,
  TriggerCondition,
} from '@expedition/shared-types';

import { resolveSkill, type ResolveSkillInput } from './resolve-skill';
import { previewTriggerReadiness, type TriggerReadiness } from './preview-trigger-readiness';

const emptyLayers = (): StatusLayers => ({ burn: 0, poison: 0, tide: 0 });

const eventTotal = (
  events: readonly GuildBattleEvent[],
  kinds: ReadonlySet<GuildBattleEvent['kind']>,
  targetId?: string,
) =>
  events
    .filter(
      (event) => kinds.has(event.kind) && (targetId === undefined || event.targetId === targetId),
    )
    .reduce((sum, event) => sum + (event.amount ?? 0), 0);

export interface SkillOutcomeUnitPreview {
  id: string;
  side: BattleUnit['side'];
  beforeHp: number;
  afterHp: number;
  maxHp: number;
  damage: number;
  healing: number;
  beforeStatus: StatusLayers;
  afterStatus: StatusLayers;
  beforeDefenseReduction: number;
  afterDefenseReduction: number;
  beforeStrengthened: number;
  afterStrengthened: number;
  defeated: boolean;
}

export interface SkillOutcomePreview {
  actorId: string;
  skillId: string;
  targetId: string;
  events: readonly GuildBattleEvent[];
  totalDamage: number;
  totalHealing: number;
  overkill: number;
  damageSegments: number;
  chaseSegments: number;
  comboSteps: readonly SkillComboStepPreview[];
  nextRelay?: SkillNextRelayPreview | undefined;
  units: readonly SkillOutcomeUnitPreview[];
}

export interface SkillComboStepPreview {
  componentId: string;
  triggerId: TriggerCondition;
  readiness: TriggerReadiness;
  damageSegments: number;
  chaseSegments: number;
  chaseDamage: number;
}

export interface SkillNextRelayPreview {
  actorId: string;
  newlyReadySkillIds: readonly string[];
}

const damageEvents = (events: readonly GuildBattleEvent[]) =>
  events.filter(
    ({ kind, amount }) => (kind === 'damage' || kind === 'reaction') && (amount ?? 0) > 0,
  );

const readyCount = (
  battle: ResolveSkillInput['battle'],
  actorId: string,
  targetId: string,
  skill: ResolveSkillInput['content']['skills'][string],
) =>
  previewTriggerReadiness({ battle, actorId, targetId, skill }).filter(
    ({ readiness }) => readiness === 'ready',
  ).length;

const unitPreview = (
  before: BattleUnit,
  after: BattleUnit,
  events: readonly GuildBattleEvent[],
): SkillOutcomeUnitPreview => ({
  id: before.id,
  side: before.side,
  beforeHp: before.currentHp,
  afterHp: after.currentHp,
  maxHp: before.stats.hp,
  damage: eventTotal(events, new Set(['damage', 'reaction']), before.id),
  healing: Math.max(0, after.currentHp - before.currentHp),
  beforeStatus: before.statusLayers ?? emptyLayers(),
  afterStatus: after.statusLayers ?? emptyLayers(),
  beforeDefenseReduction: before.defenseReduction ?? 0,
  afterDefenseReduction: after.defenseReduction ?? 0,
  beforeStrengthened: before.strengthened ?? 0,
  afterStrengthened: after.strengthened ?? 0,
  defeated: before.currentHp > 0 && after.currentHp <= 0,
});

export function previewSkillOutcome(input: ResolveSkillInput): SkillOutcomePreview {
  const resolved = resolveSkill(input);
  const skill = input.content.skills[input.skillId]!;
  const readiness = new Map<string, TriggerReadiness>(
    previewTriggerReadiness({
      battle: input.battle,
      actorId: input.actorId,
      targetId: input.targetId,
      skill,
    }).map((entry) => [entry.componentId, entry.readiness]),
  );
  const chaseCausalIds = new Set(
    resolved.events
      .filter(
        ({ kind, causalId }) =>
          Boolean(causalId) && (kind === 'triggered' || kind === 'core_triggered'),
      )
      .map(({ causalId }) => causalId!),
  );
  const comboSteps = skill.components.map((component): SkillComboStepPreview => {
    const events = resolved.events.filter(({ componentId }) => componentId === component.id);
    const segments = damageEvents(events);
    const chases = segments.filter(
      ({ parentCausalId }) => parentCausalId !== undefined && chaseCausalIds.has(parentCausalId),
    );
    return {
      componentId: component.id,
      triggerId: component.triggerId,
      readiness: readiness.get(component.id) ?? 'not-ready',
      damageSegments: segments.length,
      chaseSegments: chases.length,
      chaseDamage: chases.reduce((sum, { amount = 0 }) => sum + amount, 0),
    };
  });
  const units = input.battle.units.map((before) => {
    const after = resolved.battle.units.find(({ id }) => id === before.id) ?? before;
    return unitPreview(before, after, resolved.events);
  });
  const allDamageEvents = damageEvents(resolved.events);
  const chaseEvents = allDamageEvents.filter(
    ({ parentCausalId }) => parentCausalId !== undefined && chaseCausalIds.has(parentCausalId),
  );
  const nextActorId = resolved.battle.roundOrder?.activeAdventurerId;
  const nextActor = resolved.battle.units.find(
    ({ id, side, currentHp }) => id === nextActorId && side === 'heroes' && currentHp > 0,
  );
  const afterTargetId = resolved.battle.selectedTargetId ?? input.targetId;
  const newlyReadySkillIds =
    nextActor?.skillIds.filter((skillId) => {
      const nextSkill = input.content.skills[skillId];
      if (!nextSkill) return false;
      return (
        readyCount(resolved.battle, nextActor.id, afterTargetId, nextSkill) >
        readyCount(input.battle, nextActor.id, input.targetId, nextSkill)
      );
    }) ?? [];
  return {
    actorId: input.actorId,
    skillId: input.skillId,
    targetId: input.targetId,
    events: resolved.events,
    totalDamage: eventTotal(resolved.events, new Set(['damage', 'reaction'])),
    totalHealing: units.reduce((sum, unit) => sum + unit.healing, 0),
    overkill: eventTotal(resolved.events, new Set(['overkill'])),
    damageSegments: allDamageEvents.length,
    chaseSegments: chaseEvents.length,
    comboSteps,
    ...(nextActor ? { nextRelay: { actorId: nextActor.id, newlyReadySkillIds } } : {}),
    units,
  };
}
