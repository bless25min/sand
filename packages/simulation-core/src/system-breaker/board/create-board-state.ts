import type { SystemBoard } from '@expedition/shared-types';

export function createBoardState(size: 2 | 3): SystemBoard {
  return {
    size,
    cells: Array.from({ length: size * size }, (_, index) => ({
      index,
      blocked: false,
      locked: false,
    })),
  };
}

export function resizeBoard(board: SystemBoard, size: 2 | 3): SystemBoard {
  if (board.size === size) {
    return { ...board, cells: board.cells.map((cell) => ({ ...cell })) };
  }
  const cells = createBoardState(size).cells;
  board.cells.forEach((cell) => {
    if (cell.index < cells.length) cells[cell.index] = { ...cell };
  });
  return { size, cells };
}
