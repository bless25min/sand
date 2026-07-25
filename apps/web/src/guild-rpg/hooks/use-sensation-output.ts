import { useEffect, useRef } from 'react';

import {
  createBrowserSensationOutput,
  type SensationOutput,
} from '../effects/browser-sensation-output';
import { createSensationCueTracker } from '../presentation/sensation-cues';
import type { GuildRpgState } from '../state/game-reducer';

export function useSensationOutput(state: GuildRpgState) {
  const outputRef = useRef<SensationOutput | undefined>(undefined);
  const trackerRef = useRef(createSensationCueTracker());
  const pausedRef = useRef(state.paused);
  pausedRef.current = state.paused;

  useEffect(() => {
    const output = createBrowserSensationOutput(undefined, state.preferences);
    outputRef.current = output;
    const unlock = () => output.unlock();
    const syncVisibility = () => output.setPaused(pausedRef.current || document.hidden);
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      document.removeEventListener('visibilitychange', syncVisibility);
      output.dispose();
      outputRef.current = undefined;
    };
    // The output has its own preference updater and should live for the app session.
  }, []);

  useEffect(() => {
    outputRef.current?.updatePreferences(state.preferences);
  }, [state.preferences]);

  useEffect(() => {
    outputRef.current?.setPaused(state.paused || document.hidden);
  }, [state.paused]);

  useEffect(() => {
    const runtime = state.battle?.combo;
    const visibleEvents =
      state.screen === 'playback' && state.playback && runtime
        ? runtime.events.slice(
            state.playback.eventStartIndex,
            state.playback.eventStartIndex + state.playback.visibleEventCount,
          )
        : state.screen === 'rewards' && runtime
          ? runtime.events
          : [];
    const cues = trackerRef.current.next({
      sessionId: state.battle?.seed ?? 'guild',
      screen: state.screen,
      visibleEvents,
      activatedRuleIds: state.screen === 'guild' ? [] : state.activatedRuleIds,
    });
    for (const cue of cues) outputRef.current?.play(cue);
  }, [
    state.activatedRuleIds,
    state.battle?.combo,
    state.battle?.seed,
    state.playback,
    state.screen,
  ]);
}
