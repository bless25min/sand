import type {
  EnemyDefinition,
  HuntDefinition,
  HuntEnemyRewards,
  QuestDefinition,
} from '@expedition/shared-types';

import { equipment, hunt, huntEnemy, quest } from './factories';

const enemies = {
  lancer: {
    id: 'tempest_lancer',
    name: '暴風槍騎',
    stats: { hp: 880, attack: 118, defense: 44, speed: 23, healing: 0 },
  },
  sentinel: {
    id: 'coil_sentinel',
    name: '線圈守衛',
    stats: { hp: 1040, attack: 96, defense: 68, speed: 13, healing: 0 },
  },
  magus: {
    id: 'arc_magus',
    name: '裂弧魔導',
    stats: { hp: 960, attack: 142, defense: 38, speed: 21, healing: 35 },
  },
  sovereign: {
    id: 'skybreaker_sovereign',
    name: '裂天帝王',
    stats: { hp: 1650, attack: 188, defense: 88, speed: 19, healing: 0 },
  },
} satisfies Record<string, EnemyDefinition>;

const rewards = {
  lancer: huntEnemy({
    enemyId: enemies.lancer.id,
    spectacle: {
      family: 'storm-legion',
      role: 'brute',
      palette: 'tempest-blue',
      aura: 'lance-thundertrail',
      defeat: 'banner-lightning',
    },
    traits: [
      {
        id: 'tempest_charge',
        name: '雷槍衝線',
        description: '衝線留下連續反震與複寫窗口。',
        counterBuildIds: ['retaliation', 'command_storm'],
        pressureMultiplier: 2.2,
        vulnerableTransform: 'repeat',
        vulnerabilityMultiplier: 2.1,
      },
    ],
    material: { id: 'tempest_shaft', name: '暴風槍骨', baseQuantity: 5 },
    equipment: [
      equipment(
        'tempest_lance',
        '暴風貫城槍',
        'weapon',
        'attack',
        58,
        ['retaliation', 'command_storm'],
        ['retaliation_bash', 'steel_echo'],
      ),
    ],
  }),
  sentinel: huntEnemy({
    enemyId: enemies.sentinel.id,
    spectacle: {
      family: 'storm-construct',
      role: 'guardian',
      palette: 'coil-cyan',
      aura: 'magnetic-ring',
      defeat: 'coil-unspool',
    },
    traits: [
      {
        id: 'magnetic_grid',
        name: '磁暴網格',
        description: '電網串起所有目標；Ricochet 與元素轉換可沿網格回灌。',
        counterBuildIds: ['ricochet', 'healing_overflow'],
        pressureMultiplier: 2.05,
        vulnerableTransform: 'ricochet',
        vulnerabilityMultiplier: 2.15,
      },
    ],
    material: { id: 'coil_core', name: '線圈雷核', baseQuantity: 5 },
    equipment: [
      equipment(
        'coil_aegis',
        '磁暴王城盾',
        'armor',
        'defense',
        62,
        ['ricochet', 'healing_overflow'],
        ['ricochet_focus', 'overflow_reserve'],
      ),
    ],
  }),
  magus: huntEnemy({
    enemyId: enemies.magus.id,
    spectacle: {
      family: 'storm-court',
      role: 'artillery',
      palette: 'arc-violet',
      aura: 'chain-sigil',
      defeat: 'sigil-overload',
    },
    traits: [
      {
        id: 'arc_rewrite',
        name: '雷律改寫',
        description: '魔導複寫上一道軍令；Repeat 與 CopyNext 可反過來劫持雷律。',
        counterBuildIds: ['retaliation', 'command_storm'],
        pressureMultiplier: 2.35,
        vulnerableTransform: 'copy_next',
        vulnerabilityMultiplier: 2.25,
      },
    ],
    material: { id: 'arc_script', name: '裂弧律文', baseQuantity: 6 },
    equipment: [
      equipment(
        'arc_codex',
        '裂弧改寫典',
        'accessory',
        'healing',
        54,
        ['retaliation', 'command_storm'],
        ['retaliation_bash', 'steel_echo'],
      ),
    ],
  }),
  sovereign: huntEnemy({
    enemyId: enemies.sovereign.id,
    spectacle: {
      family: 'storm-court',
      role: 'boss',
      palette: 'sovereign-white',
      aura: 'skybreaker-crown',
      defeat: 'thunder-throne-collapse',
    },
    traits: [
      {
        id: 'skybreaker_edict',
        name: '裂天敕令',
        description: '帝王借雙臣把每次命中擴成雷暴；彈射與聖輝可奪回整片天空。',
        counterBuildIds: ['ricochet', 'healing_overflow'],
        pressureMultiplier: 2.8,
        guardedByEnemyIds: ['tempest_lancer', 'arc_magus'],
        guardedDamageMultiplier: 0.55,
        vulnerableTransform: 'convert_element',
        vulnerabilityMultiplier: 2.5,
      },
    ],
    material: { id: 'sovereign_thunderheart', name: '帝王雷心', baseQuantity: 8 },
    equipment: [
      equipment(
        'skybreaker_blade',
        '裂天帝王刃',
        'weapon',
        'attack',
        88,
        ['ricochet', 'healing_overflow'],
        ['ricochet_focus', 'overflow_reserve'],
      ),
    ],
  }),
} satisfies Record<string, HuntEnemyRewards>;

export const STORM_QUESTS: readonly QuestDefinition[] = [
  quest({
    id: 'storm_gate',
    zoneId: 'storm_citadel',
    name: '風暴城門',
    description: '在雷槍衝線與磁暴網格之間轟出進城缺口。',
    recommendedLevel: 10,
    rewardExperience: 1250,
    rewardGold: 1220,
    enemies: [enemies.lancer, enemies.sentinel],
  }),
  quest({
    id: 'chain_vault',
    zoneId: 'storm_citadel',
    name: '鎖雷寶庫',
    description: '劫持雷律、反灌磁網，讓整座寶庫成為連鎖放大器。',
    recommendedLevel: 11,
    rewardExperience: 1680,
    rewardGold: 1660,
    enemies: [enemies.sentinel, enemies.magus],
  }),
  quest({
    id: 'skybreaker_crown',
    zoneId: 'storm_citadel',
    name: '裂天王座',
    description: '斬落雙臣，奪走整片雷雲，在王座前完成最後殲滅。',
    recommendedLevel: 12,
    rewardExperience: 2600,
    rewardGold: 2600,
    enemies: [enemies.lancer, enemies.magus, enemies.sovereign],
  }),
];

export const STORM_HUNTS: readonly HuntDefinition[] = [
  hunt({
    id: 'storm-gate-hunt',
    questId: 'storm_gate',
    pressureLabel: '雷槍磁網：衝鋒軌跡被守衛串成封城電網。',
    counterBrief: '反震衝線、彈射磁網、聖輝與回聲同時灌爆雙核。',
    rewardExperience: 1250,
    rewardGold: 1220,
    guardEnemyIds: ['tempest_lancer', 'coil_sentinel'],
    cues: {
      opening: { cueId: 'stack', label: '王城落雷', palette: 'tempest-blue' },
      execution: { cueId: 'break', label: '城門貫穿', palette: 'coil-white' },
      annihilation: { cueId: 'annihilation', label: '風暴破城', palette: 'storm-gold' },
    },
    enemies: [rewards.lancer, rewards.sentinel],
    annihilationChest: equipment(
      'stormgate_annihilation_banner',
      '破城殲滅雷旗',
      'accessory',
      'attack',
      66,
      ['retaliation', 'ricochet', 'healing_overflow', 'command_storm'],
      ['retaliation_bash', 'ricochet_focus'],
    ),
  }),
  hunt({
    id: 'chain-vault-hunt',
    questId: 'chain_vault',
    pressureLabel: '雷律鎖庫：魔導改寫磁網，每輪都增加一道連鎖。',
    counterBrief: '沿網格彈射、用溢療奪色，再以回聲反寫雷律。',
    rewardExperience: 1680,
    rewardGold: 1660,
    guardEnemyIds: ['coil_sentinel', 'arc_magus'],
    cues: {
      opening: { cueId: 'trigger', label: '萬鏈上鎖', palette: 'arc-violet' },
      execution: { cueId: 'rule-online', label: '雷律劫持', palette: 'cipher-cyan' },
      annihilation: { cueId: 'annihilation', label: '寶庫過載', palette: 'vault-white' },
    },
    enemies: [rewards.sentinel, rewards.magus],
    annihilationChest: equipment(
      'vault_annihilation_key',
      '鎖雷殲滅王鑰',
      'accessory',
      'healing',
      72,
      ['retaliation', 'ricochet', 'healing_overflow', 'command_storm'],
      ['overflow_reserve', 'steel_echo'],
    ),
  }),
  hunt({
    id: 'skybreaker-hunt',
    questId: 'skybreaker_crown',
    pressureLabel: '裂天敕令：雙臣存活時，帝王把每擊擴成全場雷暴。',
    counterBrief: '槍騎、魔導、帝王依序處刑；四套引擎全開奪天。',
    rewardExperience: 2600,
    rewardGold: 2600,
    bossEnemyId: 'skybreaker_sovereign',
    guardEnemyIds: ['tempest_lancer', 'arc_magus'],
    bossPhases: [
      {
        id: 'skybreaker-final-edict',
        bossEnemyId: 'skybreaker_sovereign',
        activateAfterEnemyIds: ['tempest_lancer', 'arc_magus'],
        pressureLabel: '帝王最終處刑窗',
        cueId: 'skybreaker-final-edict',
      },
    ],
    cues: {
      opening: { cueId: 'trigger', label: '裂天敕令', palette: 'sovereign-white' },
      execution: { cueId: 'boss-execution', label: '帝冠斬落', palette: 'thunder-gold' },
      annihilation: { cueId: 'annihilation', label: '萬雷臣服', palette: 'sky-white' },
    },
    enemies: [rewards.lancer, rewards.magus, rewards.sovereign],
    annihilationChest: equipment(
      'skybreaker_annihilation_crown',
      '裂天殲滅帝冠',
      'accessory',
      'attack',
      108,
      ['retaliation', 'ricochet', 'healing_overflow', 'command_storm'],
      ['retaliation_bash', 'ricochet_focus', 'overflow_reserve', 'steel_echo'],
    ),
  }),
];
