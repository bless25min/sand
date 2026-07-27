import type { GuildBattleEvent } from '@expedition/shared-types';
import { useEffect, useMemo, useState } from 'react';

import { playCombatSensation } from '../effects/combat-sensation';
import type { GuildPreferences } from '../preferences/guild-preferences';
import {
  advanceCombatPlayback,
  createCombatBeats,
  type CombatBeat,
} from '../presentation/combat-beats';

interface PlaybackCursor {
  key: string;
  index: number;
  complete: boolean;
}

export interface CombatPlayback {
  currentBeat?: CombatBeat;
  visibleBeats: readonly CombatBeat[];
  isPlaying: boolean;
}

export function useCombatPlayback(
  events: readonly GuildBattleEvent[],
  relay: number,
  preferences: GuildPreferences,
): CombatPlayback {
  const sequenceKey = events.map(({ id }) => id).join(':');
  const beats = useMemo(
    () => createCombatBeats(events, relay, preferences.motion === 'reduced'),
    [events, preferences.motion, relay],
  );
  const [cursor, setCursor] = useState<PlaybackCursor>(() => ({
    key: sequenceKey,
    index: 0,
    complete: beats.length === 0,
  }));
  const sequenceChanged = cursor.key !== sequenceKey;
  const activeIndex = sequenceChanged ? 0 : cursor.index;
  const currentBeat = beats[activeIndex];
  const complete = beats.length === 0 || (!sequenceChanged && cursor.complete);

  useEffect(() => {
    if (!sequenceChanged) return;
    setCursor({ key: sequenceKey, index: 0, complete: beats.length === 0 });
  }, [beats.length, sequenceChanged, sequenceKey]);

  useEffect(() => {
    if (sequenceChanged || complete || !currentBeat) return;
    playCombatSensation(currentBeat, preferences);
    const timeout = window.setTimeout(
      () => {
        setCursor((current) => {
          if (current.key !== sequenceKey) return current;
          const next = advanceCombatPlayback(beats, current.index);
          return { key: sequenceKey, ...next };
        });
      },
      Math.max(16, currentBeat.delayMs),
    );
    return () => window.clearTimeout(timeout);
  }, [beats, complete, currentBeat, preferences, sequenceChanged, sequenceKey]);

  return {
    ...(currentBeat ? { currentBeat } : {}),
    visibleBeats: beats.slice(0, activeIndex + 1),
    isPlaying: !complete,
  };
}
