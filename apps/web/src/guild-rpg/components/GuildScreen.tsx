import { GUILD_GAME_CONTENT } from '@expedition/game-data';

import { createFirstHuntCoach, isFirstHuntCoachFocus } from '../onboarding/first-hunt-coach';
import type { GuildPage, GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { EquipmentWorkbench } from './EquipmentWorkbench';
import { GuildFeedbackSettings } from './GuildFeedbackSettings';
import { GuildTrainingChecklist } from './GuildTrainingChecklist';
import { QuestBoard } from './QuestBoard';
import { SkillFusionWorkbench } from './SkillFusionWorkbench';
import { SkillLoadoutPanel } from './SkillLoadoutPanel';
import { TeamOrderPanel } from './TeamOrderPanel';

const NAV: readonly { id: GuildPage; label: string }[] = [
  { id: 'quest', label: '任務' },
  { id: 'party', label: '隊伍' },
  { id: 'skills', label: '技能' },
  { id: 'equipment', label: '裝備' },
];

function Coach({
  state,
  dispatch,
}: {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}) {
  if (state.tutorialStep === 'start_hunt') return null;
  const hero = GUILD_GAME_CONTENT.adventurers.find(({ id }) => id === state.selectedHeroId);
  const coach = createFirstHuntCoach(state.preferences.tutorial, state.tutorialStep, {
    ...(hero ? { heroName: hero.name } : {}),
    surface: 'guild',
  });
  if (!coach) return null;
  return (
    <aside className="gr-coach" role="status" data-guide-step={coach.step}>
      <b>
        {coach.stepNumber}/{coach.stepTotal}
      </b>
      <span>
        <strong>{coach.title}</strong>
        <small>{coach.message}</small>
      </span>
      <button
        type="button"
        aria-label="略過新手引導"
        onClick={() => dispatch({ type: 'SET_TUTORIAL', tutorial: 'skipped' })}
      >
        ×
      </button>
    </aside>
  );
}

export function GuildScreen({
  state,
  dispatch,
}: {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}) {
  const materialCount = Object.values(state.profile.materials).reduce(
    (sum, value) => sum + value,
    0,
  );
  return (
    <main className="gr-shell" data-shell="single-screen">
      <header className="gr-topbar">
        <div className="gr-brand">
          <span>EXPEDITION GUILD</span>
          <strong>六人接力刷寶遠征</strong>
        </div>
        <div className="gr-resources">
          <span>
            幣 <strong>{state.profile.gold}</strong>
          </span>
          <span>
            裝 <strong>{state.profile.inventory.length}</strong>
          </span>
          <span>
            技 <strong>{state.profile.skillInventory.length}</strong>
          </span>
          <span>
            材 <strong>{materialCount}</strong>
          </span>
        </div>
      </header>
      <Coach state={state} dispatch={dispatch} />
      <details className="gr-help-drawer">
        <summary aria-label="開啟教學與遊戲設定">⚙</summary>
        <div>
          <GuildTrainingChecklist state={state} />
          <GuildFeedbackSettings
            preferences={state.preferences}
            dispatch={dispatch}
            surface="guild"
            allowTutorialReplay
          />
          <aside className="gr-help-basics" aria-label="基本操作">
            <strong>四個固定入口</strong>
            <span>任務：選區域與狩獵目標</span>
            <span>隊伍：選角色與調整接力順序</span>
            <span>技能：六格裝備與融合升星</span>
            <span>裝備：換裝、校準與整理背包</span>
          </aside>
        </div>
      </details>
      <p className="gr-status-line gr-sr-only" role="status">
        {state.message}
      </p>
      <section className="gr-page-viewport" data-page-viewport={state.page}>
        {state.page === 'quest' && <QuestBoard state={state} dispatch={dispatch} />}
        {state.page === 'party' && <TeamOrderPanel state={state} dispatch={dispatch} />}
        {state.page === 'skills' && (
          <>
            <nav className="gr-workspace-tabs" aria-label="技能工作區">
              <button
                type="button"
                data-workspace-tab="loadout"
                aria-current={state.skillWorkspace === 'loadout' ? 'page' : undefined}
                onClick={() => dispatch({ type: 'SELECT_SKILL_WORKSPACE', workspace: 'loadout' })}
              >
                裝備技能
              </button>
              <button
                type="button"
                data-workspace-tab="fusion"
                aria-current={state.skillWorkspace === 'fusion' ? 'page' : undefined}
                onClick={() => dispatch({ type: 'SELECT_SKILL_WORKSPACE', workspace: 'fusion' })}
              >
                融合升星
              </button>
            </nav>
            {state.skillWorkspace === 'loadout' ? (
              <SkillLoadoutPanel state={state} dispatch={dispatch} />
            ) : (
              <SkillFusionWorkbench state={state} dispatch={dispatch} />
            )}
          </>
        )}
        {state.page === 'equipment' && <EquipmentWorkbench state={state} dispatch={dispatch} />}
      </section>
      <nav className="gr-main-nav" aria-label="主要遊戲介面">
        {NAV.map((item) => (
          <button
            type="button"
            aria-current={state.page === item.id ? 'page' : undefined}
            data-guide-id={`nav:${item.id}`}
            data-guide-active={isFirstHuntCoachFocus(
              state.preferences.tutorial,
              state.tutorialStep,
              `nav:${item.id}`,
            )}
            key={item.id}
            onClick={() => dispatch({ type: 'NAVIGATE', page: item.id })}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </main>
  );
}
