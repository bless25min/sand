import { GUILD_GAME_CONTENT } from '@expedition/game-data';

import { createFirstHuntCoach, isFirstHuntCoachFocus } from '../onboarding/first-hunt-coach';
import type { GuildPage, GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { EquipmentWorkbench } from './EquipmentWorkbench';
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
      <div>
        <span>
          實戰引導 {coach.stepNumber}/{coach.stepTotal}
        </span>
        <strong>{coach.title}</strong>
        <p>{coach.message}</p>
      </div>
      <button type="button" onClick={() => dispatch({ type: 'SET_TUTORIAL', tutorial: 'skipped' })}>
        略過引導
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
    <main className="gr-shell">
      <header className="gr-topbar">
        <div className="gr-brand">
          <span>EXPEDITION GUILD · V4</span>
          <strong>六人接力刷寶遠征</strong>
        </div>
        <div className="gr-resources">
          <span>
            金幣 <strong>{state.profile.gold}</strong>
          </span>
          <span>
            裝備 <strong>{state.profile.inventory.length}</strong>
          </span>
          <span>
            技能 <strong>{state.profile.skillInventory.length}</strong>
          </span>
          <span>
            素材 <strong>{materialCount}</strong>
          </span>
        </div>
      </header>
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
      <Coach state={state} dispatch={dispatch} />
      <GuildTrainingChecklist state={state} />
      <p className="gr-status-line" role="status">
        {state.message}
      </p>
      {state.page === 'quest' && <QuestBoard state={state} dispatch={dispatch} />}
      {state.page === 'party' && <TeamOrderPanel state={state} dispatch={dispatch} />}
      {state.page === 'skills' && (
        <>
          <SkillLoadoutPanel state={state} dispatch={dispatch} />
          <SkillFusionWorkbench state={state} dispatch={dispatch} />
        </>
      )}
      {state.page === 'equipment' && <EquipmentWorkbench state={state} dispatch={dispatch} />}
    </main>
  );
}
