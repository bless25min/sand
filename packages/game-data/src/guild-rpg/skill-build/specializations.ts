import type { SkillSpecializationDefinition } from '@expedition/shared-types';

export const GUILD_SKILL_SPECIALIZATIONS: readonly SkillSpecializationDefinition[] = [
  {
    id: 'blast',
    name: '爆炸範圍',
    description: '命中後產生獨立範圍事件，單體時回到原目標形成爆裂迴響。',
    powerRoll: { min: 8, max: 14 },
    repeatRoll: { min: 1, max: 2 },
  },
  {
    id: 'stack',
    name: '疊層',
    description: '追加屬性層數，讓後續消耗與連鎖取得更多可用事件。',
    powerRoll: { min: 5, max: 9 },
    repeatRoll: { min: 1, max: 3 },
  },
  {
    id: 'weaken',
    name: '削弱',
    description: '削減敵方防禦並留下可被隊友讀取的弱化標記。',
    powerRoll: { min: 6, max: 11 },
    repeatRoll: { min: 1, max: 2 },
  },
  {
    id: 'chain',
    name: '連鎖彈射',
    description: '以獨立傷害事件在敵群間彈射，單體時可形成同目標迴響。',
    powerRoll: { min: 6, max: 12 },
    repeatRoll: { min: 2, max: 4 },
  },
  {
    id: 'empower',
    name: '強化',
    description: '產生可供下一位角色承接的強化事件與屬性資源。',
    powerRoll: { min: 7, max: 12 },
    repeatRoll: { min: 1, max: 2 },
  },
  {
    id: 'multistrike',
    name: '攻擊次數',
    description: '把力量拆成多次可觸發、可接力、可溢傷的獨立命中。',
    powerRoll: { min: 4, max: 8 },
    repeatRoll: { min: 3, max: 6 },
  },
];
