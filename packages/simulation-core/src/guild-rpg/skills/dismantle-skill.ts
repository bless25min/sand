import type { FusedSkill, OwnedSkill } from '@expedition/shared-types';

export function dismantleSkill(skill: FusedSkill): readonly OwnedSkill[] {
  return skill.sourceSkills.map((source) => ({
    ...source,
    components: [{ ...source.components[0] }],
  }));
}
