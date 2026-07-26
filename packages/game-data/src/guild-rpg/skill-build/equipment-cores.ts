import type { EquipmentCoreDefinition } from '@expedition/shared-types';

export const GUILD_EQUIPMENT_CORES: readonly EquipmentCoreDefinition[] = [
  {
    id: 'molten-armor',
    name: '熔甲核心',
    description: '火屬命中追加一個固定削防事件。',
    element: 'fire',
    specializationId: 'weaken',
  },
  {
    id: 'burn-burst',
    name: '焚爆核心',
    description: '消耗燃燒時追加一次範圍爆裂；單體時改為迴響。',
    element: 'fire',
    specializationId: 'blast',
    triggerId: 'consume_burn',
  },
  {
    id: 'toxic-mist',
    name: '毒霧核心',
    description: '攻擊燃燒目標時，毒素命中額外產生擴散事件。',
    element: 'grass',
    specializationId: 'chain',
    triggerId: 'target_burning',
  },
  {
    id: 'venom-depth',
    name: '深毒核心',
    description: '毒素疊層事件多追加一層。',
    element: 'grass',
    specializationId: 'stack',
  },
  {
    id: 'tide-relay',
    name: '潮湧接力核心',
    description: '水屬技能為下一位角色建立強化事件。',
    element: 'water',
    specializationId: 'empower',
  },
  {
    id: 'healing-echo',
    name: '治癒迴響核心',
    description: '蓄潮釋放時追加一次對同目標的治療迴響。',
    element: 'water',
    triggerId: 'consume_tide',
  },
  {
    id: 'relay-prism',
    name: '三相稜鏡核心',
    description: '三種屬性依序出現後追加一個三相反應事件。',
    triggerId: 'team_three_elements',
  },
  {
    id: 'lone-king-loop',
    name: '孤王迴路核心',
    description: '只剩單一敵人時，彈射與擴散能回到原目標。',
    specializationId: 'chain',
    triggerId: 'lone_target',
  },
];
