import type { FusedSkill, OwnedSkill } from '@expedition/shared-types';

import { fuseSkills } from './fuse-skills';

export function replaceFusedComponent(
  skill: FusedSkill,
  index: number,
  replacement: OwnedSkill,
): { skill: FusedSkill; removedSkill: OwnedSkill } {
  const sources = [...skill.sourceSkills];
  const removedSkill = sources[index];
  if (!removedSkill) throw new Error(`Unknown fused component index: ${index}`);
  if (replacement.components[0].element !== sources[0]!.components[0].element) {
    throw new Error('Replacement skill must use the same element.');
  }
  sources[index] = replacement;
  return {
    skill: fuseSkills(sources, skill.id, skill.name),
    removedSkill,
  };
}
