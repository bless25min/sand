import type {
  BattleUnit,
  EnemyPressureIntent,
  GuildBattleEvent,
  StatusLayer,
  StatusLayers,
  TriggerCondition,
} from '@expedition/shared-types';

import { isExecutionWindow } from '../battle/is-execution-window';
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
  executionWindow: boolean;
  finisherPower: number;
  relayEchoes: number;
  damageSegments: number;
  chaseSegments: number;
  comboSteps: readonly SkillComboStepPreview[];
  targetRoute: readonly string[];
  nextRelays: readonly SkillNextRelayPreview[];
  units: readonly SkillOutcomeUnitPreview[];
  enemyResponse?: EnemyPressureIntent;
}

export interface SkillComboStepPreview {
  componentId: string;
  triggerId: TriggerCondition;
  readiness: TriggerReadiness;
  damageSegments: number;
  chaseSegments: number;
  chaseDamage: number;
  missingStatus?: StatusLayer | undefined;
  eventIds: readonly number[];
}

export interface SkillNextRelayPreview {
  actorId: string;
  readySkillIds: readonly string[];
  newlyReadySkillIds: readonly string[];
}

const missingStatus = (triggerId: TriggerCondition): StatusLayer | undefined => {
  if (triggerId === 'target_burning' || triggerId.includes('burn')) return 'burn';
  if (triggerId === 'target_poisoned' || triggerId.includes('poison')) return 'poison';
  if (triggerId === 'target_tide' || triggerId.includes('tide')) return 'tide';
  return undefined;
};

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
  const executionWindow = isExecutionWindow(input.battle);
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
      ...(readiness.get(component.id) === 'not-ready' && missingStatus(component.triggerId)
        ? { missingStatus: missingStatus(component.triggerId) }
        : {}),
      eventIds: events.map(({ id }) => id),
    };
  });
  const units = input.battle.units.map((before) => {
    const after = resolved.battle.units.find(({ id }) => id === before.id) ?? before;
    return unitPreview(before, after, resolved.events);
  });
  const allDamageEvents = damageEvents(resolved.events);
  const enemyResponseEvent = resolved.events.find(
    ({ kind, actorId }) =>
      (kind === 'enemy_attack' || kind === 'dodge' || kind === 'guard') &&
      input.battle.units.some(({ id, side }) => id === actorId && side === 'enemies'),
  );
  const chaseEvents = allDamageEvents.filter(
    ({ parentCausalId }) => parentCausalId !== undefined && chaseCausalIds.has(parentCausalId),
  );
  const afterTargetId = resolved.battle.selectedTargetId ?? input.targetId;
  const actedIds = new Set(resolved.battle.roundOrder?.actedIds ?? []);
  const nextRelays = resolved.battle.units
    .filter(({ id, side, currentHp }) => side === 'heroes' && currentHp > 0 && !actedIds.has(id))
    .map((candidate): SkillNextRelayPreview => {
      const readySkillIds = candidate.skillIds.filter((skillId) => {
        const nextSkill = input.content.skills[skillId];
        return (
          nextSkill !== undefined &&
          readyCount(resolved.battle, candidate.id, afterTargetId, nextSkill) > 0
        );
      });
      const newlyReadySkillIds = readySkillIds.filter((skillId) => {
        const nextSkill = input.content.skills[skillId]!;
        return (
          readyCount(resolved.battle, candidate.id, afterTargetId, nextSkill) >
          readyCount(input.battle, candidate.id, input.targetId, nextSkill)
        );
      });
      return { actorId: candidate.id, readySkillIds, newlyReadySkillIds };
    })
    .filter(({ readySkillIds }) => readySkillIds.length > 0);
  const targetRoute = resolved.events
    .filter(
      ({ kind, targetId, parentCausalId }) =>
        (kind === 'damage' || kind === 'reaction') && targetId && parentCausalId === undefined,
    )
    .map(({ targetId }) => targetId!);
  return {
    actorId: input.actorId,
    skillId: input.skillId,
    targetId: input.targetId,
    events: resolved.events,
    totalDamage: eventTotal(resolved.events, new Set(['damage', 'reaction'])),
    totalHealing: units.reduce((sum, unit) => sum + unit.healing, 0),
    overkill: eventTotal(resolved.events, new Set(['overkill'])),
    executionWindow,
    finisherPower:
      resolved.events
        .slice()
        .reverse()
        .find(({ kind }) => kind === 'finisher')?.amount ?? 0,
    relayEchoes: executionWindow
      ? resolved.events.filter(({ kind }) => kind === 'overkill').length
      : 0,
    damageSegments: allDamageEvents.length,
    chaseSegments: chaseEvents.length,
    comboSteps,
    targetRoute,
    nextRelays,
    units,
    ...(enemyResponseEvent?.actorId && enemyResponseEvent.targetId
      ? {
          enemyResponse: {
            enemyId: enemyResponseEvent.actorId,
            targetId: enemyResponseEvent.targetId,
            outcome:
              enemyResponseEvent.kind === 'enemy_attack'
                ? ('damage' as const)
                : enemyResponseEvent.kind === 'dodge'
                  ? ('dodge' as const)
                  : ('guard' as const),
            amount: enemyResponseEvent.amount ?? 0,
          },
        }
      : {}),
  };
}
