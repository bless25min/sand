import type { BuildDefinition } from '@expedition/shared-types';
import type { Dispatch, SetStateAction } from 'react';

import type { ThumbDeckAction } from '../components/ThumbCommandDeck';
import type { GuildRpgAction } from '../state/game-reducer';
import { wrapThumbIndex } from './thumb-deck-model';

interface BuildActionsInput {
  build: BuildDefinition;
  buildCount: number;
  activeBuildId: string;
  dispatch: React.Dispatch<GuildRpgAction>;
  setBuildIndex: Dispatch<SetStateAction<number>>;
  onOpenLoadout?: () => void;
}

export function createBuildThumbActions({
  build,
  buildCount,
  activeBuildId,
  dispatch,
  setBuildIndex,
  onOpenLoadout,
}: BuildActionsInput): readonly ThumbDeckAction[] {
  const active = build.id === activeBuildId;
  return [
    {
      id: 'previous-build',
      label: '上一個',
      slot: 'secondary',
      onPress: () => setBuildIndex((current) => wrapThumbIndex(current, buildCount, -1)),
    },
    {
      id: 'next-build',
      label: '下一個',
      slot: 'choice-a',
      onPress: () => setBuildIndex((current) => wrapThumbIndex(current, buildCount, 1)),
    },
    {
      id: onOpenLoadout ? 'loadout' : 'settings',
      label: onOpenLoadout ? '牌組編成' : '設定',
      slot: 'utility',
      onPress: onOpenLoadout ?? (() => dispatch({ type: 'SET_SETTINGS_OPEN', open: true })),
    },
    {
      id: 'activate-build',
      label: active ? '目前 Build' : '啟動 Build',
      detail: build.payoffLabel,
      slot: 'primary',
      tone: 'primary',
      disabled: active,
      selected: active,
      onPress: () => dispatch({ type: 'SET_BUILD', buildId: build.id }),
    },
  ];
}
