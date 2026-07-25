import type {
  GuildEquipmentSlot,
  GuildStatKey,
  HuntDefinition,
  HuntEquipmentDefinition,
} from '@expedition/shared-types';

function equipment(
  id: string,
  name: string,
  slot: GuildEquipmentSlot,
  mainStat: GuildStatKey,
  baseValue: number,
  ruleIds: readonly string[] = [],
): HuntEquipmentDefinition {
  return { id, name, slot, mainStat, baseValue, ...(ruleIds.length ? { ruleIds } : {}) };
}

export const GUILD_HUNTS: readonly HuntDefinition[] = [
  {
    id: 'border-pack-hunt',
    questId: 'border_pack',
    rewardExperience: 42,
    rewardGold: 28,
    bossEnemyId: 'wolf_alpha',
    guardEnemyIds: ['wolf_scout', 'wolf_hunter'],
    enemies: [
      {
        enemyId: 'wolf_scout',
        traits: [
          {
            id: 'scatter_gap',
            name: '彈射缺口',
            description: '高速散陣會放大 Ricochet 傷害。',
            counterBuildIds: ['ricochet'],
            pressureMultiplier: 1.15,
            vulnerableTransform: 'ricochet',
            vulnerabilityMultiplier: 1.5,
          },
        ],
        material: { id: 'scout_fang', name: '斥候狼牙', baseQuantity: 1 },
        equipment: [
          equipment('scout_charm', '斥候追風符', 'accessory', 'speed', 3, ['ricochet_focus']),
        ],
      },
      {
        enemyId: 'wolf_hunter',
        traits: [
          {
            id: 'riposte_gap',
            name: '反擊破綻',
            description: '獵手追擊後會暴露給 Repeat 反震。',
            counterBuildIds: ['retaliation'],
            pressureMultiplier: 1.25,
            vulnerableTransform: 'repeat',
            vulnerabilityMultiplier: 1.5,
          },
        ],
        material: { id: 'hunter_sinew', name: '獵手筋腱', baseQuantity: 1 },
        equipment: [equipment('hunter_bow', '灰牙獵弓', 'weapon', 'attack', 9, ['ricochet_focus'])],
      },
      {
        enemyId: 'wolf_alpha',
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
          equipment('alpha_plate', '首領護胸', 'armor', 'defense', 8, ['retaliation_bash']),
        ],
      },
    ],
    annihilationChest: equipment(
      'alpha_annihilation_crown',
      '灰牙殲滅王冠',
      'accessory',
      'attack',
      12,
      ['steel_echo', 'ricochet_focus'],
    ),
  },
  {
    id: 'mine-hunt',
    questId: 'abandoned_mine',
    rewardExperience: 68,
    rewardGold: 46,
    bossEnemyId: 'goblin_guard',
    guardEnemyIds: ['goblin_raider', 'goblin_slinger'],
    enemies: [
      {
        enemyId: 'goblin_guard',
        traits: [
          {
            id: 'sealed_bulwark',
            name: '封礦盾陣',
            description: '襲擊者與投石手存活時維持減傷；元素轉換可穿透盾芯。',
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
          equipment('goblin_wall', '礦坑盾甲', 'armor', 'defense', 11, ['retaliation_bash']),
        ],
      },
      {
        enemyId: 'goblin_raider',
        traits: [
          {
            id: 'reckless_charge',
            name: '魯莽衝鋒',
            description: '高壓連斬會暴露反擊窗口，Repeat 可把衝勢完整送回。',
            counterBuildIds: ['retaliation'],
            pressureMultiplier: 1.5,
            vulnerableTransform: 'repeat',
            vulnerabilityMultiplier: 1.55,
          },
        ],
        material: { id: 'raider_edge', name: '襲擊者刃片', baseQuantity: 1 },
        equipment: [equipment('raider_blade', '礦坑襲刃', 'weapon', 'attack', 11)],
      },
      {
        enemyId: 'goblin_slinger',
        traits: [
          {
            id: 'echoing_gallery',
            name: '礦壁彈道',
            description: '狹窄礦道會放大 Ricochet，彈射可反覆命中後排。',
            counterBuildIds: ['ricochet'],
            pressureMultiplier: 1.2,
            vulnerableTransform: 'ricochet',
            vulnerabilityMultiplier: 1.7,
          },
        ],
        material: { id: 'slinger_cord', name: '投石索繩', baseQuantity: 1 },
        equipment: [
          equipment('slinger_charm', '彈道護符', 'accessory', 'speed', 4, ['ricochet_focus']),
        ],
      },
    ],
    annihilationChest: equipment(
      'mine_annihilation_standard',
      '封礦殲滅戰旗',
      'accessory',
      'defense',
      15,
      ['retaliation_bash', 'overflow_reserve'],
    ),
  },
  {
    id: 'dragon-shrine-hunt',
    questId: 'dragon_shrine',
    rewardExperience: 105,
    rewardGold: 75,
    bossEnemyId: 'ember_whelp',
    guardEnemyIds: ['shrine_drake'],
    enemies: [
      {
        enemyId: 'ember_whelp',
        traits: [
          {
            id: 'sealed_ember_heart',
            name: '封印燼心',
            description: '聖祠飛龍存活時封住核心；HealOverflow 轉換可越過龍焰護層。',
            counterBuildIds: ['healing_overflow'],
            pressureMultiplier: 1.65,
            guardedByEnemyIds: ['shrine_drake'],
            guardedDamageMultiplier: 0.45,
            vulnerableTransform: 'convert_element',
            vulnerabilityMultiplier: 1.7,
          },
        ],
        material: { id: 'ember_core', name: '燼火龍核', baseQuantity: 3 },
        equipment: [
          equipment('ember_staff', '燼火溢流杖', 'weapon', 'healing', 14, ['overflow_reserve']),
        ],
      },
      {
        enemyId: 'shrine_drake',
        traits: [
          {
            id: 'resonant_scale',
            name: '共鳴龍鱗',
            description: '連續鱗片會傳遞彈射，Ricochet 可沿著護層擴散。',
            counterBuildIds: ['ricochet'],
            pressureMultiplier: 1.4,
            vulnerableTransform: 'ricochet',
            vulnerabilityMultiplier: 1.55,
          },
          {
            id: 'tail_counter_window',
            name: '甩尾空檔',
            description: '甩尾後會留下反震窗口，Repeat 能追上短暫破綻。',
            counterBuildIds: ['retaliation'],
            vulnerableTransform: 'repeat',
            vulnerabilityMultiplier: 1.45,
          },
        ],
        material: { id: 'drake_scale', name: '聖祠龍鱗', baseQuantity: 2 },
        equipment: [equipment('drake_mail', '聖祠鱗甲', 'armor', 'hp', 42, ['steel_echo'])],
      },
    ],
    annihilationChest: equipment(
      'shrine_annihilation_signet',
      '燼心殲滅指環',
      'accessory',
      'healing',
      18,
      ['overflow_reserve', 'steel_echo'],
    ),
  },
];
