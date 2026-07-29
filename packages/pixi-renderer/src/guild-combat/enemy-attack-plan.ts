import type { GuildCombatScene, GuildCombatSceneUnit, GuildEnemyVisual } from './contracts';

type EnemyAttackMotif =
  'dash-slash' | 'ground-smash' | 'shield-crush' | 'arc-volley' | 'royal-execution' | 'dive-strike';

type EnemyAttackOutcome = 'none' | 'damage' | 'guard' | 'dodge';

interface EnemyAttackPoint {
  x: number;
  y: number;
}

export interface EnemyAttackPlan {
  active: boolean;
  phase: 'none' | 'telegraph' | 'strike';
  outcome: EnemyAttackOutcome;
  motif: EnemyAttackMotif;
  sourceId?: string;
  targetId?: string;
  accent: number;
  force: number;
  route: readonly EnemyAttackPoint[];
}

const MOTIF_BY_ARCHETYPE: Readonly<Record<GuildEnemyVisual['archetype'], EnemyAttackMotif>> = {
  skirmisher: 'dash-slash',
  brute: 'ground-smash',
  guardian: 'shield-crush',
  artillery: 'arc-volley',
  boss: 'royal-execution',
  flying: 'dive-strike',
};

const FORCE_BY_ARCHETYPE: Readonly<Record<GuildEnemyVisual['archetype'], number>> = {
  skirmisher: 1,
  brute: 1.25,
  guardian: 1.15,
  artillery: 1.1,
  boss: 1.55,
  flying: 1.3,
};

const center = (unit: GuildCombatSceneUnit): EnemyAttackPoint => ({
  x: unit.x,
  y: unit.y - 55,
});

const routeFor = (
  archetype: GuildEnemyVisual['archetype'],
  source: EnemyAttackPoint,
  target: EnemyAttackPoint,
): readonly EnemyAttackPoint[] => {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  if (archetype === 'skirmisher') {
    return [
      source,
      { x: source.x - dx * 0.12, y: source.y - 24 },
      { x: target.x - dx * 0.12, y: target.y - 34 },
      target,
    ];
  }
  if (archetype === 'brute') {
    return [source, { x: source.x + dx * 0.52, y: Math.max(source.y, target.y) + 92 }, target];
  }
  if (archetype === 'guardian') {
    return [
      source,
      { x: source.x + dx * 0.32, y: source.y + dy * 0.18 + 38 },
      { x: source.x + dx * 0.72, y: target.y + 52 },
      target,
    ];
  }
  if (archetype === 'artillery') {
    const apex = Math.min(source.y, target.y) - 190;
    return [
      source,
      { x: source.x + dx * 0.28, y: apex },
      { x: source.x + dx * 0.72, y: apex + 42 },
      target,
    ];
  }
  if (archetype === 'boss') {
    return [
      source,
      { x: source.x + dx * 0.18, y: source.y - 90 },
      { x: source.x + dx * 0.5, y: source.y + dy * 0.5 + 68 },
      { x: source.x + dx * 0.82, y: target.y - 86 },
      target,
    ];
  }
  return [
    source,
    { x: source.x + dx * 0.16, y: Math.min(source.y, target.y) - 150 },
    { x: source.x + dx * 0.68, y: target.y - 118 },
    target,
  ];
};

const eventOutcome = (scene: GuildCombatScene): EnemyAttackOutcome => {
  if (scene.event?.eventKind === 'enemy_attack') return 'damage';
  if (scene.event?.eventKind === 'guard') return 'guard';
  if (scene.event?.eventKind === 'dodge') return 'dodge';
  return 'none';
};

const clampToScene = (scene: GuildCombatScene, point: EnemyAttackPoint): EnemyAttackPoint => ({
  x: Math.max(24, Math.min(scene.width - 24, point.x)),
  y: Math.max(24, Math.min(scene.height - 24, point.y)),
});

export function createEnemyAttackPlan(scene: GuildCombatScene): EnemyAttackPlan {
  const outcome = scene.enemyIntent?.outcome ?? eventOutcome(scene);
  const sourceId = scene.enemyIntent?.enemyId ?? scene.event?.actorId;
  const targetId = scene.enemyIntent?.targetId ?? scene.event?.targetId;
  const source = scene.units.find(({ id, side }) => id === sourceId && side === 'enemies');
  const target = scene.units.find(({ id, side }) => id === targetId && side === 'heroes');
  if (!source || !target || outcome === 'none') {
    return {
      active: false,
      phase: 'none',
      outcome: 'none',
      motif: 'ground-smash',
      accent: 0xff6548,
      force: 0,
      route: [],
    };
  }
  const archetype = source.enemy?.archetype ?? 'brute';
  return {
    active: true,
    phase: scene.enemyIntent && !scene.event ? 'telegraph' : 'strike',
    outcome,
    motif: MOTIF_BY_ARCHETYPE[archetype],
    sourceId: source.id,
    targetId: target.id,
    accent: source.enemy?.accent ?? 0xff6548,
    force: FORCE_BY_ARCHETYPE[archetype],
    route: routeFor(archetype, center(source), center(target)).map((point) =>
      clampToScene(scene, point),
    ),
  };
}
