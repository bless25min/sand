import type {
  BattleUnit,
  GuildBattleEvent,
  GuildElement,
  HuntDefinition,
  SkillSpecialization,
} from '@expedition/shared-types';

export const resolveGuardedTargetId = (
  units: readonly BattleUnit[],
  preferredTargetId: string,
): string => {
  const target = units.find(({ id }) => id === preferredTargetId);
  const guardIds = target?.huntTraits?.flatMap(({ guardedByEnemyIds = [] }) => guardedByEnemyIds);
  return (
    guardIds?.find(
      (guardId) =>
        units.find(
          ({ id, side, currentHp }) => id === guardId && side === 'enemies' && currentHp > 0,
        ) !== undefined,
    ) ?? preferredTargetId
  );
};

export const matchesHuntWeakness = (
  unit: BattleUnit,
  element: GuildElement,
  specializationId: SkillSpecialization,
) =>
  unit.huntTraits?.some(
    ({ vulnerableElementIds = [], vulnerableSpecializationIds = [] }) =>
      vulnerableElementIds.includes(element) ||
      vulnerableSpecializationIds.includes(specializationId),
  ) ?? false;

export interface BossPhaseActivation {
  phaseId: string;
  bossEnemyId: string;
  event: Omit<GuildBattleEvent, 'id'>;
}

export const previewBossPhaseActivation = (
  units: readonly BattleUnit[],
  hunt: HuntDefinition | undefined,
  activatedBossPhaseIds: readonly string[] = [],
): BossPhaseActivation | undefined => {
  const activated = new Set(activatedBossPhaseIds);
  const phase = hunt?.bossPhases?.find((candidate) => {
    if (activated.has(candidate.id)) return false;
    const boss = units.find(
      ({ id, side, currentHp }) =>
        id === candidate.bossEnemyId && side === 'enemies' && currentHp > 0,
    );
    return (
      boss !== undefined &&
      candidate.activateAfterEnemyIds.every(
        (enemyId) =>
          units.find(({ id, side }) => id === enemyId && side === 'enemies')?.currentHp === 0,
      )
    );
  });
  if (!phase) return undefined;

  return {
    phaseId: phase.id,
    bossEnemyId: phase.bossEnemyId,
    event: {
      kind: 'boss_phase',
      message: phase.pressureLabel,
      targetId: phase.bossEnemyId,
      causalId: `boss-phase:${phase.id}`,
      phaseId: phase.id,
      cueId: phase.cueId,
    },
  };
};
