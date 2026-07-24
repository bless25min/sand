import type { BoardCell, ModuleTargetId, SystemBoard } from '@expedition/shared-types';

export function resolveModuleTargets(
  board: SystemBoard,
  sourceCellIndex: number,
  target: ModuleTargetId,
): BoardCell[] {
  const source = board.cells.find((cell) => cell.index === sourceCellIndex);
  if (!source) return [];
  if (target === 'SELF') return [source];

  const sourceRow = Math.floor(source.index / board.size);
  const sourceColumn = source.index % board.size;
  const matchesTarget = (cell: BoardCell): boolean => {
    if (cell.index === source.index) return false;
    const row = Math.floor(cell.index / board.size);
    const column = cell.index % board.size;
    if (target === 'ADJACENT')
      return Math.abs(row - sourceRow) + Math.abs(column - sourceColumn) === 1;
    if (target === 'LEFT') return row === sourceRow && column === sourceColumn - 1;
    if (target === 'RIGHT') return row === sourceRow && column === sourceColumn + 1;
    if (target === 'ROW') return row === sourceRow;
    return true;
  };

  return board.cells.filter(matchesTarget).sort((left, right) => left.index - right.index);
}
