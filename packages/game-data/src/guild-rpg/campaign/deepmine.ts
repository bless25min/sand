import type {
  EnemyDefinition,
  HuntDefinition,
  HuntEnemyRewards,
  QuestDefinition,
} from '@expedition/shared-types';

import { equipment, hunt, huntEnemy, quest } from './factories';

const enemies = {
  guard: {
    id: 'goblin_guard',
    name: '哥布林盾手',
    stats: { hp: 185, attack: 25, defense: 15, speed: 8, healing: 0 },
  },
  raider: {
    id: 'goblin_raider',
    name: '哥布林襲擊者',
    stats: { hp: 145, attack: 31, defense: 9, speed: 13, healing: 0 },
  },
  slinger: {
    id: 'goblin_slinger',
    name: '哥布林投石手',
    stats: { hp: 125, attack: 34, defense: 7, speed: 14, healing: 0 },
  },
  alchemist: {
    id: 'powder_alchemist',
    name: '黑火煉金師',
    stats: { hp: 310, attack: 58, defense: 12, speed: 16, healing: 0 },
  },
  tyrant: {
    id: 'ore_tyrant',
    name: '礦脈暴君',
    stats: { hp: 980, attack: 82, defense: 42, speed: 10, healing: 0 },
  },
} satisfies Record<string, EnemyDefinition>;

const rewards = {
  guard: huntEnemy({
    enemyId: enemies.guard.id,
    spectacle: {
      family: 'deepmine',
      role: 'boss',
      palette: 'iron-green',
      aura: 'shield-rivet',
      defeat: 'armor-shatter',
    },
    traits: [
      {
        id: 'sealed_bulwark',
        name: '封礦盾陣',
        description: '護衛存活時維持減傷；元素轉換可穿透盾芯。',
        counterBuildIds: ['healing_overflow'],
        pressureMultiplier: 1.35,
        guardedByEnemyIds: ['goblin_raider', 'goblin_slinger'],
        guardedDamageMultiplier: 0.5,
        vulnerableTransform: 'convert_element',
        vulnerabilityMultiplier: 1.6,
      },
    ],
    material: { id: 'guard_rivet', name: '盾手鉚釘', baseQuantity: 2 },
    equipment: [
      equipment(
        'goblin_wall',
        '礦坑盾甲',
        'armor',
        'defense',
        11,
        ['retaliation'],
        ['retaliation_bash'],
      ),
    ],
  }),
  raider: huntEnemy({
    enemyId: enemies.raider.id,
    spectacle: {
      family: 'deepmine',
      role: 'brute',
      palette: 'rust-red',
      aura: 'charge-sparks',
      defeat: 'blade-tumble',
    },
    traits: [
      {
        id: 'reckless_charge',
        name: '魯莽衝鋒',
        description: '連斬會暴露反擊與鋼鐵回聲窗口。',
        counterBuildIds: ['retaliation', 'command_storm'],
        pressureMultiplier: 1.5,
        vulnerableTransform: 'repeat',
        vulnerabilityMultiplier: 1.55,
      },
    ],
    material: { id: 'raider_edge', name: '襲擊者刃片', baseQuantity: 1 },
    equipment: [
      equipment('raider_blade', '礦坑襲刃', 'weapon', 'attack', 5, [
        'retaliation',
        'command_storm',
      ]),
    ],
  }),
  slinger: huntEnemy({
    enemyId: enemies.slinger.id,
    spectacle: {
      family: 'deepmine',
      role: 'artillery',
      palette: 'powder-yellow',
      aura: 'stone-arc',
      defeat: 'shrapnel-scatter',
    },
    traits: [
      {
        id: 'echoing_gallery',
        name: '礦壁彈道',
        description: '狹窄礦道會放大 Ricochet，彈射反覆命中後排。',
        counterBuildIds: ['ricochet'],
        pressureMultiplier: 1.2,
        vulnerableTransform: 'ricochet',
        vulnerabilityMultiplier: 1.7,
      },
    ],
    material: { id: 'slinger_cord', name: '投石索繩', baseQuantity: 1 },
    equipment: [
      equipment(
        'slinger_charm',
        '彈道護符',
        'accessory',
        'speed',
        4,
        ['ricochet'],
        ['ricochet_focus'],
      ),
    ],
  }),
  alchemist: huntEnemy({
    enemyId: enemies.alchemist.id,
    spectacle: {
      family: 'deepmine',
      role: 'artillery',
      palette: 'blackfire-lime',
      aura: 'powder-fuse',
      defeat: 'flask-chainburst',
    },
    traits: [
      {
        id: 'volatile_formula',
        name: '連鎖黑火',
        description: '元素轉換點燃藥液，CopyNext 會把爆炸複寫全場。',
        counterBuildIds: ['healing_overflow', 'command_storm'],
        pressureMultiplier: 1.75,
        vulnerableTransform: 'copy_next',
        vulnerabilityMultiplier: 1.85,
      },
    ],
    material: { id: 'blackfire_powder', name: '黑火藥晶', baseQuantity: 3 },
    equipment: [
      equipment(
        'alchemist_satchel',
        '連爆煉金腰囊',
        'accessory',
        'attack',
        18,
        ['healing_overflow', 'command_storm'],
        ['overflow_reserve', 'steel_echo'],
      ),
    ],
  }),
  tyrant: huntEnemy({
    enemyId: enemies.tyrant.id,
    spectacle: {
      family: 'deepmine',
      role: 'boss',
      palette: 'molten-iron',
      aura: 'ore-throne',
      defeat: 'throne-collapse',
    },
    traits: [
      {
        id: 'living_ore_throne',
        name: '活礦鐵座',
        description: '鐵座吞噬爆粉重鑄護甲；Repeat 與 Ricochet 可連續震碎礦層。',
        counterBuildIds: ['retaliation', 'ricochet'],
        pressureMultiplier: 2,
        guardedByEnemyIds: ['goblin_guard', 'powder_alchemist'],
        guardedDamageMultiplier: 0.38,
        vulnerableTransform: 'repeat',
        vulnerabilityMultiplier: 2,
      },
    ],
    material: { id: 'tyrant_oreheart', name: '暴君礦心', baseQuantity: 5 },
    equipment: [
      equipment(
        'tyrant_hammer',
        '鐵座碎城槌',
        'weapon',
        'attack',
        8,
        ['retaliation', 'ricochet'],
        ['retaliation_bash', 'ricochet_focus'],
      ),
    ],
  }),
} satisfies Record<string, HuntEnemyRewards>;

export const DEEPMINE_QUESTS: readonly QuestDefinition[] = [
  quest({
    id: 'abandoned_mine',
    zoneId: 'deepmine_front',
    name: '廢棄礦坑',
    description: '擊退盤據礦坑的哥布林突擊隊，轟開封礦盾芯。',
    recommendedLevel: 4,
    rewardExperience: 168,
    rewardGold: 146,
    enemies: [enemies.guard, enemies.raider, enemies.slinger],
  }),
  quest({
    id: 'blast_gallery',
    zoneId: 'deepmine_front',
    name: '爆破長廊',
    description: '在黑火引線燒盡前，讓整條長廊先一步連爆。',
    recommendedLevel: 5,
    rewardExperience: 230,
    rewardGold: 205,
    enemies: [enemies.raider, enemies.slinger, enemies.alchemist],
  }),
  quest({
    id: 'iron_throne',
    zoneId: 'deepmine_front',
    name: '鐵座暴君',
    description: '斷開盾牆與黑火補給，把活礦王座砸成戰利品。',
    recommendedLevel: 6,
    rewardExperience: 360,
    rewardGold: 320,
    enemies: [enemies.guard, enemies.alchemist, enemies.tyrant],
  }),
];

export const DEEPMINE_HUNTS: readonly HuntDefinition[] = [
  hunt({
    id: 'mine-hunt',
    questId: 'abandoned_mine',
    pressureLabel: '封礦盾陣：遠近護衛讓盾芯持續增厚。',
    counterBrief: '反震襲擊者、彈射投石手，再用聖輝穿盾。',
    rewardExperience: 168,
    rewardGold: 146,
    bossEnemyId: 'goblin_guard',
    guardEnemyIds: ['goblin_raider', 'goblin_slinger'],
    bossPhases: [
      {
        id: 'guard-core-break',
        bossEnemyId: 'goblin_guard',
        activateAfterEnemyIds: ['goblin_raider', 'goblin_slinger'],
        pressureLabel: '盾芯處刑窗',
        cueId: 'goblin-guard-core-break',
      },
    ],
    cues: {
      opening: { cueId: 'trigger', label: '封礦警鐘', palette: 'ore-green' },
      execution: { cueId: 'break', label: '盾芯破礦', palette: 'forge-orange' },
      annihilation: { cueId: 'annihilation', label: '礦廊崩滅', palette: 'molten-gold' },
    },
    enemies: [rewards.guard, rewards.raider, rewards.slinger],
    annihilationChest: equipment(
      'mine_annihilation_standard',
      '封礦殲滅戰旗',
      'accessory',
      'defense',
      20,
      ['retaliation', 'ricochet', 'healing_overflow', 'command_storm'],
      ['retaliation_bash', 'overflow_reserve'],
    ),
  }),
  hunt({
    id: 'blast-gallery-hunt',
    questId: 'blast_gallery',
    pressureLabel: '引線倒數：每個存活敵人都讓黑火連爆加速。',
    counterBrief: '彈射折返礦壁、溢療點燃藥液、回聲複寫爆點。',
    rewardExperience: 230,
    rewardGold: 205,
    guardEnemyIds: ['goblin_raider', 'goblin_slinger', 'powder_alchemist'],
    cues: {
      opening: { cueId: 'trigger', label: '引線全燃', palette: 'powder-lime' },
      execution: { cueId: 'break', label: '黑火逆爆', palette: 'toxic-orange' },
      annihilation: { cueId: 'annihilation', label: '長廊連崩', palette: 'blast-white' },
    },
    enemies: [rewards.raider, rewards.slinger, rewards.alchemist],
    annihilationChest: equipment(
      'gallery_annihilation_fuse',
      '長廊殲滅火環',
      'accessory',
      'speed',
      22,
      ['retaliation', 'ricochet', 'healing_overflow', 'command_storm'],
      ['ricochet_focus', 'steel_echo'],
    ),
  }),
  hunt({
    id: 'iron-throne-hunt',
    questId: 'iron_throne',
    pressureLabel: '活礦重鑄：盾手與煉金師為鐵座補回外殼。',
    counterBrief: '先拆盾與藥，再用反震彈射把王座層層砸穿。',
    rewardExperience: 360,
    rewardGold: 320,
    bossEnemyId: 'ore_tyrant',
    guardEnemyIds: ['goblin_guard', 'powder_alchemist'],
    bossPhases: [
      {
        id: 'ore-throne-execution',
        bossEnemyId: 'ore_tyrant',
        activateAfterEnemyIds: ['goblin_guard', 'powder_alchemist'],
        pressureLabel: '鐵座粉碎窗',
        cueId: 'ore-throne-execution',
      },
    ],
    cues: {
      opening: { cueId: 'stack', label: '活礦登基', palette: 'iron-ember' },
      execution: { cueId: 'boss-execution', label: '鐵座粉碎', palette: 'molten-white' },
      annihilation: { cueId: 'annihilation', label: '深礦斷脈', palette: 'ore-gold' },
    },
    enemies: [rewards.guard, rewards.alchemist, rewards.tyrant],
    annihilationChest: equipment(
      'tyrant_annihilation_core',
      '暴君殲滅礦核',
      'accessory',
      'attack',
      38,
      ['retaliation', 'ricochet', 'healing_overflow', 'command_storm'],
      ['retaliation_bash', 'steel_echo'],
    ),
  }),
];
