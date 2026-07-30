export type SkillCommandIntent =
  | { arm: string }
  | { select: string }
  | { cast: { skillId: string; targetId: string } }
  | { blocked: 'skill' | 'target' };

export function chooseSkillIntent(skillId: string): SkillCommandIntent {
  return { arm: skillId };
}

export function chooseTargetIntent(targetId: string): SkillCommandIntent {
  return { select: targetId };
}

export function confirmSkillIntent(
  armedSkillId: string | undefined,
  targetId: string | undefined,
): SkillCommandIntent {
  if (!armedSkillId) return { blocked: 'skill' };
  if (!targetId) return { blocked: 'target' };
  return { cast: { skillId: armedSkillId, targetId } };
}
