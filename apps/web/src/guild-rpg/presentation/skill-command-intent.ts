export type SkillCommandIntent =
  { arm: string } | { select: string } | { cast: { skillId: string; targetId: string } };

export function chooseSkillIntent(
  armedSkillId: string | undefined,
  skillId: string,
  targetId: string | undefined,
): SkillCommandIntent {
  if (armedSkillId === skillId && targetId) {
    return { cast: { skillId, targetId } };
  }
  return { arm: skillId };
}

export function chooseTargetIntent(
  armedSkillId: string | undefined,
  targetId: string,
): SkillCommandIntent {
  return armedSkillId ? { cast: { skillId: armedSkillId, targetId } } : { select: targetId };
}
