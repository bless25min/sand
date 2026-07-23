import type { MonsterGroupState, Vec2 } from '@expedition/shared-types';

export function moveMonsterToward(
  monster: MonsterGroupState,
  target: Vec2,
  distance: number,
): MonsterGroupState {
  const deltaX = target.x - monster.position.x;
  const deltaY = target.y - monster.position.y;
  const remaining = Math.hypot(deltaX, deltaY);

  if (remaining === 0 || distance <= 0) {
    return { ...monster, behaviorState: 'ENGAGED' };
  }

  const step = Math.min(distance, remaining);
  const direction = { x: deltaX / remaining, y: deltaY / remaining };

  return {
    ...monster,
    position: {
      x: monster.position.x + direction.x * step,
      y: monster.position.y + direction.y * step,
    },
    direction,
    targetPosition: target,
    behaviorState: remaining <= distance ? 'ENGAGED' : 'HUNTING',
  };
}
