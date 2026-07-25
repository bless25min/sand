import { useEffect } from 'react';

import type { GuildRpgAction } from '../state/game-reducer';

export function useBattleClock(
  running: boolean,
  speed: 1 | 2,
  dispatch: React.Dispatch<GuildRpgAction>,
) {
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () => dispatch({ type: 'TICK', elapsedMs: 100 }),
      speed === 2 ? 50 : 100,
    );
    return () => window.clearInterval(timer);
  }, [dispatch, running, speed]);
}
