import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { CSSProperties } from 'react';

import { createPlaybackProjection, projectPlaybackUnits } from '../playback/playback-model';
import { createBattleSensationModel } from '../presentation/battle-sensation-model';
import { SPECTACLE_CUE_REGISTRY } from '../presentation/spectacle-registry';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { BattlefieldTacticalLayer } from './BattlefieldTacticalLayer';
import { BattleUnitCard } from './BattleUnitCard';
import { ComboPlayback } from './ComboPlayback';
import { CombatSpectacleLayers } from './CombatSpectacleLayers';

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
  const visibleBossPhaseIds = projection.events.flatMap((event) =>
    event.kind === 'boss_phase' && event.phaseId ? [event.phaseId] : [],
  );
  const sensation = createBattleSensationModel(state, GUILD_GAME_CONTENT, {
    activatedBossPhaseIds: visibleBossPhaseIds,
  });
  const targetSensation = sensation.enemies.find(
    (enemy) => enemy.id === projection.currentImpact.targetId,
  );
  const hunt = GUILD_GAME_CONTENT.hunts.find((candidate) => candidate.questId === battle.questId);
  const huntBeat =
    projection.stage === 'annihilation'
      ? 'annihilation'
      : projection.stage === 'execution'
        ? 'execution'
        : 'opening';
  const huntCue = hunt?.spectacleCues?.find((cue) => cue.beat === huntBeat);
  const spectacleEventId = projection.events.at(-1)?.id ?? 'opening';
  const spectacleSpec = SPECTACLE_CUE_REGISTRY[projection.currentImpact.kind];

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

      <section
        className="gr-battlefield"
        data-spectacle-cue={projection.currentImpact.kind}
        style={
          {
            '--battle-shake': `${spectacleSpec.shakePx}px`,
            '--battle-hit-stop': `${spectacleSpec.hitStopMs}ms`,
          } as CSSProperties
        }
        aria-label="軍令播放戰場"
        key={spectacleEventId}
      >
        <BattlefieldTacticalLayer
          units={visibleUnits}
          selectedTargetId={battle.selectedTargetId}
          impact={projection.currentImpact}
          motif={sensation.build.accent}
          mode="playback"
        />
        <CombatSpectacleLayers
          eventId={spectacleEventId}
          impact={projection.currentImpact}
          motif={sensation.build.accent}
          enemyIdentity={targetSensation?.identity}
          huntCue={huntCue}
        />
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
                sensation={sensation.enemies.find((enemy) => enemy.id === unit.id)}
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
                sensation={sensation.enemies.find((enemy) => enemy.id === unit.id)}
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
