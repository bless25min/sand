import type { GuildCombatScene } from '@expedition/pixi-renderer';
import { useSyncExternalStore } from 'react';

const QUERY = '(max-width: 620px)';

const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};

const isPortrait = () => window.matchMedia(QUERY).matches;

export function useBattlefieldLayout(): GuildCombatScene['layout'] {
  const portrait = useSyncExternalStore(subscribe, isPortrait, () => false);
  return portrait ? 'portrait' : 'landscape';
}
