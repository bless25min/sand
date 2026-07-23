import type {
  GameGenome,
  GameModuleDefinition,
  GameThreat,
  ModuleRoleId,
} from '@expedition/shared-types';
import { WORLD_RULE_IDS } from '@expedition/shared-types';

import { createSeededRandom } from '../../rng/seeded-random';

const moduleRows: ReadonlyArray<
  readonly [string, ModuleRoleId, GameModuleDefinition['trigger'], GameModuleDefinition['effect']]
> = [
  ['脈衝核心', 'PRODUCER', 'ROUND_START', 'ADD_PROGRESS'],
  ['回聲引擎', 'PRODUCER', 'FIXED_TIME', 'ADD_PROGRESS'],
  ['臨界繼電器', 'PRODUCER', 'RESOURCE_THRESHOLD', 'DAMAGE_THREAT'],
  ['共振橋', 'AMPLIFIER', 'ADJACENT_TRIGGER', 'AMPLIFY_NEXT'],
  ['雙生頻道', 'AMPLIFIER', 'FIXED_TIME', 'SPEED_UP'],
  ['冷卻井', 'STABILIZER', 'ROUND_START', 'REDUCE_INSTABILITY'],
  ['平衡閥', 'STABILIZER', 'RESOURCE_THRESHOLD', 'REDUCE_INSTABILITY'],
  ['修復協定', 'DEFENSE', 'DAMAGED', 'REPAIR_INTEGRITY'],
  ['隔離壁', 'DEFENSE', 'ROUND_START', 'PROTECT'],
  ['重啟種子', 'DEFENSE', 'DISABLED', 'REVIVE'],
  ['熵交換器', 'CONVERTER', 'RESOURCE_THRESHOLD', 'CONVERT'],
  ['信用虹吸', 'CONVERTER', 'ADJACENT_TRIGGER', 'ADD_INSTABILITY'],
];

function cleanPrompt(prompt: string): string {
  const clean = prompt
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean.slice(0, 32) || '無名異常';
}

function createModules(seed: string): GameModuleDefinition[] {
  const random = createSeededRandom(`${seed}:modules`);
  return moduleRows.map(([name, role, trigger, effect], index) => ({
    id: `module-${index + 1}`,
    name,
    description: `${name}會將系統壓力改寫成可預測的連鎖反應。`,
    role,
    trigger,
    effect,
    target: index % 3 === 0 ? 'ADJACENT' : index % 3 === 1 ? 'RIGHT' : 'SELF',
    baseValue: 4 + random.nextInt(0, 5),
    cost: 4 + (index % 5),
    cooldown: index % 3,
    ...(index === 4 ? { repeatOnce: true } : {}),
  }));
}

function createThreats(seed: string): GameThreat[] {
  const random = createSeededRandom(`${seed}:threats`);
  const modifiers: GameThreat['modifier'][] = [
    'NONE',
    'NONE',
    'NONE',
    'BLOCK_EDGE',
    'OVERLOAD',
    'COUNTER_ROLE',
    'LOCK_TOP_OUTPUT',
  ];
  return Array.from({ length: 7 }, (_, index) => {
    const round = index + 1;
    return {
      id: `threat-${round}`,
      round,
      name: round === 7 ? '自我修正核心' : `異常層級 ${round}`,
      telegraph:
        round === 7 ? '先封鎖最高輸出格，再改寫水平方向。' : `要求 ${12 + index * 4} 點突破。`,
      kind: round === 7 ? 'BOSS' : round === 6 ? 'ELITE' : 'NORMAL',
      targetProgress: 12 + index * 4,
      integrityDamage: 6 + index * 2 + random.nextInt(0, 2),
      instabilityGain: 3 + index,
      modifier: modifiers[index]!,
      ...(round === 7
        ? {
            phaseTwoModifier:
              random.nextInt(0, 1) === 0
                ? ('REVERSE_HORIZONTAL' as const)
                : ('PUNISH_REPEAT' as const),
          }
        : {}),
    };
  });
}

export function createFallbackGameGenome(input: { prompt: string; seed: string }): GameGenome {
  const theme = cleanPrompt(input.prompt);
  const random = createSeededRandom(`${input.seed}:${theme}:rules`);
  const firstRule = random.nextInt(0, WORLD_RULE_IDS.length - 1);
  const secondRule =
    (firstRule + 1 + random.nextInt(0, WORLD_RULE_IDS.length - 2)) % WORLD_RULE_IDS.length;

  return {
    version: 1,
    seed: input.seed,
    title: `${theme}：破壞協定`,
    premise: `你被投入「${theme}」，只能用有限模組找出規則漏洞。`,
    aliases: {
      PROGRESS: '突破',
      INTEGRITY: '完整度',
      INSTABILITY: '失控值',
      CREDITS: '運算額度',
    },
    winDescription: '在完整度歸零前擊穿七層規則。',
    failDescription: '完整度歸零或失控值達到上限。',
    rules: [WORLD_RULE_IDS[firstRule]!, WORLD_RULE_IDS[secondRule]!],
    modules: createModules(input.seed),
    threats: createThreats(input.seed),
    counters: [
      { id: 'counter-producer', role: 'PRODUCER', label: '抑制生產模組', outputMultiplier: 0.65 },
      { id: 'counter-amplifier', role: 'AMPLIFIER', label: '切斷增幅模組', outputMultiplier: 0.65 },
      { id: 'counter-converter', role: 'CONVERTER', label: '污染轉換模組', outputMultiplier: 0.65 },
    ],
    endings: {
      victory: { title: '系統已破壞', description: `你讓「${theme}」的規則互相吞噬。` },
      defeat: { title: '系統已修正', description: `「${theme}」封鎖了你的最後一條連鎖。` },
    },
  };
}
