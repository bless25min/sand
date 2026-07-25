import { useState } from 'react';

import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';

interface GuildSettingsPanelProps {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}

export function GuildSettingsPanel({ state, dispatch }: GuildSettingsPanelProps) {
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const inHunt = state.screen === 'battle' || state.screen === 'playback';
  const close = () => {
    dispatch({ type: 'SET_SETTINGS_OPEN', open: false });
    if (inHunt) dispatch({ type: 'SET_PAUSED', paused: false });
  };

  return (
    <section className="gr-settings" role="dialog" aria-modal="true" aria-label="遊戲設定">
      <div className="gr-settings__panel">
        <header>
          <p>EXPEDITION CONTROL</p>
          <h2>遊戲設定</h2>
          <span>所有感官設定只改變呈現，不改變戰鬥結果。</span>
        </header>

        <label>
          <span>音效音量</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={state.preferences.masterVolume}
            onChange={(event) =>
              dispatch({
                type: 'UPDATE_PREFERENCES',
                preferences: { masterVolume: Number(event.currentTarget.value) },
              })
            }
          />
        </label>
        <button
          type="button"
          aria-pressed={state.preferences.musicEnabled}
          onClick={() =>
            dispatch({
              type: 'UPDATE_PREFERENCES',
              preferences: { musicEnabled: !state.preferences.musicEnabled },
            })
          }
        >
          戰鬥音效：{state.preferences.musicEnabled ? '開啟' : '關閉'}
        </button>
        <button
          type="button"
          aria-pressed={state.preferences.hapticsEnabled}
          onClick={() =>
            dispatch({
              type: 'UPDATE_PREFERENCES',
              preferences: { hapticsEnabled: !state.preferences.hapticsEnabled },
            })
          }
        >
          震動：{state.preferences.hapticsEnabled ? '開啟' : '關閉'}
        </button>
        <button
          type="button"
          aria-pressed={state.preferences.motion === 'reduced'}
          onClick={() =>
            dispatch({
              type: 'UPDATE_PREFERENCES',
              preferences: {
                motion: state.preferences.motion === 'reduced' ? 'system' : 'reduced',
              },
            })
          }
        >
          減少動態：{state.preferences.motion === 'reduced' ? '開啟' : '跟隨系統'}
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_TUTORIAL', tutorial: 'active' })}
        >
          重新播放教學
        </button>

        <div className="gr-settings__actions">
          <button type="button" className="gr-button gr-button--primary" onClick={close}>
            {inHunt ? '繼續戰鬥' : '關閉設定'}
          </button>
          {inHunt && (
            <button
              type="button"
              className="gr-button gr-button--danger"
              onClick={() => {
                if (confirmAbandon) dispatch({ type: 'ABANDON_HUNT' });
                else setConfirmAbandon(true);
              }}
            >
              {confirmAbandon ? '確認中止' : '中止本次遠征'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
