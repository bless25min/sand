import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { SystemBreakerRun } from '@expedition/shared-types';

import { ChainPlayback } from './ChainPlayback';
import { SystemBoard } from './SystemBoard';

const run: SystemBreakerRun = {
  genome: {
    version: 1,
    seed: 'web-test',
    title: 'Web test',
    premise: 'Test',
    aliases: { PROGRESS: '進度', INTEGRITY: '完整度', INSTABILITY: '不穩定度', CREDITS: '點數' },
    winDescription: 'Win',
    failDescription: 'Fail',
    rules: ['BALANCED_GRID', 'EDGE_CREDIT'],
    modules: [
      {
        id: 'module-a',
        name: '甲模組',
        description: '測試用',
        role: 'PRODUCER',
        trigger: 'DISABLED',
        effect: 'ADD_PROGRESS',
        target: 'SELF',
        baseValue: 4,
        cost: 4,
        cooldown: 1,
      },
    ],
    threats: Array.from({ length: 7 }, (_, index) => ({
      id: `threat-${index}`,
      round: index + 1,
      name: '威脅',
      telegraph: '測試',
      kind: 'NORMAL' as const,
      targetProgress: 20,
      integrityDamage: 4,
      instabilityGain: 5,
      modifier: 'NONE' as const,
    })),
    counters: [
      { id: 'a', role: 'PRODUCER', label: 'A', outputMultiplier: 1 },
      { id: 'b', role: 'AMPLIFIER', label: 'B', outputMultiplier: 1 },
      { id: 'c', role: 'STABILIZER', label: 'C', outputMultiplier: 1 },
    ],
    endings: {
      victory: { title: 'Win', description: 'Win' },
      defeat: { title: 'Fail', description: 'Fail' },
    },
  },
  seed: 'web-test',
  round: 1,
  status: 'PREPARE',
  resources: { PROGRESS: 0, INTEGRITY: 100, INSTABILITY: 0, CREDITS: 0 },
  board: {
    size: 2,
    cells: [
      {
        index: 0,
        blocked: false,
        locked: false,
        module: {
          instanceId: 'instance-a',
          definitionId: 'module-a',
          level: 1,
          cooldownRemaining: 0,
        },
      },
      { index: 1, blocked: false, locked: false },
      { index: 2, blocked: false, locked: false },
      { index: 3, blocked: false, locked: false },
    ],
  },
  inventory: [],
  shop: { offers: [], refreshesRemaining: 0 },
  activeModifier: 'NONE',
  activeCounter: null,
  completedThreats: 0,
  score: 0,
  bestChain: 0,
  nextInstanceId: 1,
  chainLog: [],
  previousRoundDamagedIntegrity: false,
};

describe('playback projections', () => {
  it('renders signed resource changes and exposes the current module cell as active', () => {
    const playback = renderToStaticMarkup(
      <ChainPlayback
        events={[
          {
            sequence: 1,
            type: 'RESOURCE_CHANGED',
            message: '甲模組造成變化',
            moduleInstanceId: 'instance-a',
            resourceChanges: [
              { resource: 'PROGRESS', delta: 4 },
              { resource: 'INSTABILITY', delta: -2 },
            ],
          },
        ]}
        visibleCount={1}
        playing
        onSkip={() => undefined}
      />,
    );
    const board = renderToStaticMarkup(
      <SystemBoard
        run={run}
        selectedInstanceId={null}
        activeInstanceId="instance-a"
        onSelect={() => undefined}
        onCommand={() => undefined}
      />,
    );

    expect(playback).toContain('資源變化');
    expect(playback).toContain('進度 +4');
    expect(playback).toContain('不穩定度 -2');
    expect(board).toContain('sb-cell--active');
    expect(board).toContain('aria-current="step"');
    expect(board).toContain('目前執行中');
  });

  it('does not mark an inactive cell as the current step', () => {
    const markup = renderToStaticMarkup(
      <SystemBoard
        run={run}
        selectedInstanceId={null}
        activeInstanceId={null}
        onSelect={() => undefined}
        onCommand={() => undefined}
      />,
    );

    expect(markup).not.toContain('sb-cell--active');
    expect(markup).not.toContain('aria-current="step"');
  });

  it('keeps an active disabled-trigger module visibly announced on a locked cell', () => {
    const lockedRun = {
      ...run,
      board: {
        ...run.board,
        cells: run.board.cells.map((cell) => (cell.index === 0 ? { ...cell, locked: true } : cell)),
      },
    };
    const markup = renderToStaticMarkup(
      <SystemBoard
        run={lockedRun}
        selectedInstanceId={null}
        activeInstanceId="instance-a"
        onSelect={() => undefined}
        onCommand={() => undefined}
      />,
    );

    expect(markup).toContain('LOCKED');
    expect(markup).toContain('甲模組');
    expect(markup).toContain('觸發：自身格被封鎖或鎖定時');
    expect(markup).toContain('目標：自身（永遠可用）');
    expect(markup).toContain('冷卻：目前還需等待 0 回合；啟動後跳過接下來 1 回合');
    expect(markup).toContain('目前執行中');
  });

  it('keeps an empty blocked cell as a locked placeholder', () => {
    const blockedRun = {
      ...run,
      board: {
        ...run.board,
        cells: run.board.cells.map((cell) =>
          cell.index === 1 ? { ...cell, blocked: true } : cell,
        ),
      },
    };
    const markup = renderToStaticMarkup(
      <SystemBoard
        run={blockedRun}
        selectedInstanceId={null}
        activeInstanceId={null}
        onSelect={() => undefined}
        onCommand={() => undefined}
      />,
    );

    expect(markup).toContain('LOCKED');
    expect(markup).not.toContain('格位 2">甲模組');
  });
});
