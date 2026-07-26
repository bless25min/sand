import type { FusedSkill, OwnedSkill } from '@expedition/shared-types';

export function fuseSkills(
  sourceSkills: readonly OwnedSkill[],
  id: string,
  name: string,
): FusedSkill {
  if (sourceSkills.length !== 2 && sourceSkills.length !== 3) {
    throw new Error('Fusion requires two or three one-star skills.');
  }
  const element = sourceSkills[0]?.components[0].element;
  if (
    !sourceSkills.every((skill) => skill.stars === 1 && skill.components[0].element === element)
  ) {
    throw new Error('Fusion requires skills of the same element.');
  }
  if (sourceSkills.length === 2) {
    const sources = [sourceSkills[0]!, sourceSkills[1]!] as const;
    return {
      id,
      name,
      stars: 2,
      components: [sources[0].components[0], sources[1].components[0]],
      sourceSkills: sources,
    };
  }
  const sources = [sourceSkills[0]!, sourceSkills[1]!, sourceSkills[2]!] as const;
  return {
    id,
    name,
    stars: 3,
    components: [sources[0].components[0], sources[1].components[0], sources[2].components[0]],
    sourceSkills: sources,
  };
}
