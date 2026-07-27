import type { GuildCombatSceneUnit } from './contracts';

export type CombatUnitPresentation =
  | {
      boss: false;
      presenceRings: 0;
    }
  | {
      boss: true;
      presenceRings: number;
      badge: 'BOSS';
    };

export function createUnitPresentation(
  unit: GuildCombatSceneUnit,
  relay: number,
): CombatUnitPresentation {
  const boss = unit.enemy?.crowned === true;
  if (!boss) return { boss: false, presenceRings: 0 };
  const normalizedRelay = Math.max(1, Math.min(6, Math.trunc(relay)));
  return {
    boss: true,
    presenceRings: 2 + Math.ceil(normalizedRelay / 2),
    badge: 'BOSS',
  };
}
