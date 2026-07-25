import type {
  ComboCommandPreview,
  ComboPreviewMilestone,
  GuildBattleState,
  PreviewComboCommandInput,
} from '@expedition/shared-types';

import { compileCommand } from './compile-command';
import { resolveCommand } from './resolve-command';
import { resolveTriggerQueue } from './resolve-trigger-queue';

function cloneBattle(battle: GuildBattleState): GuildBattleState {
  const units = battle.units.map((unit) =>
    unit.huntTraits
      ? {
          ...unit,
          stats: { ...unit.stats },
          huntTraits: unit.huntTraits.map((trait) => ({ ...trait })),
        }
      : { ...unit, stats: { ...unit.stats } },
  );
  const events = battle.events.map((event) => ({ ...event }));
  if (!battle.combo) return { ...battle, units, events };
  return {
    ...battle,
    units,
    events,
    combo: {
      ...battle.combo,
      draft: { cardIds: [...battle.combo.draft.cardIds] },
      availableCardIds: [...battle.combo.availableCardIds],
      events: battle.combo.events.map((event) => ({ ...event })),
      metrics: {
        ...battle.combo.metrics,
        defeatedEnemyIds: [...battle.combo.metrics.defeatedEnemyIds],
      },
    },
  };
}

function earnsChest(input: PreviewComboCommandInput, defeatedIds: ReadonlySet<string>) {
  const hunt = input.hunt;
  if (!hunt?.annihilationChest || !hunt.bossEnemyId) return false;
  return [hunt.bossEnemyId, ...(hunt.guardEnemyIds ?? [])].every((id) => defeatedIds.has(id));
}

export function previewComboCommand(input: PreviewComboCommandInput): ComboCommandPreview {
  const command = compileCommand(input.draft, input.cards);
  if (!input.battle.combo || command.diagnostics.length > 0) {
    return {
      diagnostics: command.diagnostics,
      eventCount: 0,
      totalDamage: 0,
      defeatedEnemyIds: [],
      overkill: 0,
      milestones: [],
    };
  }

  const before = input.battle.combo;
  const liveEnemyIds = input.battle.units
    .filter((unit) => unit.side === 'enemies' && unit.currentHp > 0)
    .map((unit) => unit.id);
  const previewBattle = cloneBattle(input.battle);
  const resolved = resolveCommand(previewBattle, command, input.cards);
  const triggered = resolveTriggerQueue({
    battle: resolved,
    command,
    rules: input.rules,
  }).battle;
  const runtime = triggered.combo!;
  const defeatedBefore = new Set(before.metrics.defeatedEnemyIds);
  const defeatedEnemyIds = runtime.metrics.defeatedEnemyIds.filter(
    (enemyId) => !defeatedBefore.has(enemyId),
  );
  const defeatedSet = new Set(defeatedEnemyIds);
  const annihilation = liveEnemyIds.every((enemyId) => defeatedSet.has(enemyId));
  const milestones: ComboPreviewMilestone[] = [];
  if (defeatedEnemyIds.length >= 2) milestones.push('multi-kill');
  if (defeatedEnemyIds.length >= 3) milestones.push('chain-wipe');
  if (annihilation) milestones.push('annihilation');
  if (annihilation && earnsChest(input, defeatedSet)) milestones.push('chest');

  return {
    diagnostics: [],
    eventCount: runtime.events.length - before.events.length,
    totalDamage: runtime.metrics.totalDamage - before.metrics.totalDamage,
    defeatedEnemyIds,
    overkill: runtime.metrics.totalOverkill - before.metrics.totalOverkill,
    milestones,
  };
}
