import type {
  EnemyDefinition,
  HuntDefinition,
  HuntEnemyRewards,
  QuestDefinition,
} from '@expedition/shared-types';

import { equipment, hunt, huntEnemy, quest } from './factories';

const enemies = {
  scout: {
    id: 'wolf_scout',
    name: '灰牙斥候',
    stats: { hp: 105, attack: 21, defense: 7, speed: 13, healing: 0 },
  },
  hunter: {
    id: 'wolf_hunter',
    name: '灰牙獵手',
    stats: { hp: 125, attack: 24, defense: 8, speed: 11, healing: 0 },
  },
  alpha: {
    id: 'wolf_alpha',
    name: '灰牙首領',
    stats: { hp: 175, attack: 27, defense: 11, speed: 9, healing: 0 },
  },
  nightstalker: {
    id: 'wolf_nightstalker',
    name: '月影獵殺者',
    stats: { hp: 250, attack: 46, defense: 14, speed: 18, healing: 0 },
  },
  matron: {
    id: 'fang_matron',
    name: '赤牙女王',
    stats: { hp: 720, attack: 65, defense: 28, speed: 16, healing: 0 },
  },
} satisfies Record<string, EnemyDefinition>;

const rewards = {
  scout: huntEnemy({
    enemyId: enemies.scout.id,
    spectacle: {
      family: 'greyfang',
      role: 'skirmisher',
      palette: 'moon-silver',
      aura: 'wind-streak',
      defeat: 'fang-scatter',
    },
    traits: [
      {
        id: 'scatter_gap',
        name: '彈射缺口',
        description: '高速散陣會放大 Ricochet 與 CopyNext 的追擊。',
        counterBuildIds: ['ricochet', 'command_storm'],
        pressureMultiplier: 1.15,
        vulnerableTransform: 'ricochet',
        vulnerabilityMultiplier: 1.5,
      },
    ],
    material: { id: 'scout_fang', name: '斥候狼牙', baseQuantity: 1 },
    equipment: [
      equipment(
        'scout_charm',
        '斥候追風符',
        'accessory',
        'speed',
        3,
        ['ricochet'],
        ['ricochet_focus'],
      ),
    ],
  }),
  hunter: huntEnemy({
    enemyId: enemies.hunter.id,
    spectacle: {
      family: 'greyfang',
      role: 'brute',
      palette: 'rust-blood',
      aura: 'hunt-mark',
      defeat: 'claw-break',
    },
    traits: [
      {
        id: 'riposte_gap',
        name: '反擊破綻',
        description: '獵手追擊後暴露給 Repeat 反震。',
        counterBuildIds: ['retaliation'],
        pressureMultiplier: 1.25,
        vulnerableTransform: 'repeat',
        vulnerabilityMultiplier: 1.5,
      },
    ],
    material: { id: 'hunter_sinew', name: '獵手筋腱', baseQuantity: 1 },
    equipment: [
      equipment('hunter_bow', '灰牙獵弓', 'weapon', 'attack', 9, ['ricochet'], ['ricochet_focus']),
    ],
  }),
  alpha: huntEnemy({
    enemyId: enemies.alpha.id,
    spectacle: {
      family: 'greyfang',
      role: 'boss',
      palette: 'alpha-amber',
      aura: 'pack-crown',
      defeat: 'alpha-collapse',
    },
    traits: [
      {
        id: 'pack_bulwark',
        name: '狼群壁壘',
        description: '護衛存活時減傷；聖輝轉換能撕開核心。',
        counterBuildIds: ['healing_overflow'],
        pressureMultiplier: 1.5,
        guardedByEnemyIds: ['wolf_scout', 'wolf_hunter'],
        guardedDamageMultiplier: 0.55,
        vulnerableTransform: 'convert_element',
        vulnerabilityMultiplier: 1.5,
      },
    ],
    material: { id: 'alpha_core', name: '首領狼核', baseQuantity: 2 },
    equipment: [
      equipment(
        'alpha_plate',
        '首領護胸',
        'armor',
        'defense',
        8,
        ['retaliation'],
        ['retaliation_bash'],
      ),
    ],
  }),
  nightstalker: huntEnemy({
    enemyId: enemies.nightstalker.id,
    spectacle: {
      family: 'greyfang',
      role: 'skirmisher',
      palette: 'eclipse-violet',
      aura: 'moon-blink',
      defeat: 'shadow-rip',
    },
    traits: [
      {
        id: 'eclipse_hide',
        name: '蝕月潛行',
        description: '潛行高壓可被溢療聖光直接翻出。',
        counterBuildIds: ['healing_overflow'],
        pressureMultiplier: 1.55,
        vulnerableTransform: 'convert_element',
        vulnerabilityMultiplier: 1.8,
      },
    ],
    material: { id: 'eclipse_pelt', name: '蝕月狼皮', baseQuantity: 2 },
    equipment: [
      equipment(
        'nightstalker_cloak',
        '月蝕獵殺披風',
        'armor',
        'speed',
        12,
        ['healing_overflow', 'command_storm'],
        ['overflow_reserve', 'steel_echo'],
      ),
    ],
  }),
  matron: huntEnemy({
    enemyId: enemies.matron.id,
    spectacle: {
      family: 'greyfang',
      role: 'boss',
      palette: 'blood-moon',
      aura: 'red-crown',
      defeat: 'royal-fangburst',
    },
    traits: [
      {
        id: 'red_crown_echo',
        name: '赤冠回嘯',
        description: '王嚎分裂成狼影；Ricochet 與鋼鐵回聲能連續點爆。',
        counterBuildIds: ['ricochet', 'command_storm'],
        pressureMultiplier: 1.9,
        guardedByEnemyIds: ['wolf_hunter', 'wolf_nightstalker'],
        guardedDamageMultiplier: 0.42,
        vulnerableTransform: 'copy_next',
        vulnerabilityMultiplier: 1.9,
      },
    ],
    material: { id: 'matron_crown', name: '赤牙王冠碎片', baseQuantity: 4 },
    equipment: [
      equipment(
        'matron_fangs',
        '赤牙雙王刃',
        'weapon',
        'attack',
        24,
        ['ricochet', 'command_storm'],
        ['ricochet_focus', 'steel_echo'],
      ),
    ],
  }),
} satisfies Record<string, HuntEnemyRewards>;

export const FRONTIER_QUESTS: readonly QuestDefinition[] = [
  quest({
    id: 'border_pack',
    zoneId: 'greyfang_frontier',
    name: '邊境狼群',
    description: '壓制侵入驛道的灰狼群，打開孤王處刑窗。',
    recommendedLevel: 1,
    rewardExperience: 42,
    rewardGold: 28,
    enemies: [enemies.scout, enemies.hunter, enemies.alpha],
  }),
  quest({
    id: 'moonroad_pursuit',
    zoneId: 'greyfang_frontier',
    name: '月路追獵',
    description: '追進月影伏擊圈，用連鎖接力把獵殺者逼出黑暗。',
    recommendedLevel: 2,
    rewardExperience: 72,
    rewardGold: 52,
    enemies: [enemies.scout, enemies.hunter, enemies.nightstalker],
  }),
  quest({
    id: 'red_fang_den',
    zoneId: 'greyfang_frontier',
    name: '赤牙王巢',
    description: '撕開赤冠狼影，在血月下完成整區殲滅。',
    recommendedLevel: 3,
    rewardExperience: 125,
    rewardGold: 96,
    enemies: [enemies.hunter, enemies.nightstalker, enemies.matron],
  }),
];

export const FRONTIER_HUNTS: readonly HuntDefinition[] = [
  hunt({
    id: 'border-pack-hunt',
    questId: 'border_pack',
    pressureLabel: '狼群護王：先斬雙衛，再開孤王處刑窗。',
    counterBrief: '彈射清斥候、反震折獵手、聖輝撕首領。',
    rewardExperience: 42,
    rewardGold: 28,
    bossEnemyId: 'wolf_alpha',
    guardEnemyIds: ['wolf_scout', 'wolf_hunter'],
    bossPhases: [
      {
        id: 'alpha-execution',
        bossEnemyId: 'wolf_alpha',
        activateAfterEnemyIds: ['wolf_scout', 'wolf_hunter'],
        pressureLabel: '孤王處刑窗',
        cueId: 'wolf-alpha-execution',
      },
    ],
    cues: {
      opening: { cueId: 'stack', label: '月下圍獵', palette: 'moon-iron' },
      execution: { cueId: 'boss-execution', label: '孤王處刑', palette: 'blood-amber' },
      annihilation: { cueId: 'annihilation', label: '狼群抹除', palette: 'gold-fang' },
    },
    enemies: [rewards.scout, rewards.hunter, rewards.alpha],
    annihilationChest: equipment(
      'alpha_annihilation_crown',
      '灰牙殲滅王冠',
      'accessory',
      'attack',
      12,
      ['retaliation', 'ricochet', 'healing_overflow', 'command_storm'],
      ['steel_echo', 'ricochet_focus'],
    ),
  }),
  hunt({
    id: 'moonroad-hunt',
    questId: 'moonroad_pursuit',
    pressureLabel: '月影換位：獵殺者每次轉位都疊高伏擊壓力。',
    counterBrief: '先用彈射掃斥候，再以反震與聖輝逼出月影。',
    rewardExperience: 72,
    rewardGold: 52,
    guardEnemyIds: ['wolf_scout', 'wolf_hunter', 'wolf_nightstalker'],
    cues: {
      opening: { cueId: 'hit', label: '月路封鎖', palette: 'eclipse-blue' },
      execution: { cueId: 'break', label: '獵影現形', palette: 'violet-silver' },
      annihilation: { cueId: 'annihilation', label: '月路清空', palette: 'moon-white' },
    },
    enemies: [rewards.scout, rewards.hunter, rewards.nightstalker],
    annihilationChest: equipment(
      'moonroad_annihilation_boots',
      '月路殲滅戰靴',
      'armor',
      'speed',
      16,
      ['retaliation', 'ricochet', 'healing_overflow', 'command_storm'],
      ['steel_echo', 'overflow_reserve'],
    ),
  }),
  hunt({
    id: 'red-fang-hunt',
    questId: 'red_fang_den',
    pressureLabel: '赤冠回嘯：女王借存活狼影反覆重鑄王冠。',
    counterBrief: '獵手、月影、女王依序斬首，回聲與彈射轟碎赤冠。',
    rewardExperience: 125,
    rewardGold: 96,
    bossEnemyId: 'fang_matron',
    guardEnemyIds: ['wolf_hunter', 'wolf_nightstalker'],
    bossPhases: [
      {
        id: 'matron-coronation',
        bossEnemyId: 'fang_matron',
        activateAfterEnemyIds: ['wolf_hunter', 'wolf_nightstalker'],
        pressureLabel: '赤冠斷首窗',
        cueId: 'fang-matron-coronation',
      },
    ],
    cues: {
      opening: { cueId: 'trigger', label: '赤月加冕', palette: 'blood-moon' },
      execution: { cueId: 'boss-execution', label: '王冠斷裂', palette: 'crown-gold' },
      annihilation: { cueId: 'annihilation', label: '赤牙絕嗣', palette: 'royal-white' },
    },
    enemies: [rewards.hunter, rewards.nightstalker, rewards.matron],
    annihilationChest: equipment(
      'matron_annihilation_mantle',
      '赤牙殲滅王披',
      'armor',
      'attack',
      28,
      ['retaliation', 'ricochet', 'healing_overflow', 'command_storm'],
      ['retaliation_bash', 'steel_echo'],
    ),
  }),
];
