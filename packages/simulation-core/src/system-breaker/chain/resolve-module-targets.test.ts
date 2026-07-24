import { describe, expect, it } from 'vitest';

import { cell, moduleInstance } from './chain-test-fixtures';
import { resolveModuleTargets } from './resolve-module-targets';

describe('resolveModuleTargets', () => {
  it('resolves target cells in stable board order and excludes the source from relational targets', () => {
    const cells = [
      cell(0, moduleInstance('source')),
      cell(1, moduleInstance('right')),
      cell(2, moduleInstance('down')),
      cell(3),
    ];
    const board = { size: 2 as const, cells };

    expect(resolveModuleTargets(board, 0, 'SELF').map((target) => target.index)).toEqual([0]);
    expect(resolveModuleTargets(board, 0, 'ADJACENT').map((target) => target.index)).toEqual([
      1, 2,
    ]);
    expect(resolveModuleTargets(board, 1, 'LEFT').map((target) => target.index)).toEqual([0]);
    expect(resolveModuleTargets(board, 0, 'RIGHT').map((target) => target.index)).toEqual([1]);
    expect(resolveModuleTargets(board, 0, 'ROW').map((target) => target.index)).toEqual([1]);
    expect(resolveModuleTargets(board, 0, 'ALL').map((target) => target.index)).toEqual([1, 2, 3]);
  });
});
