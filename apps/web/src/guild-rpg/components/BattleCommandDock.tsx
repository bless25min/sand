import type { CombatPlayback } from '../hooks/use-combat-playback';
import type { FirstHuntCoach } from '../onboarding/first-hunt-coach';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { SixSkillControls } from './SixSkillControls';

export function BattleCommandDock({
  state,
  dispatch,
  playback,
  relay,
  commandActorName,
  coach,
}: {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
  playback: CombatPlayback;
  relay: number;
  commandActorName?: string | undefined;
  coach?: FirstHuntCoach | undefined;
}) {
  const victory = state.battle?.status === 'victory';
  return (
    <section className="gr-command-dock" data-locked={playback.isPlaying}>
      {victory ? (
        <div className="gr-finisher-dock" role="status">
          <header>
            <span>SIXTH RELAY · FINISHER</span>
            <strong>{playback.isPlaying ? '終結連鎖正在爆發' : '六人接力已完整爆發'}</strong>
            <small>
              {playback.isPlaying
                ? '傷害、狀態、連鎖與終結事件會依序顯示。'
                : '最後戰果會留在戰場；確認後一次收下全部掉落。'}
            </small>
          </header>
          <button
            type="button"
            data-guide-id="battle:collect"
            disabled={playback.isPlaying}
            onClick={() => dispatch({ type: 'COLLECT_VICTORY' })}
          >
            {playback.isPlaying ? '終結演出中…' : '收下全部戰利品'}
          </button>
        </div>
      ) : (
        <>
          <header className={coach ? 'gr-battle-guide-strip' : undefined} role="status">
            <div>
              <span>
                {coach
                  ? `實戰引導 ${coach.stepNumber}/${coach.stepTotal} · ${coach.title}`
                  : `${playback.isPlaying ? '技能演出中' : '點擊後立即結算'} · 接力 ${relay}/6`}
              </span>
              <strong>
                {playback.isPlaying
                  ? playback.currentBeat?.label
                  : (coach?.message ?? `${commandActorName}可從六個技能中自由選擇`)}
              </strong>
            </div>
            {coach && (
              <button
                type="button"
                disabled={playback.isPlaying}
                onClick={() => dispatch({ type: 'SET_TUTORIAL', tutorial: 'skipped' })}
              >
                略過
              </button>
            )}
          </header>
          <SixSkillControls state={state} dispatch={dispatch} locked={playback.isPlaying} />
        </>
      )}
    </section>
  );
}
