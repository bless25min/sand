import type {
  BattleUnit,
  ComboCommandPreview,
  GuildGameContent,
  HuntEnemyTrait,
} from '@expedition/shared-types';
import { compileBuild, previewComboCommand } from '@expedition/simulation-core';

import type { GuildRpgState } from '../state/game-reducer';

export interface EnemySensation {
  id: string;
  pressureLabel: '蓄勢' | '即將攻擊' | '攻勢爆發';
  executionLabel?: string;
  predictedTargetName?: string;
  guardedByNames: readonly string[];
  counteredByCurrentBuild: boolean;
}

function pressureLabel(gauge: number): EnemySensation['pressureLabel'] {
  if (gauge >= 85) return '攻勢爆發';
  if (gauge >= 50) return '即將攻擊';
  return '蓄勢';
}

function guardedByNames(
  traits: readonly HuntEnemyTrait[] | undefined,
  units: readonly BattleUnit[],
) {
  const guardIds = new Set(traits?.flatMap((trait) => trait.guardedByEnemyIds ?? []) ?? []);
  return units.filter((unit) => guardIds.has(unit.id)).map((unit) => unit.name);
}

const EMPTY_PREVIEW: ComboCommandPreview = {
  diagnostics: ['預演暫時不可用'],
  eventCount: 0,
  totalDamage: 0,
  defeatedEnemyIds: [],
  overkill: 0,
  milestones: [],
};

export function createBattleSensationModel(state: GuildRpgState, content: GuildGameContent) {
  const battle = state.battle!;
  const runtime = battle.combo!;
  const compiledBuild = compileBuild(state.profile, content);
  const build = content.builds.find((candidate) => candidate.id === compiledBuild.buildId)!;
  const rules = Object.fromEntries(
    compiledBuild.ruleIds.flatMap((ruleId) => {
      const rule = content.rules[ruleId];
      return rule ? [[ruleId, rule]] : [];
    }),
  );
  const hunt = content.hunts.find((candidate) => candidate.questId === battle.questId);
  const activatedPhaseIds = new Set(runtime.activatedBossPhaseIds ?? []);
  const executionLabels = new Map(
    hunt?.bossPhases
      ?.filter((phase) => activatedPhaseIds.has(phase.id))
      .map((phase) => [phase.bossEnemyId, phase.pressureLabel]) ?? [],
  );
  const preview = (() => {
    try {
      return previewComboCommand({
        battle,
        draft: runtime.draft,
        cards: content.cards,
        rules,
        ...(hunt ? { hunt } : {}),
      });
    } catch {
      return EMPTY_PREVIEW;
    }
  })();

  let completedCount = 0;
  for (const cardId of runtime.draft.cardIds) {
    if (cardId === build.signatureCardIds[completedCount]) completedCount += 1;
  }
  const completedCardIds = build.signatureCardIds.slice(0, completedCount);
  const nextCardId = build.signatureCardIds[completedCount];
  const predictedTarget = battle.units
    .filter((unit) => unit.side === 'heroes' && unit.currentHp > 0)
    .sort((left, right) => right.threat - left.threat)[0];
  const enemies: readonly EnemySensation[] = battle.units
    .filter((unit) => unit.side === 'enemies')
    .map((unit) => ({
      id: unit.id,
      pressureLabel: pressureLabel(unit.gauge),
      ...(executionLabels.get(unit.id) ? { executionLabel: executionLabels.get(unit.id)! } : {}),
      ...(predictedTarget ? { predictedTargetName: predictedTarget.name } : {}),
      guardedByNames: guardedByNames(unit.huntTraits, battle.units),
      counteredByCurrentBuild: Boolean(
        unit.huntTraits?.some((trait) => trait.counterBuildIds.includes(build.id)),
      ),
    }));
  const selected = battle.units.find(
    (unit) => unit.id === battle.selectedTargetId && unit.currentHp > 0,
  );

  return {
    build,
    signature: {
      completedCardIds,
      nextCard: nextCardId ? content.cards[nextCardId] : undefined,
    },
    preview,
    enemies,
    executionTarget: selected ? { label: '處刑目標' as const, name: selected.name } : undefined,
  };
}
