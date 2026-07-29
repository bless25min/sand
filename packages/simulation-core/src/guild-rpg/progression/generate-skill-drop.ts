import type { GuildGameContent, QualityRank, SkillDropPool } from '@expedition/shared-types';

import type { RandomSource } from '../../rng/random-source';
import { createOwnedSkill } from '../skills/create-owned-skill';

export function generateSkillDrop(
  pool: SkillDropPool,
  sequence: number,
  content: GuildGameContent,
  random: RandomSource,
  qualityRank: QualityRank = 1,
) {
  const element = pool.elements[random.nextInt(0, pool.elements.length - 1)]!;
  const specialization =
    pool.specializationIds[random.nextInt(0, pool.specializationIds.length - 1)]!;
  const trigger = pool.triggerIds[random.nextInt(0, pool.triggerIds.length - 1)]!;
  const formId = `${element}.${specialization}.${trigger}`;
  return createOwnedSkill({
    id: `skill:${pool.id}:${sequence}:${formId}`,
    formId,
    content,
    qualityRank,
    sourceHuntId: pool.id,
    roll: ({ min, max }) => random.nextInt(min, max),
  });
}
