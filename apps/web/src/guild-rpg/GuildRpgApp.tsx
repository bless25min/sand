import { useEffect, useReducer } from 'react';

import { BattleScreen } from './components/BattleScreen';
import { ComboPlaybackScreen } from './components/ComboPlaybackScreen';
import { GuildScreen } from './components/GuildScreen';
import { RewardScreen } from './components/RewardScreen';
import { useBattleClock } from './hooks/use-battle-clock';
import { useComboPlayback } from './hooks/use-combo-playback';
import { createGuildRpgState } from './state/create-game-state';
import { guildRpgReducer } from './state/game-reducer';
import { loadGuildSave, storeGuildSave } from './storage/guild-save';
import './guild-rpg.css';
import './guild-screen.css';
import './party.css';
import './quest-board.css';
import './battle.css';
import './battle-command.css';
import './rewards.css';
import './reward-items.css';
import './thumb-command-deck.css';
import './mobile-guild.css';
import './mobile-battle.css';
import './mobile-rewards.css';

function initialState() {
  const saved = typeof window === 'undefined' ? undefined : loadGuildSave(window.localStorage);
  return createGuildRpgState(saved);
}

export function GuildRpgApp() {
  const [state, dispatch] = useReducer(guildRpgReducer, undefined, initialState);
  const battleRunning =
    state.screen === 'battle' && state.battle?.status === 'active' && !state.battle.pendingLeaderId;

  useBattleClock(battleRunning, state.speed, dispatch);
  useComboPlayback(state, dispatch);

  useEffect(() => {
    if (state.screen !== 'guild') return;
    storeGuildSave(window.localStorage, state.profile);
  }, [state.profile, state.screen]);

  if (state.screen === 'battle') return <BattleScreen state={state} dispatch={dispatch} />;
  if (state.screen === 'playback') return <ComboPlaybackScreen state={state} dispatch={dispatch} />;
  if (state.screen === 'rewards') return <RewardScreen state={state} dispatch={dispatch} />;
  return <GuildScreen state={state} dispatch={dispatch} />;
}
