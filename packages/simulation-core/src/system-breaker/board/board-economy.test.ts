import { describe, expect, it } from 'vitest';

import { createFallbackGameGenome } from '../genome';
import { applyBoardCommand, createSystemBreakerRun } from '../run';

const createRun = () =>
  createSystemBreakerRun(createFallbackGameGenome({ prompt: '折疊都市', seed: 'board-economy' }));

describe('system breaker board economy', () => {
  it('opens with both an output choice and a survival choice', () => {
    const run = createRun();
    const offered = run.shop.offers.map((offer) =>
      run.genome.modules.find((module) => module.id === offer?.definitionId),
    );

    expect(offered.some((module) => module?.role === 'PRODUCER')).toBe(true);
    expect(
      offered.some((module) => module?.role === 'DEFENSE' || module?.role === 'STABILIZER'),
    ).toBe(true);
  });

  it('buys and places an offered module without letting React own prices', () => {
    const initial = createRun();
    const offer = initial.shop.offers[0]!;
    const bought = applyBoardCommand(initial, { type: 'BUY', offerIndex: 0 });
    const instance = bought.run.inventory[0]!;
    const placed = applyBoardCommand(bought.run, {
      type: 'PLACE',
      instanceId: instance.instanceId,
      cellIndex: 0,
    });

    expect(bought.accepted).toBe(true);
    expect(bought.run.resources.CREDITS).toBe(initial.resources.CREDITS - offer.price);
    expect(placed.run.board.cells[0]?.module?.instanceId).toBe(instance.instanceId);
  });

  it('rejects occupied and threat-blocked cells with explicit reasons', () => {
    const initial = createRun();
    const definition = initial.genome.modules[0]!;
    const run = {
      ...initial,
      inventory: [
        { instanceId: 'one', definitionId: definition.id, level: 1 as const },
        { instanceId: 'two', definitionId: definition.id, level: 1 as const },
      ],
      board: {
        ...initial.board,
        cells: initial.board.cells.map((cell, index) =>
          index === 1 ? { ...cell, blocked: true } : cell,
        ),
      },
    };
    const first = applyBoardCommand(run, { type: 'PLACE', instanceId: 'one', cellIndex: 0 });

    expect(
      applyBoardCommand(first.run, { type: 'PLACE', instanceId: 'two', cellIndex: 0 }).reason,
    ).toBe('CELL_OCCUPIED');
    expect(
      applyBoardCommand(first.run, { type: 'PLACE', instanceId: 'two', cellIndex: 1 }).reason,
    ).toBe('CELL_BLOCKED');
  });

  it('fuses equal level-one modules once and sells at the core-owned ratio', () => {
    const initial = createRun();
    const definition = initial.genome.modules[0]!;
    const stocked = {
      ...initial,
      inventory: [
        { instanceId: 'one', definitionId: definition.id, level: 1 as const },
        { instanceId: 'two', definitionId: definition.id, level: 1 as const },
      ],
    };
    const fused = applyBoardCommand(stocked, {
      type: 'FUSE',
      sourceInstanceId: 'one',
      targetInstanceId: 'two',
    });
    const sold = applyBoardCommand(fused.run, { type: 'SELL', instanceId: 'two' });

    expect(fused.accepted).toBe(true);
    expect(fused.run.inventory).toEqual([
      { instanceId: 'two', definitionId: definition.id, level: 2 },
    ]);
    expect(
      applyBoardCommand(fused.run, {
        type: 'FUSE',
        sourceInstanceId: 'two',
        targetInstanceId: 'two',
      }).reason,
    ).toBe('FUSION_INVALID');
    expect(sold.run.resources.CREDITS).toBe(initial.resources.CREDITS + definition.cost);
  });
});
