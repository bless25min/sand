import type { ZoneDefinition } from '@expedition/shared-types';

export const GUILD_ZONES: readonly ZoneDefinition[] = [
  {
    id: 'greyfang_frontier',
    name: '灰牙邊境',
    subtitle: 'ZONE I · MOONLIT HUNT',
    description: '追過驛道與月路，將灰牙王巢從邊境版圖抹除。',
    palette: 'moon-iron',
    transitionLabel: '狼王旗倒下，深礦警鐘在地底響起。',
    questIds: ['border_pack', 'moonroad_pursuit', 'red_fang_den'],
  },
  {
    id: 'deepmine_front',
    name: '深礦戰線',
    subtitle: 'ZONE II · POWDER & IRON',
    description: '炸穿封礦盾陣，沿著爆破長廊直取鐵座。',
    palette: 'ore-green',
    transitionLabel: '鐵座崩塌，封印深處湧出燼火與龍鳴。',
    questIds: ['abandoned_mine', 'blast_gallery', 'iron_throne'],
  },
  {
    id: 'ember_sanctum',
    name: '燼火聖域',
    subtitle: 'ZONE III · DRAGON SUNFALL',
    description: '撕開龍印、穿越灰燼中殿，讓日輪龍巢墜落。',
    palette: 'ember-violet',
    transitionLabel: '日輪熄滅，裂天閃電照亮遠方王城。',
    questIds: ['dragon_shrine', 'ashen_aisle', 'solar_nest'],
  },
  {
    id: 'storm_citadel',
    name: '風暴王城',
    subtitle: 'ZONE IV · BREAK THE SKY',
    description: '攻破城門與鎖雷寶庫，在王座前完成最後殲滅。',
    palette: 'storm-cyan',
    transitionLabel: '裂天帝王伏地，整條遠征戰線進入無限重刷。',
    questIds: ['storm_gate', 'chain_vault', 'skybreaker_crown'],
  },
];
