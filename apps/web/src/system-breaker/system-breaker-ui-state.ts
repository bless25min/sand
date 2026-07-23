import type {
  BoardCommand,
  ChainEvent,
  RoundResult,
  SystemBreakerRun,
  SystemFragment,
} from '@expedition/shared-types';

import type { GameGenomeGeneration } from './system-breaker-api';

type SystemBreakerUiPhase = 'PROMPT' | 'GENERATING' | 'CONTRACT' | 'PLAY' | 'PLAYBACK' | 'ENDING';
export type PlaybackSpeed = 1 | 2 | 0;
type UiGenomeResponse = Omit<GameGenomeGeneration, 'source'> & {
  source: GameGenomeGeneration['source'] | 'RUN_CODE';
};

export interface SystemBreakerUiState {
  phase: SystemBreakerUiPhase;
  prompt: string;
  genomeResponse: UiGenomeResponse | null;
  run: SystemBreakerRun | null;
  pendingRound: RoundResult | null;
  lastEvents: ChainEvent[];
  visibleEventCount: number;
  speed: PlaybackSpeed;
  selectedInstanceId: string | null;
  error: string | null;
  feedback: string | null;
}

export type SystemBreakerUiAction =
  | { type: 'SET_PROMPT'; prompt: string }
  | { type: 'START_GENERATION' }
  | { type: 'GENOME_READY'; response: GameGenomeGeneration }
  | { type: 'GENERATION_FAILED'; message: string }
  | { type: 'ACCEPT_CONTRACT'; fragment?: SystemFragment }
  | { type: 'SELECT_INSTANCE'; instanceId: string | null }
  | { type: 'BOARD_COMMAND'; command: BoardCommand }
  | { type: 'EXECUTE_ROUND' }
  | { type: 'PLAYBACK_TICK' }
  | { type: 'SKIP_PLAYBACK' }
  | { type: 'SET_SPEED'; speed: PlaybackSpeed }
  | { type: 'IMPORT_RUN_CODE'; code: string }
  | { type: 'RESET' };

export function createSystemBreakerUiState(): SystemBreakerUiState {
  return {
    phase: 'PROMPT',
    prompt: '',
    genomeResponse: null,
    run: null,
    pendingRound: null,
    lastEvents: [],
    visibleEventCount: 0,
    speed: 1,
    selectedInstanceId: null,
    error: null,
    feedback: null,
  };
}
