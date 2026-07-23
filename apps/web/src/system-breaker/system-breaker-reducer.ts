import {
  applyBoardCommand,
  createSystemBreakerRun,
  decodeRunCode,
  resolveSystemBreakerRound,
} from '@expedition/simulation-core';

import {
  createSystemBreakerUiState,
  type SystemBreakerUiAction,
  type SystemBreakerUiState,
} from './system-breaker-ui-state';

export { createSystemBreakerUiState, type PlaybackSpeed } from './system-breaker-ui-state';

function finishPlayback(state: SystemBreakerUiState): SystemBreakerUiState {
  if (!state.pendingRound) return state;
  const run = state.pendingRound.run;
  return {
    ...state,
    phase: run.status === 'PREPARE' ? 'PLAY' : 'ENDING',
    run,
    lastEvents: state.pendingRound.events,
    visibleEventCount: state.pendingRound.events.length,
    pendingRound: null,
  };
}

const reasonText: Record<string, string> = {
  INSUFFICIENT_CREDITS: '運算額度不足。',
  CELL_BLOCKED: '這個格位正被威脅封鎖。',
  CELL_OCCUPIED: '格位已有模組。',
  FUSION_INVALID: '只有兩個同名同級模組可以融合。',
  REFRESH_UNAVAILABLE: '本回合無法再次刷新。',
};

export function systemBreakerReducer(
  state: SystemBreakerUiState,
  action: SystemBreakerUiAction,
): SystemBreakerUiState {
  if (action.type === 'SET_PROMPT') return { ...state, prompt: action.prompt, error: null };
  if (action.type === 'START_GENERATION') return { ...state, phase: 'GENERATING', error: null };
  if (action.type === 'GENERATION_FAILED')
    return { ...state, phase: 'PROMPT', error: action.message };
  if (action.type === 'GENOME_READY')
    return { ...state, phase: 'CONTRACT', genomeResponse: action.response, error: null };
  if (action.type === 'ACCEPT_CONTRACT' && state.genomeResponse) {
    const run = createSystemBreakerRun(state.genomeResponse.genome, action.fragment);
    return { ...state, phase: 'PLAY', run, feedback: '先購買模組，再點擊格位放置。' };
  }
  if (action.type === 'SELECT_INSTANCE') return { ...state, selectedInstanceId: action.instanceId };
  if (action.type === 'BOARD_COMMAND' && state.run && state.phase === 'PLAY') {
    const result = applyBoardCommand(state.run, action.command);
    return {
      ...state,
      run: result.run,
      selectedInstanceId: result.accepted ? null : state.selectedInstanceId,
      feedback: result.accepted
        ? '命令已套用。'
        : (reasonText[result.reason ?? ''] ?? '命令無效。'),
    };
  }
  if (action.type === 'EXECUTE_ROUND' && state.run && state.phase === 'PLAY') {
    const pendingRound = resolveSystemBreakerRound(state.run);
    return {
      ...state,
      phase: 'PLAYBACK',
      pendingRound,
      lastEvents: pendingRound.events,
      visibleEventCount: 0,
      feedback: null,
    };
  }
  if (action.type === 'PLAYBACK_TICK' && state.pendingRound) {
    const visibleEventCount = Math.min(
      state.pendingRound.events.length,
      state.visibleEventCount + 1,
    );
    return visibleEventCount >= state.pendingRound.events.length
      ? finishPlayback({ ...state, visibleEventCount })
      : { ...state, visibleEventCount };
  }
  if (action.type === 'SKIP_PLAYBACK') return finishPlayback(state);
  if (action.type === 'SET_SPEED') return { ...state, speed: action.speed };
  if (action.type === 'IMPORT_RUN_CODE') {
    try {
      const genome = decodeRunCode(action.code.trim());
      return {
        ...createSystemBreakerUiState(),
        phase: 'CONTRACT',
        genomeResponse: { genome, source: 'RUN_CODE', seed: genome.seed },
      };
    } catch {
      return { ...state, error: '無法讀取這個重播碼。' };
    }
  }
  if (action.type === 'RESET') return createSystemBreakerUiState();
  return state;
}
