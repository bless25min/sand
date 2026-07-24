import { describe, expect, it } from 'vitest';

import { createFallbackGameGenome, encodeRunCode } from '@expedition/simulation-core';
import type { SystemFragment } from '@expedition/shared-types';

import { createSystemBreakerUiState, systemBreakerReducer } from './system-breaker-reducer';

const genome = createFallbackGameGenome({
  prompt: '吞噬記憶的午夜圖書館',
  seed: 'ui-flow',
});

describe('system breaker UI reducer', () => {
  it('starts a replay with a fresh UI session while retaining the chosen speed', () => {
    const fragment: SystemFragment = {
      version: 1,
      moduleId: 'replay-fragment',
      name: 'Replay fragment',
      bonus: 3,
    };
    let state = systemBreakerReducer(createSystemBreakerUiState(), {
      type: 'GENOME_READY',
      response: { genome, source: 'FALLBACK', seed: genome.seed },
    });
    state = systemBreakerReducer(state, { type: 'ACCEPT_CONTRACT' });
    state = systemBreakerReducer(state, { type: 'EXECUTE_ROUND' });
    const staleState = {
      ...state,
      phase: 'ENDING' as const,
      lastEvents: [
        {
          type: 'THREAT_HIT' as const,
          sequence: 99,
          message: 'Stale chain event',
          value: 10,
        },
      ],
      visibleEventCount: 1,
      speed: 2 as const,
      selectedInstanceId: 'stale-instance',
      error: 'Stale error',
      feedback: 'Stale feedback',
    };

    const replayed = systemBreakerReducer(staleState, { type: 'ACCEPT_CONTRACT', fragment });

    expect(replayed.phase).toBe('PLAY');
    expect(replayed.run).not.toBe(staleState.run);
    expect(replayed.run?.genome).toBe(genome);
    expect(replayed.run?.savedFragment).toEqual(fragment);
    expect(replayed.run?.chainLog).toEqual([]);
    expect(replayed.pendingRound).toBeNull();
    expect(replayed.lastEvents).toEqual([]);
    expect(replayed.visibleEventCount).toBe(0);
    expect(replayed.selectedInstanceId).toBeNull();
    expect(replayed.error).toBeNull();
    expect(replayed.feedback).toBeNull();
    expect(replayed.speed).toBe(2);
    expect(replayed.prompt).toBe(staleState.prompt);
    expect(replayed.genomeResponse).toBe(staleState.genomeResponse);
  });

  it('orchestrates contract, board command, playback, and all seven rounds', () => {
    let state = createSystemBreakerUiState();
    state = systemBreakerReducer(state, { type: 'START_GENERATION' });
    state = systemBreakerReducer(state, {
      type: 'GENOME_READY',
      response: { genome, source: 'FALLBACK', seed: genome.seed },
    });
    state = systemBreakerReducer(state, { type: 'ACCEPT_CONTRACT' });

    const producerOffer = state.run!.shop.offers.findIndex((offer) => {
      const definition = genome.modules.find((module) => module.id === offer?.definitionId);
      return definition?.role === 'PRODUCER';
    });
    state = systemBreakerReducer(state, {
      type: 'BOARD_COMMAND',
      command: { type: 'BUY', offerIndex: producerOffer },
    });
    const instanceId = state.run!.inventory[0]!.instanceId;
    state = systemBreakerReducer(state, {
      type: 'BOARD_COMMAND',
      command: { type: 'PLACE', instanceId, cellIndex: 0 },
    });

    for (let round = 1; round <= 7; round += 1) {
      state = {
        ...state,
        run: {
          ...state.run!,
          resources: { ...state.run!.resources, PROGRESS: 999 },
        },
      };
      state = systemBreakerReducer(state, { type: 'EXECUTE_ROUND' });
      expect(state.phase).toBe('PLAYBACK');
      const pending = state.pendingRound;
      const locked = systemBreakerReducer(state, { type: 'EXECUTE_ROUND' });
      expect(locked.pendingRound).toBe(pending);
      state = systemBreakerReducer(state, { type: 'SKIP_PLAYBACK' });
    }

    expect(state.phase).toBe('ENDING');
    expect(state.run?.status).toBe('VICTORY');
    expect(state.run?.fragment).toBeTruthy();
  });

  it('imports a valid run code and rejects an invalid one', () => {
    const imported = systemBreakerReducer(createSystemBreakerUiState(), {
      type: 'IMPORT_RUN_CODE',
      code: encodeRunCode(genome),
    });
    const invalid = systemBreakerReducer(createSystemBreakerUiState(), {
      type: 'IMPORT_RUN_CODE',
      code: 'broken',
    });

    expect(imported.phase).toBe('CONTRACT');
    expect(imported.genomeResponse?.source).toBe('RUN_CODE');
    expect(invalid.error).toBe('無法讀取這個重播碼。');
  });
});
