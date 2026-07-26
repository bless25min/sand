import type { BuildDefinition } from '@expedition/shared-types';

import { GUILD_COMBO_CARDS } from './cards';

const ALL_CARD_IDS = Object.keys(GUILD_COMBO_CARDS);

export const GUILD_COMBO_BUILDS: readonly BuildDefinition[] = [
  {
    id: 'retaliation',
    name: '反擊壁壘',
    description: '用 Block 啟動反震，把拖長編排承受的壓力還給敵軍。',
    fantasy: '把敵軍整段攻勢吞進盾牆，再用連鎖反震一次砸回全場。',
    payoffLabel: '盾牆蓄爆',
    signatureCardIds: ['brann_brace', 'brann_riposte', 'brann_sweep'],
    accent: 'ember',
    cardIds: ALL_CARD_IDS,
    ruleIds: ['retaliation_bash'],
  },
  {
    id: 'ricochet',
    name: '殲滅彈射',
    description: '每次 Hit 分岔攻擊全體，適合用連續命中清掉敵群。',
    fantasy: '鎖住第一個破口，讓每次命中裂成覆蓋整群的殲滅箭雨。',
    payoffLabel: '全場跳彈',
    signatureCardIds: ['lyra_mark', 'lyra_piercing_shot', 'lyra_ricochet'],
    accent: 'storm',
    cardIds: ALL_CARD_IDS,
    ruleIds: ['ricochet_fork'],
  },
  {
    id: 'healing_overflow',
    name: '溢療裁決',
    description: '把 HealOverflow 轉為全體傷害，讓生存與輸出共用一條鏈。',
    fantasy: '把每一點過量治療翻轉成聖輝裁決，讓全場同時爆裂。',
    payoffLabel: '聖輝翻轉',
    signatureCardIds: ['elin_prayer', 'elin_overflow_bolt', 'elin_radiant_burst'],
    accent: 'radiance',
    cardIds: ALL_CARD_IDS,
    ruleIds: ['overflow_judgment'],
  },
  {
    id: 'command_storm',
    name: '軍令風暴',
    description: '每張卡都敲出鋼鐵回聲，讓任意編排一路追加傷害與複製爆點。',
    fantasy: '不等待條件，讓每一道軍令都帶著上一擊的回聲把戰場連續轟穿。',
    payoffLabel: '全令共振',
    signatureCardIds: ['lyra_quickshot', 'brann_sweep', 'elin_prayer', 'elin_radiant_burst'],
    accent: 'command',
    cardIds: ALL_CARD_IDS,
    ruleIds: ['steel_echo'],
  },
];
