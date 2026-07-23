import type { GameGenome, ModuleInstance, ShopOffer, SystemBoard } from '@expedition/shared-types';

import { createSeededRandom } from '../../rng/seeded-random';

function ownedDefinitionIds(board: SystemBoard, inventory: ModuleInstance[]): string[] {
  return [
    ...inventory.map((module) => module.definitionId),
    ...board.cells.flatMap((cell) => (cell.module ? [cell.module.definitionId] : [])),
  ];
}

export function createRoundOffers(input: {
  genome: GameGenome;
  round: number;
  refresh: number;
  board: SystemBoard;
  inventory: ModuleInstance[];
}): ShopOffer[] {
  const { genome, round, refresh, board, inventory } = input;
  const random = createSeededRandom(`${genome.seed}:shop:${round}:${refresh}`);
  const selected = new Set<number>();
  const duplicateId = round === 3 ? ownedDefinitionIds(board, inventory)[0] : undefined;
  if (duplicateId) selected.add(genome.modules.findIndex((module) => module.id === duplicateId));
  while (selected.size < 3) selected.add(random.nextInt(0, genome.modules.length - 1));

  return [...selected].slice(0, 3).map((definitionIndex, index) => {
    const definition = genome.modules[definitionIndex]!;
    return {
      offerId: `${round}-${refresh}-${index}`,
      definitionId: definition.id,
      price: definition.cost,
    };
  });
}
