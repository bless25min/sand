import { GUILD_GAME_CONTENT } from '@expedition/game-data';

import { createFirstHuntCoach, isFirstHuntCoachFocus } from '../onboarding/first-hunt-coach';
import { elementName, specializationName, triggerName } from '../content-labels';
import type { GuildPage, GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { EquipmentWorkbench } from './EquipmentWorkbench';
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
  const hero = GUILD_GAME_CONTENT.adventurers.find(({ id }) => id === state.selectedHeroId);
  const coach = createFirstHuntCoach(
    state.preferences.tutorial,
    state.tutorialStep,
    hero ? { heroName: hero.name } : {},
  );
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

function QuestBoard({
  state,
  dispatch,
}: {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}) {
  return (
    <section className="gr-panel" aria-labelledby="quest-board-title">
      <header className="gr-panel__header">
        <div>
          <p>TARGET FARM · 12 HUNTS</p>
          <h2 id="quest-board-title">任務與公開掉落池</h2>
        </div>
        <span>火 4 關 · 草 4 關 · 水 4 關；依想刷的組合直接選擇</span>
      </header>
      <div className="gr-hunt-grid">
        {GUILD_GAME_CONTENT.hunts.map((hunt, index) => {
          const quest = GUILD_GAME_CONTENT.quests.find(({ id }) => id === hunt.questId)!;
          const unlocked = state.profile.unlockedQuestIds.includes(quest.id);
          const cleared = (state.profile.questRecords[quest.id]?.clears ?? 0) > 0;
          return (
            <article data-element={hunt.element} key={hunt.id}>
              <span>
                HUNT {String(index + 1).padStart(2, '0')} · {hunt.element?.toUpperCase()}
              </span>
              <h3>{quest.name}</h3>
              <p>{quest.description}</p>
              <div className="gr-hunt-summary-tags">
                <span>{hunt.skillDropPool?.elements.map(elementName).join(' / ')}屬性</span>
                <span>{hunt.guaranteedBossDrops ?? 1} 張技能保證</span>
                <span>{hunt.coreDropIds?.length ?? 0} 種專屬核心</span>
              </div>
              <details>
                <summary>查看敵人、規則與完整掉落池</summary>
                <dl>
                  <div>
                    <dt>敵人</dt>
                    <dd>{quest.enemies.map(({ name }) => name).join('、')}</dd>
                  </div>
                  <div>
                    <dt>規則</dt>
                    <dd>{hunt.counterBrief}</dd>
                  </div>
                  <div>
                    <dt>特化</dt>
                    <dd>
                      {hunt.skillDropPool?.specializationIds.map(specializationName).join('、')}
                    </dd>
                  </div>
                  <div>
                    <dt>觸發</dt>
                    <dd>{hunt.skillDropPool?.triggerIds.map(triggerName).join('、')}</dd>
                  </div>
                  <div>
                    <dt>專屬核心</dt>
                    <dd>
                      {hunt.coreDropIds
                        ?.map(
                          (coreId) =>
                            GUILD_GAME_CONTENT.equipmentCores.find(({ id }) => id === coreId)?.name,
                        )
                        .join('、')}
                    </dd>
                  </div>
                </dl>
              </details>
              <button
                type="button"
                className="gr-primary-action"
                data-guide-id={index === 0 ? (cleared ? 'hunt:replay' : 'hunt:start') : undefined}
                data-guide-active={
                  index === 0
                    ? isFirstHuntCoachFocus(
                        state.preferences.tutorial,
                        state.tutorialStep,
                        cleared ? 'hunt:replay' : 'hunt:start',
                      )
                    : undefined
                }
                disabled={!unlocked}
                onClick={() => dispatch({ type: 'START_QUEST', questId: quest.id })}
              >
                {!unlocked ? '尚未解鎖' : cleared ? '再次狩獵' : '開始狩獵'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
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
