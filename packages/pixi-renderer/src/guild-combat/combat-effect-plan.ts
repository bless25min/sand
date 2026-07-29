import type { GuildCombatScene } from './contracts';
import { createEnemyAttackPlan, type EnemyAttackPlan } from './enemy-attack-plan';
import { createEnemyReactionPlan, type EnemyReactionPlan } from './enemy-reaction-plan';

export type { EnemyReactionKind } from './enemy-reaction-plan';

export interface CombatEffectPoint {
  x: number;
  y: number;
}

export interface CombatEffectPlan {
  ambientParticles: number;
  impactParticles: number;
  impactRings: number;
  impactTargetIds: readonly string[];
  cameraZoom: number;
  shakePx: number;
  hitStopMs: number;
  afterimageCount: number;
  screenFlashAlpha: number;
  impactScale: number;
  finisher: boolean;
  elementMotif: 'ember-shards' | 'toxic-spores' | 'tidal-ribbons' | 'neutral-sparks';
  specializationMotif:
    | 'detonation'
    | 'layer-orbit'
    | 'armor-fracture'
    | 'ricochet'
    | 'relay-aura'
    | 'rapid-strikes'
    | 'impact';
  deliveryMotif:
    | 'shield-wave'
    | 'arrow-shot'
    | 'staff-orbit'
    | 'flask-lob'
    | 'tome-rune'
    | 'twin-slash'
    | 'enemy-strike'
    | 'neutral';
  enemyAttack: EnemyAttackPlan;
  enemyReaction: EnemyReactionPlan;
  signatureMarks: number;
  route: readonly CombatEffectPoint[];
}

const pointFor = (scene: GuildCombatScene, id: string | undefined) => {
  const unit = scene.units.find((candidate) => candidate.id === id);
  return unit ? { x: unit.x, y: unit.y - 40 } : undefined;
};

const deliveryMotif = (scene: GuildCombatScene): CombatEffectPlan['deliveryMotif'] => {
  const actor = scene.units.find(({ id }) => id === scene.event?.actorId);
  if (actor?.hero?.weapon === 'shield') return 'shield-wave';
  if (actor?.hero?.weapon === 'bow') return 'arrow-shot';
  if (actor?.hero?.weapon === 'staff') return 'staff-orbit';
  if (actor?.hero?.weapon === 'flask') return 'flask-lob';
  if (actor?.hero?.weapon === 'tome') return 'tome-rune';
  if (actor?.hero?.weapon === 'blades') return 'twin-slash';
  if (actor?.side === 'enemies') return 'enemy-strike';
  return 'neutral';
};

const directRoute = (
  scene: GuildCombatScene,
  actor: CombatEffectPoint,
  target: CombatEffectPoint,
): readonly CombatEffectPoint[] => {
  const delivery = deliveryMotif(scene);
  const dx = target.x - actor.x;
  const dy = target.y - actor.y;
  const elevated = Math.max(48, Math.min(actor.y, target.y));
  if (delivery === 'shield-wave') {
    return [actor, { x: actor.x + dx * 0.44, y: target.y + 34 }, target];
  }
  if (delivery === 'staff-orbit') {
    return [actor, { x: actor.x + dx * 0.5, y: elevated - 138 }, target];
  }
  if (delivery === 'flask-lob') {
    return [
      actor,
      { x: actor.x + dx * 0.38, y: elevated - 182 },
      { x: actor.x + dx * 0.72, y: elevated - 112 },
      target,
    ];
  }
  if (delivery === 'tome-rune') {
    return [
      actor,
      { x: actor.x + dx * 0.32, y: actor.y - 104 },
      { x: actor.x + dx * 0.68, y: target.y + 76 },
      target,
    ];
  }
  if (delivery === 'twin-slash') {
    return [
      actor,
      { x: target.x - 58, y: target.y - 62 },
      { x: actor.x + Math.max(72, dx * 0.24), y: actor.y + Math.sign(dy || 1) * 48 },
      target,
    ];
  }
  return [actor, target];
};

function eventRoute(
  scene: GuildCombatScene,
  enemyAttack: EnemyAttackPlan,
): readonly CombatEffectPoint[] {
  if (enemyAttack.phase === 'strike') return enemyAttack.route;
  const event = scene.event;
  if (!event || event.route === 'none' || event.route === 'area') return [];
  const actor = pointFor(scene, event.actorId);
  const target = pointFor(scene, event.targetId);
  if (!actor || !target) return [];
  if (event.route === 'bounce') {
    return [
      actor,
      { x: target.x - 155, y: Math.max(72, target.y - 175) },
      { x: Math.min(scene.width - 60, target.x + 110), y: target.y + 65 },
      target,
    ];
  }
  if (event.route === 'echo') {
    return [actor, target, { x: target.x - 90, y: target.y - 105 }, target];
  }
  return directRoute(scene, actor, target);
}

const elementMotif = (scene: GuildCombatScene): CombatEffectPlan['elementMotif'] => {
  if (scene.event?.element === 'fire') return 'ember-shards';
  if (scene.event?.element === 'grass') return 'toxic-spores';
  if (scene.event?.element === 'water') return 'tidal-ribbons';
  return 'neutral-sparks';
};

const specializationMotif = (scene: GuildCombatScene): CombatEffectPlan['specializationMotif'] => {
  const specialization = scene.event?.specializationId;
  if (specialization === 'blast') return 'detonation';
  if (specialization === 'stack') return 'layer-orbit';
  if (specialization === 'weaken') return 'armor-fracture';
  if (specialization === 'chain') return 'ricochet';
  if (specialization === 'empower') return 'relay-aura';
  if (specialization === 'multistrike') return 'rapid-strikes';
  return 'impact';
};

const impactTargetIds = (scene: GuildCombatScene): readonly string[] => {
  if (scene.event?.targetId) return [scene.event.targetId];
  if (scene.event?.phase === 'finisher') {
    return scene.units.filter(({ side }) => side === 'enemies').map(({ id }) => id);
  }
  if (scene.event?.polarity === 'support') {
    return scene.units
      .filter(({ side, state }) => side === 'heroes' && state !== 'defeated')
      .map(({ id }) => id);
  }
  if (scene.event?.route === 'area') {
    return scene.units
      .filter(({ side, state }) => side === 'enemies' && state !== 'defeated')
      .map(({ id }) => id);
  }
  return [];
};

export function createCombatEffectPlan(scene: GuildCombatScene): CombatEffectPlan {
  const relay = Math.max(
    1,
    Math.min(6, Math.trunc(scene.event?.causalDepth ?? scene.event?.relay ?? scene.relay)),
  );
  const motif = specializationMotif(scene);
  const enemyAttack = createEnemyAttackPlan(scene);
  return {
    ambientParticles: 8 + relay * relay * 3,
    impactParticles: 12 + relay * relay * 5,
    impactRings: relay + Math.floor((relay * relay) / 4) + 1 + (motif === 'detonation' ? 2 : 0),
    impactTargetIds: impactTargetIds(scene),
    cameraZoom: Number((1 + relay * relay * 0.0045).toFixed(3)),
    shakePx: relay === 1 ? 0 : relay * relay * 0.7,
    hitStopMs: 24 + relay * relay * 4,
    afterimageCount: relay + 1,
    screenFlashAlpha: Number((0.08 + relay * relay * 0.012 + (relay === 6 ? 0.18 : 0)).toFixed(3)),
    impactScale: 1 + relay * relay * 0.025,
    finisher: relay === 6,
    elementMotif: elementMotif(scene),
    specializationMotif: motif,
    deliveryMotif: deliveryMotif(scene),
    enemyAttack,
    enemyReaction: createEnemyReactionPlan(scene, relay),
    signatureMarks:
      relay +
      Math.floor((relay * relay) / 3) +
      (motif === 'rapid-strikes' ? 4 : motif === 'layer-orbit' ? 2 : 1),
    route: eventRoute(scene, enemyAttack),
  };
}
