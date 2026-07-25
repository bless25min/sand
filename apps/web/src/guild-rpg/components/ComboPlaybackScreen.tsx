import { GUILD_GAME_CONTENT } from '@expedition/game-data';

import { createPlaybackProjection, projectPlaybackUnits } from '../playback/playback-model';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { BattleUnitCard } from './BattleUnitCard';
import { ComboPlayback } from './ComboPlayback';

interface ComboPlaybackScreenProps {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}

export function ComboPlaybackScreen({ state, dispatch }: ComboPlaybackScreenProps) {
  const battle = state.battle!;
  const playback = state.playback!;
  const quest = GUILD_GAME_CONTENT.quests.find((candidate) => candidate.id === battle.questId)!;
  const projection = createPlaybackProjection(
    battle.combo!,
    playback.eventStartIndex,
    playback.visibleEventCount,
  );
  const visibleUnits = projectPlaybackUnits(playback.startingUnits, battle.units, projection);

  return (
    <main
      className="gr-battle gr-playback-screen"
      data-escalation-stage={projection.stage}
      data-impact-kind={projection.currentImpact.kind}
    >
      <header className="gr-battle__header">
        <div>
          <p>PLAY RELEASE · QUEST {GUILD_GAME_CONTENT.quests.indexOf(quest) + 1}</p>
          <h1>播放連擊：{quest.name}</h1>
          <span>
            {projection.progress.visible} / {projection.progress.total} 個可追溯事件
          </span>
        </div>
        <div className="gr-playback__controls">
          <div aria-label="播放速度">
            {[1, 2].map((speed) => (
              <button
                type="button"
                className={state.speed === speed ? 'is-active' : ''}
                key={speed}
                onClick={() => dispatch({ type: 'SET_SPEED', speed: speed as 1 | 2 })}
              >
                {speed}x
              </button>
            ))}
          </div>
          <button type="button" onClick={() => dispatch({ type: 'SKIP_PLAYBACK' })}>
            跳過播放
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_PAUSED', paused: !state.paused })}
          >
            {state.paused ? '繼續播放' : '暫停播放'}
          </button>
          <button type="button" onClick={() => dispatch({ type: 'SET_SETTINGS_OPEN', open: true })}>
            開啟設定
          </button>
        </div>
      </header>

      <section className="gr-battlefield" aria-label="軍令播放戰場">
        <div className="gr-line gr-line--heroes">
          <p>遠征隊</p>
          {visibleUnits
            .filter((unit) => unit.side === 'heroes')
            .map((unit) => (
              <BattleUnitCard
                key={unit.id}
                unit={unit}
                selected={false}
                impact={projection.currentImpact}
              />
            ))}
        </div>
        <div className="gr-versus" aria-hidden="true">
          <span />
          <b>VS</b>
          <span />
        </div>
        <div className="gr-line gr-line--enemies">
          <p>敵對軍勢 · 結算狀態</p>
          {visibleUnits
            .filter((unit) => unit.side === 'enemies')
            .map((unit) => (
              <BattleUnitCard
                key={unit.id}
                unit={unit}
                selected={false}
                impact={projection.currentImpact}
              />
            ))}
        </div>
      </section>

      <ComboPlayback
        state={state}
        eventStartIndex={playback.eventStartIndex}
        visibleEventCount={playback.visibleEventCount}
      />
    </main>
  );
}
