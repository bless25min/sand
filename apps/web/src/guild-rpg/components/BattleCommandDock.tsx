import type { SkillOutcomePreview } from '@expedition/simulation-core';

import type { CombatPlayback } from '../hooks/use-combat-playback';
import type { FirstHuntCoach } from '../onboarding/first-hunt-coach';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { SkillOutcomePreviewPanel } from './SkillOutcomePreviewPanel';
import { SixSkillControls } from './SixSkillControls';

export function BattleCommandDock({
  state,
  dispatch,
  playback,
  relay,
  commandActorName,
  coach,
  armedSkillId,
  preview,
  skillPreviews,
  executionWindow,
  onChooseSkill,
  onConfirmSkill,
}: {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
  playback: CombatPlayback;
  relay: number;
  commandActorName?: string | undefined;
  coach?: FirstHuntCoach | undefined;
  armedSkillId?: string | undefined;
  preview?: SkillOutcomePreview | undefined;
  skillPreviews: ReadonlyMap<string, SkillOutcomePreview>;
  executionWindow: boolean;
  onChooseSkill(skillId: string): void;
  onConfirmSkill(): void;
}) {
  const victory = state.battle?.status === 'victory';
  const defeat = state.battle?.status === 'defeat';
  const actorId = state.battle?.roundOrder?.activeAdventurerId;
  const actor = state.battle?.units.find(({ id }) => id === actorId);
  const target = state.battle?.units.find(({ id }) => id === state.battle?.selectedTargetId);
  const skill = state.profile.skillInventory.find(({ id }) => id === armedSkillId);

  return (
    <section
      className="gr-command-dock"
      data-locked={playback.isPlaying}
      data-relay={relay}
      data-execution={executionWindow}
    >
      {playback.isPlaying ? (
        <div className="gr-resolve-strip" data-resolve-strip="true" role="status">
          <span>接力第 {Math.max(1, relay)} 棒</span>
          <div aria-hidden="true">
            {Array.from({ length: 3 }, (_, index) => (
              <i key={index} />
            ))}
          </div>
          <strong>{playback.currentBeat?.label ?? '戰鬥演出中'}</strong>
        </div>
      ) : victory ? (
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
      ) : defeat ? (
        <div className="gr-finisher-dock gr-defeat-dock" role="status">
          <header>
            <span>EXPEDITION FAILED</span>
            <strong>遠征隊失去戰鬥能力</strong>
            <small>戰場保留最後結果；返回任務後可調整六人技能與出手順序。</small>
          </header>
          <button
            type="button"
            disabled={playback.isPlaying}
            onClick={() => dispatch({ type: 'ABANDON_HUNT' })}
          >
            {playback.isPlaying ? '戰敗演出中…' : '返回任務'}
          </button>
        </div>
      ) : (
        <>
          {coach && (
            <aside className="gr-battle-guide-strip" role="status">
              <b>引導</b>
              <span>{coach.title}</span>
              <small>{coach.message}</small>
            </aside>
          )}
          {preview && actor && target && skill ? (
            <SkillOutcomePreviewPanel
              actor={actor}
              target={target}
              skill={skill}
              preview={preview}
              onConfirm={onConfirmSkill}
            />
          ) : (
            <header className="gr-command-context">
              <strong>{commandActorName ?? '選擇角色'}</strong>
              <span aria-hidden="true">→</span>
              <strong>{executionWindow ? '敵軍破勢' : (target?.name ?? '選擇目標')}</strong>
            </header>
          )}
          <p className="gr-sr-only" role="status">
            {playback.isPlaying
              ? playback.currentBeat?.label
              : executionWindow
                ? `${commandActorName}可選擇第六棒終結方式`
                : (coach?.message ?? `${commandActorName}可從六個技能中自由選擇`)}
          </p>
          <SixSkillControls
            state={state}
            armedSkillId={armedSkillId}
            previews={skillPreviews}
            onChooseSkill={onChooseSkill}
            locked={playback.isPlaying}
          />
        </>
      )}
    </section>
  );
}
