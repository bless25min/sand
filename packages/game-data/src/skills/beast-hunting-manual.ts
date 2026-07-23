import type { SkillDefinition } from '@expedition/shared-types';

export const BEAST_HUNTING_MANUAL: SkillDefinition = {
  id: 'beast-hunting-manual',
  name: '獵獸操典',
  type: 'PASSIVE',
  description: '提升攻擊與機動力，但降低正面防禦。',
  statModifiers: {
    attack: 2,
    frontalDefense: -0.5,
    mobility: 0.15,
  },
};
