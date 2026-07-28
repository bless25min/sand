import type { SkillOutcomePreview } from '@expedition/simulation-core';
import type {
  GuildElement,
  GuildSkillItem,
  SkillSpecialization,
  StatusLayer,
  TriggerCondition,
} from '@expedition/shared-types';

const INTENT_NAMES: Readonly<Record<GuildElement, Readonly<Record<SkillSpecialization, string>>>> =
  {
    fire: {
      blast: '燃爆',
      stack: '引火',
      weaken: '熔甲',
      chain: '火鏈',
      empower: '火勢',
      multistrike: '連焚',
    },
    grass: {
      blast: '毒爆',
      stack: '施毒',
      weaken: '蝕甲',
      chain: '毒鏈',
      empower: '毒勢',
      multistrike: '連蝕',
    },
    water: {
      blast: '潮爆',
      stack: '蓄潮',
      weaken: '沖甲',
      chain: '潮鏈',
      empower: '潮勢',
      multistrike: '連潮',
    },
  };

const TRIGGER_REASONS: Readonly<Record<TriggerCondition, string>> = {
  battle_open: '因為這是戰鬥第一招，額外效果已發動',
  round_open: '本回合剛開始，因此多一次效果',
  first_actor: '本回合第一位出手，因此多一次效果',
  final_actor: '本回合最後一位出手，因此多一次效果',
  after_skill: '本回合已有人出手，因此多一次效果',
  target_burning: '目標正在燃燒，因此多一次效果',
  target_poisoned: '目標帶有毒素，因此多一次效果',
  target_tide: '目標帶有蓄潮，因此多一次效果',
  actor_strengthened: '角色目前已強化，因此多一次效果',
  target_weakened: '目標防禦已削弱，因此多一次效果',
  layer_threshold: '目標狀態已累積足夠，因此多一次效果',
  consume_burn: '消耗目標燃燒，因此產生額外效果',
  consume_poison: '消耗目標毒素，因此產生額外效果',
  consume_tide: '消耗目標蓄潮，因此產生額外效果',
  consume_all_burn: '消耗全部燃燒，因此產生額外效果',
  consume_all_poison: '消耗全部毒素，因此產生額外效果',
  consume_all_tide: '消耗全部蓄潮，因此產生額外效果',
  consume_mixed: '消耗目標狀態，因此產生額外效果',
  on_hit: '命中目標，因此產生額外效果',
  on_repeat_hit: '連續命中，因此產生額外效果',
  on_bounce: '攻擊彈向其他目標，因此產生額外效果',
  on_echo: '攻擊回到原目標，因此產生額外效果',
  on_defeat: '這次攻擊會擊破目標，因此產生額外效果',
  on_overkill: '傷害超過剩餘生命，因此產生額外效果',
  previous_fire: '上一位使用火屬技能，因此多一次效果',
  previous_grass: '上一位使用草屬技能，因此多一次效果',
  previous_water: '上一位使用水屬技能，因此多一次效果',
  ally_same_element: '隊友使用相同屬性，因此多一次效果',
  team_three_elements: '隊伍已接續三種屬性，因此多一次效果',
  lone_target: '場上只剩一個目標，因此效果折返回來',
};

export interface SkillTilePresentation {
  intentName: string;
  primaryKind: 'damage' | 'healing' | 'effect';
  primaryValue: number;
  hits: number;
  statusDelta?: { kind: StatusLayer; amount: number } | undefined;
  readiness: 'ready' | 'base';
}

const statusDelta = (preview: SkillOutcomePreview): SkillTilePresentation['statusDelta'] => {
  const target = preview.units.find(({ id }) => id === preview.targetId);
  if (!target) return undefined;
  const changes = (['burn', 'poison', 'tide'] as const)
    .map((kind) => ({ kind, amount: target.afterStatus[kind] - target.beforeStatus[kind] }))
    .filter(({ amount }) => amount !== 0)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  return changes[0];
};

export function createSkillTilePresentation(
  skill: GuildSkillItem,
  preview: SkillOutcomePreview,
): SkillTilePresentation {
  const first = skill.components[0];
  const hits = preview.events.filter(
    ({ kind, amount }) => (kind === 'damage' || kind === 'reaction') && (amount ?? 0) > 0,
  ).length;
  const primaryKind =
    preview.totalDamage > 0 ? 'damage' : preview.totalHealing > 0 ? 'healing' : 'effect';
  return {
    intentName: INTENT_NAMES[first.element][first.specializationId],
    primaryKind,
    primaryValue:
      primaryKind === 'damage'
        ? preview.totalDamage
        : primaryKind === 'healing'
          ? preview.totalHealing
          : 0,
    hits,
    statusDelta: statusDelta(preview),
    readiness: preview.events.some(({ kind }) => kind === 'triggered') ? 'ready' : 'base',
  };
}

export function previewCause(preview: SkillOutcomePreview): string | undefined {
  const triggerId = preview.events.find(({ kind }) => kind === 'triggered')?.triggerId;
  return triggerId ? TRIGGER_REASONS[triggerId] : undefined;
}
