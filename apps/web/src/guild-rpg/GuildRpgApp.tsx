import { useEffect, useReducer } from 'react';

import { BattleScreen } from './components/BattleScreen';
import { GuildScreen } from './components/GuildScreen';
import { RewardScreen } from './components/RewardScreen';
import { storeGuildPreferences } from './preferences/guild-preferences';
import { createGuildRpgState, loadGuildRpgState } from './state/create-game-state';
import { guildRpgReducer } from './state/game-reducer';
import { storeGuildSave } from './storage/guild-save';
import './guild-rpg.css';
import './guild-combat.css';
import './guild-interface.css';
import './guild-rewards.css';

const initialState = () =>
  typeof window === 'undefined' ? createGuildRpgState() : loadGuildRpgState(window.localStorage);

export function GuildRpgApp() {
  const [state, dispatch] = useReducer(guildRpgReducer, undefined, initialState);

  useEffect(() => {
    storeGuildSave(window.localStorage, state.profile);
  }, [state.profile]);

  useEffect(() => {
    storeGuildPreferences(window.localStorage, state.preferences);
    document.documentElement.dataset.guildMotion = state.preferences.motion;
  }, [state.preferences]);

  useEffect(() => {
    document.documentElement.dataset.guildScreen = state.screen;
    document.documentElement.dataset.guildPage = state.page;
    return () => {
      delete document.documentElement.dataset.guildScreen;
      delete document.documentElement.dataset.guildPage;
    };
  }, [state.page, state.screen]);

  if (state.screen === 'battle') return <BattleScreen state={state} dispatch={dispatch} />;
  if (state.screen === 'rewards') return <RewardScreen state={state} dispatch={dispatch} />;
  return <GuildScreen state={state} dispatch={dispatch} />;
}
