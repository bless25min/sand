import { GUILD_GAME_CONTENT } from '@expedition/game-data';

import { formatTime } from '../presenters';
import { createFirstHuntCoach } from '../onboarding/first-hunt-coach';
import { createBattleSensationModel } from '../presentation/battle-sensation-model';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { BattleThumbControls } from './BattleThumbControls';
import { BattleUnitCard } from './BattleUnitCard';
import { ComboPlayback } from './ComboPlayback';
import { CommandComposer } from './CommandComposer';

interface BattleScreenProps {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}

export function BattleScreen({ state, dispatch }: BattleScreenProps) {
  const battle = state.battle!;
  const quest = GUILD_GAME_CONTENT.quests.find((candidate) => candidate.id === battle.questId)!;
  const sensation = createBattleSensationModel(state, GUILD_GAME_CONTENT);
  const coach = createFirstHuntCoach({
    tutorial: state.preferences.tutorial,
    screen: 'battle',
    questId: battle.questId,
    selectedBuildId: state.profile.selectedBuildId,
    ...(battle.selectedTargetId ? { selectedTargetId: battle.selectedTargetId } : {}),
    draftCardIds: battle.combo?.draft.cardIds ?? [],
    previewEventCount: sensation.preview.eventCount,
    rewardItemCount: 0,
    resolvedItemCount: 0,
    hasBorderRecord: Boolean(state.profile.questRecords.border_pack),
    replaying: state.tutorialReplay,
    previewAcknowledged: state.tutorialPreviewAcknowledged,
    bossExecutionOpen: Boolean(battle.combo?.activatedBossPhaseIds?.includes('alpha-execution')),
  });

  return (
    <main className="gr-battle">
      <header className="gr-battle__header">
        <div>
          <p>QUEST 0{GUILD_GAME_CONTENT.quests.indexOf(quest) + 1}</p>
          <h1>{quest.name}</h1>
          <span>
            {formatTime(battle.elapsedMs)} · 固定戰鬥碼 {battle.seed}
          </span>
        </div>
        <section
          className="gr-engine-cockpit"
          data-build-accent={sensation.build.accent}
          aria-label="目前 Build"
        >
          <p>ENGINE ONLINE · {sensation.build.payoffLabel}</p>
          <h2>{sensation.build.name}</h2>
          <span>{sensation.build.fantasy}</span>
        </section>
        <div className="gr-battle__controls">
          <div aria-label="戰鬥速度">
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
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_PAUSED', paused: !state.paused })}
          >
            {state.paused ? '繼續時間' : '暫停戰鬥'}
          </button>
          <button type="button" onClick={() => dispatch({ type: 'SET_SETTINGS_OPEN', open: true })}>
            開啟設定
          </button>
        </div>
      </header>

      {coach && (
        <section className="gr-coach" data-coach-step={coach.step} aria-live="polite">
          <div>
            <p>GUIDED HUNT · {coach.step.toUpperCase()}</p>
            <strong>{coach.message}</strong>
          </div>
          <button
            type="button"
            onClick={() =>
              dispatch(
                coach.step === 'preview'
                  ? { type: 'ACK_TUTORIAL_PREVIEW' }
                  : { type: 'SET_TUTORIAL', tutorial: 'skipped' },
              )
            }
          >
            {coach.step === 'preview' ? '確認預演' : '跳過教學'}
          </button>
        </section>
      )}

      <section className="gr-battlefield" aria-label="戰場">
        <div className="gr-line gr-line--heroes">
          <p>遠征隊</p>
          {battle.units
            .filter((unit) => unit.side === 'heroes')
            .map((unit) => (
              <BattleUnitCard key={unit.id} unit={unit} selected={false} />
            ))}
        </div>
        <div className="gr-versus" aria-hidden="true">
          <span />
          <b>VS</b>
          <span />
        </div>
        <div className="gr-line gr-line--enemies">
          <p>敵對軍勢 · 點選集火目標</p>
          {battle.units
            .filter((unit) => unit.side === 'enemies')
            .map((unit) => (
              <BattleUnitCard
                key={unit.id}
                unit={unit}
                selected={unit.id === battle.selectedTargetId}
                sensation={sensation.enemies.find((enemy) => enemy.id === unit.id)}
                onSelect={() => dispatch({ type: 'SELECT_TARGET', targetId: unit.id })}
              />
            ))}
        </div>
      </section>

      <CommandComposer state={state} dispatch={dispatch} />
      <BattleThumbControls state={state} dispatch={dispatch} />
      <ComboPlayback state={state} />

      {battle.status === 'defeat' && (
        <div className="gr-result" role="dialog" aria-modal="true">
          <div>
            <p>EXPEDITION FAILED</p>
            <h2>這次遠征沒有成功</h2>
            <span>沒有損失。調整裝備、隊長或開啟自動模式後再次挑戰。</span>
            <button
              type="button"
              className="gr-button gr-button--primary"
              onClick={() => dispatch({ type: 'RETURN_GUILD' })}
            >
              返回公會整備
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
