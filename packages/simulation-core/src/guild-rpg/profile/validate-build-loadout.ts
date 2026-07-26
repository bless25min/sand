import type { BuildDefinition, CardCatalog } from '@expedition/shared-types';

export interface BuildLoadoutValidation {
  valid: boolean;
  reason?: 'size' | 'catalog' | 'signature' | 'chain';
}

export function validateBuildLoadout(
  build: BuildDefinition,
  cardIds: readonly string[],
  cards: CardCatalog,
): BuildLoadoutValidation {
  if (cardIds.length !== 8 || new Set(cardIds).size !== 8) {
    return { valid: false, reason: 'size' };
  }
  if (cardIds.some((cardId) => !build.cardIds.includes(cardId) || !cards[cardId])) {
    return { valid: false, reason: 'catalog' };
  }
  if (build.signatureCardIds.some((cardId) => !cardIds.includes(cardId))) {
    return { valid: false, reason: 'signature' };
  }

  const reachableTags = new Set<string>();
  const pending = new Set(cardIds);
  let changed = true;
  while (pending.size > 0 && changed) {
    changed = false;
    for (const cardId of [...pending]) {
      const card = cards[cardId]!;
      if ((card.requiresTags ?? []).some((tag) => !reachableTags.has(tag))) continue;
      pending.delete(cardId);
      card.emitsTags.forEach((tag) => reachableTags.add(tag));
      changed = true;
    }
  }

  return pending.size === 0 ? { valid: true } : { valid: false, reason: 'chain' };
}
