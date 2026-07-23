import { useEffect } from 'react';

import type { SystemBreakerUiAction, SystemBreakerUiState } from './system-breaker-ui-state';
import { saveFragment } from './system-breaker-storage';

export const browserStorage = () =>
  typeof window === 'undefined' ? undefined : window.localStorage;

export function usePlayback(
  state: SystemBreakerUiState,
  dispatch: React.Dispatch<SystemBreakerUiAction>,
): void {
  useEffect(() => {
    if (state.phase !== 'PLAYBACK') return;
    if (state.speed === 0) {
      dispatch({ type: 'SKIP_PLAYBACK' });
      return;
    }
    const timer = window.setTimeout(
      () => dispatch({ type: 'PLAYBACK_TICK' }),
      state.speed === 2 ? 90 : 210,
    );
    return () => window.clearTimeout(timer);
  }, [dispatch, state.phase, state.speed, state.visibleEventCount]);
}

export function useFragmentPersistence(state: SystemBreakerUiState): void {
  useEffect(() => {
    const fragment = state.run?.fragment;
    const storage = browserStorage();
    if (state.phase === 'ENDING' && fragment && storage) saveFragment(fragment, storage);
  }, [state.phase, state.run?.fragment]);
}
