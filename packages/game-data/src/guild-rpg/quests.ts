import type { QuestDefinition } from '@expedition/shared-types';

export const GUILD_QUESTS: readonly QuestDefinition[] = [
  {
    id: 'border_pack',
    name: '邊境狼群',
    description: '壓制侵入驛道的灰狼群，熟悉仇恨與治療。',
    recommendedLevel: 1,
    rewardExperience: 42,
    rewardGold: 28,
    enemies: [
      {
        id: 'wolf_scout',
        name: '灰牙斥候',
        stats: { hp: 105, attack: 21, defense: 7, speed: 13, healing: 0 },
      },
      {
        id: 'wolf_hunter',
        name: '灰牙獵手',
        stats: { hp: 125, attack: 24, defense: 8, speed: 11, healing: 0 },
      },
      {
        id: 'wolf_alpha',
        name: '灰牙首領',
        stats: { hp: 175, attack: 27, defense: 11, speed: 9, healing: 0 },
      },
    ],
  },
  {
    id: 'abandoned_mine',
    name: '廢棄礦坑',
    description: '擊退盤據礦坑的哥布林突擊隊。',
    recommendedLevel: 2,
    rewardExperience: 68,
    rewardGold: 46,
    enemies: [
      {
        id: 'goblin_guard',
        name: '哥布林盾手',
        stats: { hp: 185, attack: 25, defense: 15, speed: 8, healing: 0 },
      },
      {
        id: 'goblin_raider',
        name: '哥布林襲擊者',
        stats: { hp: 145, attack: 31, defense: 9, speed: 13, healing: 0 },
      },
      {
        id: 'goblin_slinger',
        name: '哥布林投石手',
        stats: { hp: 125, attack: 34, defense: 7, speed: 14, healing: 0 },
      },
    ],
  },
  {
    id: 'dragon_shrine',
    name: '龍火聖祠',
    description: '在幼龍的烈焰下維持陣線，奪回失落聖祠。',
    recommendedLevel: 3,
    rewardExperience: 105,
    rewardGold: 75,
    enemies: [
      {
        id: 'ember_whelp',
        name: '燼火幼龍',
        stats: { hp: 620, attack: 52, defense: 22, speed: 12, healing: 0 },
      },
      {
        id: 'shrine_drake',
        name: '聖祠飛龍',
        stats: { hp: 440, attack: 46, defense: 18, speed: 15, healing: 0 },
      },
    ],
  },
];
