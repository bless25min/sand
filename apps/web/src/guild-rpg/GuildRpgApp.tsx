import { useEffect, useReducer } from 'react';

import { BattleScreen } from './components/BattleScreen';
import { GuildScreen } from './components/GuildScreen';
import { RewardScreen } from './components/RewardScreen';
import { storeGuildPreferences } from './preferences/guild-preferences';
import { createGuildRpgState, loadGuildRpgState } from './state/create-game-state';
import { guildRpgReducer } from './state/game-reducer';
import { storeGuildSave } from './storage/guild-save';
import './guild-rpg.css';

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
    if (state.screen === 'battle') return;
    const target = document.querySelector<HTMLElement>('[data-guide-active="true"]');
    if (!target) return;
    const rect = target.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      target.scrollIntoView({
        behavior: state.preferences.motion === 'reduced' ? 'auto' : 'smooth',
        block: 'center',
      });
    }
  }, [state.preferences.motion, state.screen, state.tutorialStep]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [state.screen]);

  if (state.screen === 'battle') return <BattleScreen state={state} dispatch={dispatch} />;
  if (state.screen === 'rewards') return <RewardScreen state={state} dispatch={dispatch} />;
  return <GuildScreen state={state} dispatch={dispatch} />;
}
