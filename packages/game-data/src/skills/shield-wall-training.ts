import type { SkillDefinition } from '@expedition/shared-types';

export const SHIELD_WALL_TRAINING: SkillDefinition = {
  id: 'shield-wall-training',
  name: '盾牆訓練',
  type: 'PASSIVE',
  description: '強化正面防禦，但降低機動力。',
  statModifiers: {
    frontalDefense: 2,
    mobility: -0.1,
  },
};
