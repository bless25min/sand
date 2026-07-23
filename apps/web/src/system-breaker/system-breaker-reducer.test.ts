import { describe, expect, it } from 'vitest';

import { createFallbackGameGenome, encodeRunCode } from '@expedition/simulation-core';

import { createSystemBreakerUiState, systemBreakerReducer } from './system-breaker-reducer';

const genome = createFallbackGameGenome({
  prompt: '吞噬記憶的午夜圖書館',
  seed: 'ui-flow',
});

describe('system breaker UI reducer', () => {
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
