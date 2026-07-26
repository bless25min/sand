import type { AscensionDefinition } from '@expedition/shared-types';

export const GUILD_ASCENSIONS: readonly AscensionDefinition[] = [
  {
    id: 'crimson_pressure',
    name: '赤紅壓境',
    description: '敵軍進攻節奏暴升；用一令全滅把壓力反轉成紅色高潮。',
    pressureMultiplier: 1.6,
    route: 'one_command',
    routeLabel: '一令全滅路線',
    cueId: 'break',
    motif: 'ember',
  },
  {
    id: 'signature_route',
    name: '招牌風暴',
    description: '宣告目前全隊的招牌接力路線，讓整場追逐同一條規則連鎖。',
    pressureMultiplier: 1.85,
    signatureDamageMultiplier: 2.4,
    route: 'signature',
    routeLabel: '全隊招牌接力',
    cueId: 'rule-online',
    motif: 'command',
  },
  {
    id: 'annihilation_weather',
    name: '殲滅天候',
    description: '敵軍壓力與戰場奇觀同步過載，只追求更高 Overkill。',
    pressureMultiplier: 2.15,
    overkillDamageMultiplier: 3,
    route: 'overkill',
    routeLabel: '極限 Overkill 路線',
    cueId: 'annihilation',
    motif: 'storm',
  },
];
