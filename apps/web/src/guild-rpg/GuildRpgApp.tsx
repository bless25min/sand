import { useEffect, useReducer } from 'react';

import { BattleScreen } from './components/BattleScreen';
import { ComboPlaybackScreen } from './components/ComboPlaybackScreen';
import { GuildScreen } from './components/GuildScreen';
import { GuildSettingsPanel } from './components/GuildSettingsPanel';
import { RewardScreen } from './components/RewardScreen';
import { useBattleClock } from './hooks/use-battle-clock';
import { useComboPlayback } from './hooks/use-combo-playback';
import { useSensationOutput } from './hooks/use-sensation-output';
import { storeGuildPreferences } from './preferences/guild-preferences';
import { createGuildRpgState, loadGuildRpgState } from './state/create-game-state';
import { guildRpgReducer } from './state/game-reducer';
import { storeGuildSave } from './storage/guild-save';
import './guild-rpg.css';
import './guild-screen.css';
import './party.css';
import './quest-board.css';
import './battle.css';
import './battle-command.css';
import './combat-spectacle.css';
import './tactical-battlefield.css';
import './rewards.css';
import './reward-items.css';
import './thumb-command-deck.css';
import './mobile-guild.css';
import './mobile-battle.css';
import './mobile-rewards.css';
import './long-term-loop.css';

function initialState() {
  return typeof window === 'undefined'
    ? createGuildRpgState()
    : loadGuildRpgState(window.localStorage);
}

export function GuildRpgApp() {
  const [state, dispatch] = useReducer(guildRpgReducer, undefined, initialState);
  const battleRunning =
    state.screen === 'battle' &&
    state.battle?.status === 'active' &&
    !state.battle.pendingLeaderId &&
    !state.paused;

  useBattleClock(battleRunning, state.speed, dispatch);
  useComboPlayback(state, dispatch);
  useSensationOutput(state);

  useEffect(() => {
    if (state.screen !== 'guild') return;
    storeGuildSave(window.localStorage, state.profile);
  }, [state.profile, state.screen]);

  useEffect(() => {
    storeGuildPreferences(window.localStorage, state.preferences);
    document.documentElement.dataset.guildMotion = state.preferences.motion;
  }, [state.preferences]);

  const screen =
    state.screen === 'battle' ? (
      <BattleScreen state={state} dispatch={dispatch} />
    ) : state.screen === 'playback' ? (
      <ComboPlaybackScreen state={state} dispatch={dispatch} />
    ) : state.screen === 'rewards' ? (
      <RewardScreen state={state} dispatch={dispatch} />
    ) : (
      <GuildScreen state={state} dispatch={dispatch} />
    );

  return (
    <>
      {screen}
      {state.settingsOpen && <GuildSettingsPanel state={state} dispatch={dispatch} />}
    </>
  );
}
