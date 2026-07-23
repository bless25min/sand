import { describe, expect, it } from 'vitest';

import { createFallbackGameGenome } from '../genome';
import {
  createSystemBreakerRun,
  decodeRunCode,
  encodeRunCode,
  resolveSystemBreakerRound,
} from './index';

const createRun = (seed = 'run-core') =>
  createSystemBreakerRun(createFallbackGameGenome({ prompt: '逆流鐘塔', seed }));

describe('system breaker run', () => {
  it('expands to 3x3 for round three and guarantees a fusion duplicate', () => {
    const initial = createRun();
    const definition = initial.genome.modules[0]!;
    const roundTwo = {
      ...initial,
      round: 2,
      resources: { ...initial.resources, PROGRESS: 999 },
      inventory: [{ instanceId: 'owned', definitionId: definition.id, level: 1 as const }],
    };

    const result = resolveSystemBreakerRound(roundTwo);

    expect(result.run.round).toBe(3);
    expect(result.run.board.size).toBe(3);
    expect(result.run.shop.offers[0]?.definitionId).toBe(definition.id);
  });

  it('applies edge block, overload, elite counter, and boss lock by round', () => {
    let run = createRun('hazards');
    for (const targetRound of [4, 5, 6, 7]) {
      run = {
        ...run,
        round: targetRound - 1,
        resources: { ...run.resources, PROGRESS: 999 },
      };
      run = resolveSystemBreakerRound(run).run;
      if (targetRound === 4) expect(run.board.cells.some((cell) => cell.blocked)).toBe(true);
      if (targetRound === 5) expect(run.activeModifier).toBe('OVERLOAD');
      if (targetRound === 6) expect(run.activeCounter).not.toBeNull();
      if (targetRound === 7) expect(run.board.cells.some((cell) => cell.locked)).toBe(true);
    }
  });

  it('can die from a failed threat or defeat the round-seven boss', () => {
    const dying = {
      ...createRun('death'),
      resources: { PROGRESS: 0, INTEGRITY: 1, INSTABILITY: 99, CREDITS: 0 },
    };
    expect(resolveSystemBreakerRound(dying).run.status).toBe('DEFEAT');

    const boss = createRun('victory');
    const winning = {
      ...boss,
      round: 7,
      resources: { ...boss.resources, PROGRESS: 999 },
    };
    const result = resolveSystemBreakerRound(winning);
    expect(result.run.status).toBe('VICTORY');
    expect(result.run.fragment?.moduleId).toBeTruthy();
    expect(result.events.some((event) => event.type === 'BOSS_PHASE_TWO')).toBe(true);
  });

  it('round-trips a canonical unicode run code', () => {
    const genome = createRun('重播-42').genome;
    expect(decodeRunCode(encodeRunCode(genome))).toEqual(genome);
    expect(() => decodeRunCode('not-a-run')).toThrow('INVALID_RUN_CODE');
  });
});
