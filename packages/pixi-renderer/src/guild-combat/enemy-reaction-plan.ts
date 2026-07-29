import type { GuildCombatScene } from './contracts';

export type EnemyReactionKind = 'none' | 'impact' | 'stagger' | 'break' | 'collapse' | 'execute';

export interface EnemyReactionPlan {
  kind: EnemyReactionKind;
  targetIds: readonly string[];
  force: number;
  fragmentCount: number;
  fadeTo: number;
  crownLaunch: boolean;
}

export function createEnemyReactionPlan(scene: GuildCombatScene, relay: number): EnemyReactionPlan {
  const event = scene.event;
  const enemyTargets = event?.targetId
    ? scene.units.filter(({ id, side }) => id === event.targetId && side === 'enemies')
    : event?.phase === 'finisher'
      ? scene.units.filter(({ side }) => side === 'enemies')
      : [];
  if (!event || enemyTargets.length === 0) {
    return {
      kind: 'none',
      targetIds: [],
      force: 0,
      fragmentCount: 0,
      fadeTo: 1,
      crownLaunch: false,
    };
  }

  let kind: EnemyReactionKind = 'none';
  if (
    event.eventKind === 'overkill' ||
    event.eventKind === 'infinite_engine' ||
    event.eventKind === 'finisher'
  ) {
    kind = 'execute';
  } else if (event.eventKind === 'unit_defeated') {
    kind = 'collapse';
  } else if (event.phase === 'impact' && event.polarity === 'damage') {
    kind = enemyTargets.some(({ state }) => state === 'broken')
      ? 'break'
      : enemyTargets.some(({ hpRatio }) => hpRatio <= 0.25)
        ? 'stagger'
        : 'impact';
  }

  const targetCount = enemyTargets.length;
  const fragmentCount =
    kind === 'impact'
      ? 4 + relay
      : kind === 'stagger'
        ? 7 + relay * 2
        : kind === 'break'
          ? 10 + relay * 2
          : kind === 'collapse'
            ? 12 + relay * 2
            : kind === 'execute'
              ? 12 + relay * 2 + targetCount * 4
              : 0;
  const force =
    kind === 'impact'
      ? 1 + relay * 0.15
      : kind === 'stagger'
        ? 1.6 + relay * 0.18
        : kind === 'break'
          ? 2.2 + relay * 0.2
          : kind === 'collapse'
            ? 2.5 + relay * 0.22
            : kind === 'execute'
              ? 3.5 + relay * 0.3
              : 0;

  return {
    kind,
    targetIds: enemyTargets.map(({ id }) => id),
    force,
    fragmentCount,
    fadeTo: kind === 'execute' ? 0 : kind === 'collapse' ? 0.3 : kind === 'break' ? 0.72 : 1,
    crownLaunch:
      (kind === 'collapse' || kind === 'execute') &&
      enemyTargets.some(({ enemy }) => enemy?.crowned === true),
  };
}
