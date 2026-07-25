import type { Dispatch, SetStateAction } from 'react';

import type { ThumbDeckAction } from '../components/ThumbCommandDeck';
import type { GuildRpgAction } from '../state/game-reducer';
import { wrapThumbIndex } from './thumb-deck-model';

interface PartyActionsInput {
  memberId: string;
  heroName: string;
  isLeader: boolean;
  partyLength: number;
  dispatch: React.Dispatch<GuildRpgAction>;
  setPartyIndex: Dispatch<SetStateAction<number>>;
}

export function createPartyThumbActions({
  memberId,
  heroName,
  isLeader,
  partyLength,
  dispatch,
  setPartyIndex,
}: PartyActionsInput): readonly ThumbDeckAction[] {
  return [
    {
      id: 'previous-member',
      label: '上一位',
      slot: 'secondary',
      onPress: () => setPartyIndex((current) => wrapThumbIndex(current, partyLength, -1)),
    },
    {
      id: 'next-member',
      label: '下一位',
      slot: 'choice-a',
      onPress: () => setPartyIndex((current) => wrapThumbIndex(current, partyLength, 1)),
    },
    {
      id: 'set-leader',
      label: isLeader ? '目前隊長' : '設為隊長',
      detail: heroName,
      slot: 'primary',
      tone: 'primary',
      disabled: isLeader,
      onPress: () => dispatch({ type: 'SET_LEADER', adventurerId: memberId }),
    },
  ];
}
