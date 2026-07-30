import { reduceGuildSession, type GuildRpgAction, type GuildRpgState } from './reducer';
import { storeGuildSession, type GuildSavePort } from './save';
import { loadGuildSession } from './state';

export interface GuildSessionController {
  getState(): GuildRpgState;
  dispatch(action: GuildRpgAction): GuildRpgState;
  subscribe(listener: (state: GuildRpgState) => void): () => void;
}

export function createGuildSessionController(storage: GuildSavePort): GuildSessionController {
  let state = loadGuildSession(storage);
  const listeners = new Set<(state: GuildRpgState) => void>();

  return {
    getState: () => state,
    dispatch: (action) => {
      const next = reduceGuildSession(state, action);
      if (next === state) return state;

      state = next;
      storeGuildSession(storage, state);
      listeners.forEach((listener) => listener(state));
      return state;
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
