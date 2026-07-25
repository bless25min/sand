import type { BuildDefinition } from '@expedition/shared-types';

import { GUILD_COMBO_CARDS } from './cards';

const ALL_CARD_IDS = Object.keys(GUILD_COMBO_CARDS);

export const GUILD_COMBO_BUILDS: readonly BuildDefinition[] = [
  {
    id: 'retaliation',
    name: '反擊壁壘',
    description: '用 Block 啟動反震，把拖長編排承受的壓力還給敵軍。',
    cardIds: ALL_CARD_IDS,
    ruleIds: ['retaliation_bash'],
  },
  {
    id: 'ricochet',
    name: '殲滅彈射',
    description: '每次 Hit 分岔攻擊全體，適合用連續命中清掉敵群。',
    cardIds: ALL_CARD_IDS,
    ruleIds: ['ricochet_fork'],
  },
  {
    id: 'healing_overflow',
    name: '溢療裁決',
    description: '把 HealOverflow 轉為全體傷害，讓生存與輸出共用一條鏈。',
    cardIds: ALL_CARD_IDS,
    ruleIds: ['overflow_judgment'],
  },
];
