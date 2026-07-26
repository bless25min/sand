import type { GuildElementDefinition } from '@expedition/shared-types';

export const GUILD_ELEMENTS: readonly GuildElementDefinition[] = [
  {
    id: 'fire',
    name: '火',
    status: 'burn',
    fantasy: '燃燒疊層、融甲與延遲爆發',
    layerRoll: { min: 2, max: 5 },
  },
  {
    id: 'grass',
    name: '草',
    status: 'poison',
    fantasy: '毒素堆積、擴散與持續侵蝕',
    layerRoll: { min: 2, max: 5 },
  },
  {
    id: 'water',
    name: '水',
    status: 'tide',
    fantasy: '治療蓄潮、強化接力與迴響',
    layerRoll: { min: 2, max: 5 },
  },
];
