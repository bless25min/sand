import type { GuildPreferences } from '../preferences/guild-preferences';
import type { GuildRpgAction } from '../state/game-reducer';

interface GuildFeedbackSettingsProps {
  preferences: GuildPreferences;
  dispatch: React.Dispatch<GuildRpgAction>;
  surface: 'guild' | 'battle';
  allowTutorialReplay?: boolean;
}

export function GuildFeedbackSettings({
  preferences,
  dispatch,
  surface,
  allowTutorialReplay = false,
}: GuildFeedbackSettingsProps) {
  const volumePercent = Math.round(preferences.masterVolume * 100);
  const reducedMotion = preferences.motion === 'reduced';
  const volumeId = `gr-${surface}-master-volume`;

  return (
    <section className="gr-feedback-settings" data-feedback-settings={surface}>
      <header>
        <strong>遊戲回饋</strong>
        <small>調整後立即儲存</small>
      </header>
      <div className="gr-feedback-volume">
        <span>
          <label htmlFor={volumeId}>主音量</label>
          <output>{volumePercent}%</output>
        </span>
        <input
          id={volumeId}
          type="range"
          min="0"
          max="100"
          step="5"
          value={volumePercent}
          aria-label="主音量"
          onChange={(event) =>
            dispatch({
              type: 'SET_MASTER_VOLUME',
              volume: Number(event.currentTarget.value) / 100,
            })
          }
        />
      </div>
      <div className="gr-feedback-toggles">
        <button
          type="button"
          aria-pressed={preferences.musicEnabled}
          onClick={() =>
            dispatch({
              type: 'SET_AUDIO_ENABLED',
              enabled: !preferences.musicEnabled,
            })
          }
        >
          <span>戰鬥音效</span>
          <small>{preferences.musicEnabled ? '開' : '關'}</small>
        </button>
        <button
          type="button"
          aria-pressed={preferences.hapticsEnabled}
          onClick={() =>
            dispatch({
              type: 'SET_HAPTICS_ENABLED',
              enabled: !preferences.hapticsEnabled,
            })
          }
        >
          <span>震動回饋</span>
          <small>{preferences.hapticsEnabled ? '開' : '關'}</small>
        </button>
        <button
          type="button"
          aria-pressed={reducedMotion}
          onClick={() =>
            dispatch({
              type: 'SET_MOTION',
              motion: reducedMotion ? 'system' : 'reduced',
            })
          }
        >
          <span>精簡動態</span>
          <small>{reducedMotion ? '開' : '關'}</small>
        </button>
      </div>
      {allowTutorialReplay && (
        <button
          className="gr-feedback-tutorial"
          type="button"
          onClick={() => dispatch({ type: 'SET_TUTORIAL', tutorial: 'active' })}
        >
          重播新手教學
        </button>
      )}
    </section>
  );
}
