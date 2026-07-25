import type {
  CardCatalog,
  CommandDraft,
  CompiledCommand,
  CompiledCommandStep,
} from '@expedition/shared-types';

export function compileCommand(draft: CommandDraft, cards: CardCatalog): CompiledCommand {
  const emittedTags = new Set<string>();
  const diagnostics: string[] = [];
  const steps: CompiledCommandStep[] = [];

  draft.cardIds.forEach((cardId, index) => {
    const card = cards[cardId];
    if (!card) {
      diagnostics.push(`未知卡片 ${cardId}`);
      return;
    }
    const missingTags = (card.requiresTags ?? []).filter((tag) => !emittedTags.has(tag));
    if (missingTags.length > 0) {
      diagnostics.push(`${card.name}需要 ${missingTags.join(', ')}`);
      return;
    }
    steps.push({
      cardId,
      causalId: `card:${index}:${cardId}`,
      emittedTags: [...card.emitsTags],
    });
    card.emitsTags.forEach((tag) => emittedTags.add(tag));
  });

  return { cardIds: [...draft.cardIds], steps, diagnostics };
}
