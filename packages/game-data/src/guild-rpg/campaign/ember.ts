import type {
  EnemyDefinition,
  HuntDefinition,
  HuntEnemyRewards,
  QuestDefinition,
} from '@expedition/shared-types';

import { equipment, hunt, huntEnemy, quest } from './factories';

const enemies = {
  whelp: {
    id: 'ember_whelp',
    name: '燼火幼龍',
    stats: { hp: 620, attack: 52, defense: 22, speed: 12, healing: 0 },
  },
  drake: {
    id: 'shrine_drake',
    name: '聖祠飛龍',
    stats: { hp: 440, attack: 46, defense: 18, speed: 15, healing: 0 },
  },
  cantor: {
    id: 'ash_cantor',
    name: '灰燼詠唱者',
    stats: { hp: 650, attack: 78, defense: 27, speed: 17, healing: 26 },
  },
  wyvern: {
    id: 'solar_wyvern',
    name: '日輪翼龍',
    stats: { hp: 1120, attack: 105, defense: 48, speed: 20, healing: 0 },
  },
} satisfies Record<string, EnemyDefinition>;

const rewards = {
  whelp: huntEnemy({
    enemyId: enemies.whelp.id,
    spectacle: {
      family: 'ember-dragon',
      role: 'boss',
      palette: 'ember-violet',
      aura: 'sealed-heart',
      defeat: 'sunburst-collapse',
    },
    traits: [
      {
        id: 'sealed_ember_heart',
        name: '封印燼心',
        description: '飛龍存活時封住核心；元素轉換與回聲可越過龍焰。',
        counterBuildIds: ['healing_overflow', 'command_storm'],
        pressureMultiplier: 1.65,
        guardedByEnemyIds: ['shrine_drake'],
        guardedDamageMultiplier: 0.45,
        vulnerableTransform: 'convert_element',
        vulnerabilityMultiplier: 1.7,
      },
    ],
    material: { id: 'ember_core', name: '燼火龍核', baseQuantity: 3 },
    equipment: [
      equipment(
        'ember_staff',
        '燼火溢流杖',
        'weapon',
        'healing',
        14,
        ['healing_overflow'],
        ['overflow_reserve'],
      ),
    ],
  }),
  drake: huntEnemy({
    enemyId: enemies.drake.id,
    spectacle: {
      family: 'ember-dragon',
      role: 'guardian',
      palette: 'scale-cyan',
      aura: 'resonant-scales',
      defeat: 'scale-rain',
    },
    traits: [
      {
        id: 'resonant_scale',
        name: '共鳴龍鱗',
        description: '彈射沿護層擴散，甩尾後也會暴露反震窗口。',
        counterBuildIds: ['ricochet', 'retaliation'],
        pressureMultiplier: 1.4,
        vulnerableTransform: 'ricochet',
        vulnerabilityMultiplier: 1.55,
      },
    ],
    material: { id: 'drake_scale', name: '聖祠龍鱗', baseQuantity: 2 },
    equipment: [
      equipment('drake_mail', '聖祠鱗甲', 'armor', 'hp', 42, ['retaliation'], ['steel_echo']),
    ],
  }),
  cantor: huntEnemy({
    enemyId: enemies.cantor.id,
    spectacle: {
      family: 'ember-cult',
      role: 'artillery',
      palette: 'ash-gold',
      aura: 'funeral-chorus',
      defeat: 'choir-silence',
    },
    traits: [
      {
        id: 'funeral_chorus',
        name: '葬火合唱',
        description: '詠唱堆高全場火壓；溢療與 CopyNext 可把歌聲反轉成爆破。',
        counterBuildIds: ['healing_overflow', 'command_storm'],
        pressureMultiplier: 1.9,
        vulnerableTransform: 'copy_next',
        vulnerabilityMultiplier: 1.9,
      },
    ],
    material: { id: 'cantor_ash', name: '詠唱聖灰', baseQuantity: 4 },
    equipment: [
      equipment(
        'cantor_censer',
        '葬火共鳴爐',
        'accessory',
        'healing',
        25,
        ['healing_overflow', 'command_storm'],
        ['overflow_reserve', 'steel_echo'],
      ),
    ],
  }),
  wyvern: huntEnemy({
    enemyId: enemies.wyvern.id,
    spectacle: {
      family: 'ember-dragon',
      role: 'brute',
      palette: 'solar-white',
      aura: 'sunwheel-wings',
      defeat: 'solar-featherstorm',
    },
    traits: [
      {
        id: 'sunwheel_dive',
        name: '日輪俯衝',
        description: '高速俯衝留下多段殘影；Repeat 與 Ricochet 可追著殘影連爆。',
        counterBuildIds: ['retaliation', 'ricochet'],
        pressureMultiplier: 2.15,
        vulnerableTransform: 'ricochet',
        vulnerabilityMultiplier: 2.05,
      },
    ],
    material: { id: 'solar_pinions', name: '日輪翼骨', baseQuantity: 5 },
    equipment: [
      equipment(
        'solar_lance',
        '日輪墜星槍',
        'weapon',
        'attack',
        45,
        ['retaliation', 'ricochet'],
        ['retaliation_bash', 'ricochet_focus'],
      ),
    ],
  }),
} satisfies Record<string, HuntEnemyRewards>;

export const EMBER_QUESTS: readonly QuestDefinition[] = [
  quest({
    id: 'dragon_shrine',
    zoneId: 'ember_sanctum',
    name: '龍火聖祠',
    description: '在幼龍烈焰下維持陣線，奪回失落聖祠。',
    recommendedLevel: 7,
    rewardExperience: 505,
    rewardGold: 475,
    enemies: [enemies.whelp, enemies.drake],
  }),
  quest({
    id: 'ashen_aisle',
    zoneId: 'ember_sanctum',
    name: '灰燼中殿',
    description: '穿過共鳴龍鱗，讓葬火合唱在最高潮反向炸裂。',
    recommendedLevel: 8,
    rewardExperience: 680,
    rewardGold: 640,
    enemies: [enemies.drake, enemies.cantor],
  }),
  quest({
    id: 'solar_nest',
    zoneId: 'ember_sanctum',
    name: '日輪龍巢',
    description: '追著俯衝殘影連續處刑，讓整座龍巢化為日墜。',
    recommendedLevel: 9,
    rewardExperience: 920,
    rewardGold: 880,
    enemies: [enemies.cantor, enemies.wyvern],
  }),
];

export const EMBER_HUNTS: readonly HuntDefinition[] = [
  hunt({
    id: 'dragon-shrine-hunt',
    questId: 'dragon_shrine',
    pressureLabel: '龍鱗封心：飛龍護層讓燼心持續升溫。',
    counterBrief: '反震彈射先碎鱗，再用溢療與回聲直灌燼心。',
    rewardExperience: 505,
    rewardGold: 475,
    bossEnemyId: 'ember_whelp',
    guardEnemyIds: ['shrine_drake'],
    bossPhases: [
      {
        id: 'ember-heart-rend',
        bossEnemyId: 'ember_whelp',
        activateAfterEnemyIds: ['shrine_drake'],
        pressureLabel: '龍印處刑窗',
        cueId: 'ember-heart-rend',
      },
    ],
    cues: {
      opening: { cueId: 'trigger', label: '燼心甦醒', palette: 'ember-violet' },
      execution: { cueId: 'boss-execution', label: '龍印撕裂', palette: 'dragon-crimson' },
      annihilation: { cueId: 'annihilation', label: '聖祠日墜', palette: 'sun-white' },
    },
    enemies: [rewards.whelp, rewards.drake],
    annihilationChest: equipment(
      'shrine_annihilation_signet',
      '燼心殲滅指環',
      'accessory',
      'healing',
      28,
      ['retaliation', 'ricochet', 'healing_overflow', 'command_storm'],
      ['overflow_reserve', 'steel_echo'],
    ),
  }),
  hunt({
    id: 'ashen-aisle-hunt',
    questId: 'ashen_aisle',
    pressureLabel: '葬火合唱：每段詠唱都讓龍鱗共振加劇。',
    counterBrief: '彈射沿鱗片跳轉，溢療與回聲把合唱翻成爆音。',
    rewardExperience: 680,
    rewardGold: 640,
    guardEnemyIds: ['shrine_drake', 'ash_cantor'],
    cues: {
      opening: { cueId: 'stack', label: '萬燼合唱', palette: 'ash-gold' },
      execution: { cueId: 'break', label: '聖歌反爆', palette: 'choir-white' },
      annihilation: { cueId: 'annihilation', label: '中殿寂滅', palette: 'silent-gold' },
    },
    enemies: [rewards.drake, rewards.cantor],
    annihilationChest: equipment(
      'aisle_annihilation_reliquary',
      '中殿殲滅聖匣',
      'accessory',
      'healing',
      34,
      ['retaliation', 'ricochet', 'healing_overflow', 'command_storm'],
      ['ricochet_focus', 'overflow_reserve'],
    ),
  }),
  hunt({
    id: 'solar-nest-hunt',
    questId: 'solar_nest',
    pressureLabel: '日輪殘影：每次俯衝都留下下一輪烈陽軌跡。',
    counterBrief: '先讓詠唱者失聲，再沿俯衝軌跡反震與彈射追殺。',
    rewardExperience: 920,
    rewardGold: 880,
    guardEnemyIds: ['ash_cantor', 'solar_wyvern'],
    cues: {
      opening: { cueId: 'hit', label: '日輪俯衝', palette: 'solar-orange' },
      execution: { cueId: 'overkill', label: '逐日追殺', palette: 'sun-gold' },
      annihilation: { cueId: 'annihilation', label: '龍巢日墜', palette: 'solar-white' },
    },
    enemies: [rewards.cantor, rewards.wyvern],
    annihilationChest: equipment(
      'solar_annihilation_wings',
      '日輪殲滅翼章',
      'armor',
      'attack',
      52,
      ['retaliation', 'ricochet', 'healing_overflow', 'command_storm'],
      ['retaliation_bash', 'steel_echo'],
    ),
  }),
];
