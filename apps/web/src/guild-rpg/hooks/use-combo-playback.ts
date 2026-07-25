import { useEffect, useState } from 'react';

import { nextPlaybackTick } from '../playback/playback-model';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';

export function useComboPlayback(state: GuildRpgState, dispatch: React.Dispatch<GuildRpgAction>) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (state.screen !== 'playback' || !state.playback || !state.battle?.combo || state.paused) {
      return;
    }
    const events = state.battle.combo.events.slice(state.playback.eventStartIndex);
    const tick = nextPlaybackTick({
      events,
      reducedMotion: state.preferences.motion === 'reduced' || reducedMotion,
      speed: state.speed,
      visibleEventCount: state.playback.visibleEventCount,
    });
    const timer = window.setTimeout(() => {
      dispatch(
        tick.type === 'advance'
          ? { type: 'ADVANCE_PLAYBACK', count: tick.count }
          : { type: 'COMPLETE_PLAYBACK' },
      );
    }, tick.delayMs);
    return () => window.clearTimeout(timer);
  }, [
    dispatch,
    reducedMotion,
    state.battle,
    state.paused,
    state.playback,
    state.preferences.motion,
    state.screen,
    state.speed,
  ]);
}
