import type { GuildCombatScene } from './contracts';

export interface CombatEffectPoint {
  x: number;
  y: number;
}

export interface CombatEffectPlan {
  ambientParticles: number;
  impactParticles: number;
  impactRings: number;
  cameraZoom: number;
  shakePx: number;
  hitStopMs: number;
  finisher: boolean;
  route: readonly CombatEffectPoint[];
}

const pointFor = (scene: GuildCombatScene, id: string | undefined) => {
  const unit = scene.units.find((candidate) => candidate.id === id);
  return unit ? { x: unit.x, y: unit.y - 40 } : undefined;
};

function eventRoute(scene: GuildCombatScene): readonly CombatEffectPoint[] {
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
  return [actor, target];
}

export function createCombatEffectPlan(scene: GuildCombatScene): CombatEffectPlan {
  const relay = Math.max(1, Math.min(6, Math.trunc(scene.relay)));
  return {
    ambientParticles: 8 + relay * 8,
    impactParticles: 12 + relay * 10,
    impactRings: relay + 1,
    cameraZoom: relay === 6 ? 1.08 : 1 + (relay - 1) * 0.008,
    shakePx: relay === 1 ? 0 : relay * 1.5,
    hitStopMs: 18 + relay * 8,
    finisher: relay === 6,
    route: eventRoute(scene),
  };
}
