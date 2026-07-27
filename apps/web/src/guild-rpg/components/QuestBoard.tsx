import { GUILD_GAME_CONTENT } from '@expedition/game-data';

import { elementName, specializationName, triggerName } from '../content-labels';
import { isFirstHuntCoachFocus } from '../onboarding/first-hunt-coach';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { FirstSessionCard } from './FirstSessionCard';

type Hunt = (typeof GUILD_GAME_CONTENT.hunts)[number];

function HuntCard({
  hunt,
  index,
  state,
  dispatch,
}: {
  hunt: Hunt;
  index: number;
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}) {
  const quest = GUILD_GAME_CONTENT.quests.find(({ id }) => id === hunt.questId)!;
  const unlocked = state.profile.unlockedQuestIds.includes(quest.id);
  const cleared = (state.profile.questRecords[quest.id]?.clears ?? 0) > 0;
  const guideId = index === 0 ? (cleared ? 'hunt:replay' : 'hunt:start') : undefined;
  return (
    <article data-element={hunt.element} data-recommended-hunt={index === 0} key={hunt.id}>
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
        <summary>敵人、規則與完整掉落池</summary>
        <dl>
          <div>
            <dt>敵人</dt>
            <dd>{quest.enemies.map(({ name }) => name).join('、')}</dd>
          </div>
          <div>
            <dt>攻略提示</dt>
            <dd>{hunt.counterBrief}</dd>
          </div>
          <div>
            <dt>特化</dt>
            <dd>{hunt.skillDropPool?.specializationIds.map(specializationName).join('、')}</dd>
          </div>
          <div>
            <dt>觸發</dt>
            <dd>{hunt.skillDropPool?.triggerIds.map(triggerName).join('、')}</dd>
          </div>
          <div>
            <dt>核心</dt>
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
        data-guide-id={guideId}
        data-guide-active={
          guideId
            ? isFirstHuntCoachFocus(state.preferences.tutorial, state.tutorialStep, guideId)
            : undefined
        }
        disabled={!unlocked}
        onClick={() => dispatch({ type: 'START_QUEST', questId: quest.id })}
      >
        {!unlocked ? '尚未解鎖' : cleared ? '再次狩獵' : '開始狩獵'}
      </button>
    </article>
  );
}

export function QuestBoard({
  state,
  dispatch,
}: {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}) {
  const firstSession =
    state.preferences.tutorial === 'active' && state.tutorialStep === 'start_hunt';
  const [recommended, ...secondary] = GUILD_GAME_CONTENT.hunts;
  return (
    <section className="gr-panel" aria-labelledby="quest-board-title">
      <header className="gr-panel__header">
        <div>
          <p>TARGET FARM · 12 HUNTS</p>
          <h2 id="quest-board-title">選任務，刷想要的組合</h2>
        </div>
        <span>先完成推薦狩獵；之後再依屬性、特化、觸發與核心選擇目標。</span>
      </header>
      {firstSession ? (
        <FirstSessionCard state={state} dispatch={dispatch} />
      ) : (
        <div className="gr-recommended-hunt">
          <HuntCard hunt={recommended!} index={0} state={state} dispatch={dispatch} />
        </div>
      )}
      <details className="gr-secondary-hunts" data-secondary-hunts="true">
        <summary>展開其餘 11 個狩獵與掉落池</summary>
        <div className="gr-hunt-grid">
          {secondary.map((hunt, index) => (
            <HuntCard
              hunt={hunt}
              index={index + 1}
              state={state}
              dispatch={dispatch}
              key={hunt.id}
            />
          ))}
        </div>
      </details>
    </section>
  );
}
