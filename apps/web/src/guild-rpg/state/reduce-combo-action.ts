import type { CardCatalog, GuildBattleState, RuleCatalog } from '@expedition/shared-types';
import { compileCommand, resolveCommand, resolveTriggerQueue } from '@expedition/simulation-core';

export type ComboCommandAction =
  | { type: 'APPEND_COMBO_CARD'; cardId: string }
  | { type: 'UNDO_COMBO_CARD' }
  | { type: 'RELEASE_COMBO' };

interface ComboActionResult {
  battle: GuildBattleState;
  message: string;
}

export function reduceComboAction(
  battle: GuildBattleState,
  action: ComboCommandAction,
  cards: CardCatalog,
  rules: RuleCatalog = {},
): ComboActionResult {
  const runtime = battle.combo;
  if (!runtime || runtime.phase !== 'composing') {
    return { battle, message: '目前不能編排軍令。' };
  }

  if (action.type === 'UNDO_COMBO_CARD') {
    if (runtime.draft.cardIds.length === 0) return { battle, message: '軍令目前是空的。' };
    return {
      battle: {
        ...battle,
        combo: {
          ...runtime,
          draft: { cardIds: runtime.draft.cardIds.slice(0, -1) },
        },
      },
      message: '已撤銷上一張卡牌。',
    };
  }

  if (action.type === 'APPEND_COMBO_CARD') {
    if (!runtime.availableCardIds.includes(action.cardId) || !cards[action.cardId]) {
      return { battle, message: '這張卡牌不在目前隊伍的軍令中。' };
    }
    const cardIds = [...runtime.draft.cardIds, action.cardId];
    const command = compileCommand({ cardIds }, cards);
    if (command.diagnostics.length > 0) {
      return { battle, message: command.diagnostics[0]! };
    }
    return {
      battle: {
        ...battle,
        combo: { ...runtime, draft: { cardIds } },
      },
      message: `軍令已編排 ${cardIds.length} 張卡牌。`,
    };
  }

  if (runtime.draft.cardIds.length === 0) return { battle, message: '至少加入一張卡牌。' };
  const command = compileCommand(runtime.draft, cards);
  if (command.diagnostics.length > 0) {
    return { battle, message: command.diagnostics.join('；') };
  }
  const resolved = resolveCommand(battle, command, cards);
  return {
    battle: resolveTriggerQueue({ battle: resolved, command, rules }).battle,
    message: `軍令釋放：${command.cardIds.length} 張卡牌完整結算。`,
  };
}
