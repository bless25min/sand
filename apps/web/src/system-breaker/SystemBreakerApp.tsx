import { useReducer } from 'react';

import type { BoardCommand } from '@expedition/shared-types';

import { ChainPlayback } from './components/ChainPlayback';
import { ModuleShop } from './components/ModuleShop';
import { ResourceStrip } from './components/ResourceStrip';
import { RoundControls } from './components/RoundControls';
import { RoundPreview } from './components/RoundPreview';
import { RunEnding } from './components/RunEnding';
import { SystemBoard } from './components/SystemBoard';
import { SystemHeader } from './components/SystemHeader';
import { WorldContract } from './components/WorldContract';
import { WorldPrompt } from './components/WorldPrompt';
import { generateGameGenome } from './system-breaker-api';
import { createRoundDisplayProjection } from './create-round-display-projection';
import { createSystemBreakerUiState, systemBreakerReducer } from './system-breaker-reducer';
import { loadFragment } from './system-breaker-storage';
import { browserStorage, useFragmentPersistence, usePlayback } from './use-system-breaker-effects';
import './system-breaker-foundation.css';
import './system-breaker-role-colors.css';
import './system-breaker.css';
import './system-breaker-contract.css';
import './system-breaker-game.css';
import './system-breaker-preview.css';
import './system-breaker-board.css';
import './system-breaker-shop.css';
import './system-breaker-feedback.css';
import './system-breaker-ending.css';

export function SystemBreakerApp() {
  const [state, dispatch] = useReducer(systemBreakerReducer, undefined, createSystemBreakerUiState);

  usePlayback(state, dispatch);
  useFragmentPersistence(state);

  const generate = async () => {
    const prompt = state.prompt.trim();
    if (!prompt) {
      dispatch({ type: 'GENERATION_FAILED', message: '請先輸入一個世界主題。' });
      return;
    }
    dispatch({ type: 'START_GENERATION' });
    const response = await generateGameGenome({
      prompt,
      seed: crypto.randomUUID(),
    });
    dispatch({ type: 'GENOME_READY', response });
  };

  if (state.phase === 'PROMPT' || state.phase === 'GENERATING') {
    return (
      <main className="sb-shell">
        <SystemHeader />
        <WorldPrompt
          prompt={state.prompt}
          generating={state.phase === 'GENERATING'}
          error={state.error}
          onPromptChange={(prompt) => dispatch({ type: 'SET_PROMPT', prompt })}
          onGenerate={() => void generate()}
          onImport={(code) => dispatch({ type: 'IMPORT_RUN_CODE', code })}
        />
      </main>
    );
  }

  if (state.phase === 'CONTRACT' && state.genomeResponse) {
    return (
      <main className="sb-shell">
        <SystemHeader />
        <WorldContract
          genome={state.genomeResponse.genome}
          source={state.genomeResponse.source}
          onBack={() => dispatch({ type: 'RESET' })}
          onAccept={() => {
            const storage = browserStorage();
            const fragment = storage ? loadFragment(storage) : undefined;
            dispatch(
              fragment ? { type: 'ACCEPT_CONTRACT', fragment } : { type: 'ACCEPT_CONTRACT' },
            );
          }}
        />
      </main>
    );
  }

  if (state.phase === 'ENDING' && state.run) {
    return (
      <main className="sb-shell">
        <SystemHeader />
        <RunEnding
          run={state.run}
          onReplay={() => {
            const fragment = state.run?.fragment;
            dispatch(
              fragment ? { type: 'ACCEPT_CONTRACT', fragment } : { type: 'ACCEPT_CONTRACT' },
            );
          }}
          onNewWorld={() => dispatch({ type: 'RESET' })}
        />
      </main>
    );
  }

  const run = state.run!;
  const command = (value: BoardCommand) => dispatch({ type: 'BOARD_COMMAND', command: value });
  const projection = createRoundDisplayProjection(run, state.lastEvents, state.visibleEventCount);
  return (
    <main className="sb-shell sb-shell--game">
      <SystemHeader compact title={run.genome.title} />
      <ResourceStrip run={run} />
      <RoundControls
        run={run}
        speed={state.speed}
        disabled={state.phase === 'PLAYBACK'}
        onSpeed={(speed) => dispatch({ type: 'SET_SPEED', speed })}
        onExecute={() => dispatch({ type: 'EXECUTE_ROUND' })}
      />
      <RoundPreview preview={projection.preview} counter={run.activeCounter} />
      <div className="sb-game-grid">
        <SystemBoard
          run={run}
          selectedInstanceId={state.selectedInstanceId}
          activeInstanceId={projection.activeInstanceId}
          disabled={state.phase === 'PLAYBACK'}
          onSelect={(instanceId) => dispatch({ type: 'SELECT_INSTANCE', instanceId })}
          onCommand={command}
        />
        <ModuleShop
          run={run}
          selectedInstanceId={state.selectedInstanceId}
          disabled={state.phase === 'PLAYBACK'}
          onSelect={(instanceId) => dispatch({ type: 'SELECT_INSTANCE', instanceId })}
          onCommand={command}
        />
      </div>
      {state.feedback && (
        <p className="sb-feedback" aria-live="polite">
          {state.feedback}
        </p>
      )}
      <ChainPlayback
        events={state.lastEvents}
        visibleCount={state.visibleEventCount}
        playing={state.phase === 'PLAYBACK'}
        onSkip={() => dispatch({ type: 'SKIP_PLAYBACK' })}
      />
    </main>
  );
}
