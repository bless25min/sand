import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { useState } from 'react';

import { elementName, specializationName, triggerName } from '../content-labels';
import { isFirstHuntCoachFocus } from '../onboarding/first-hunt-coach';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { FirstSessionCard } from './FirstSessionCard';

type Hunt = (typeof GUILD_GAME_CONTENT.hunts)[number];

function HuntCard({
  hunt,
  state,
  dispatch,
  campaignComplete,
  ascensionId,
  onSelectAscension,
}: {
  hunt: Hunt;
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
  campaignComplete: boolean;
  ascensionId: string | undefined;
  onSelectAscension: (ascensionId?: string) => void;
}) {
  const quest = GUILD_GAME_CONTENT.quests.find(({ id }) => id === hunt.questId)!;
  const unlocked = state.profile.unlockedQuestIds.includes(quest.id);
  const record = state.profile.questRecords[quest.id];
  const cleared = (record?.clears ?? 0) > 0;
  const guideId =
    quest.id === GUILD_GAME_CONTENT.quests[0]?.id
      ? cleared
        ? 'hunt:replay'
        : 'hunt:start'
      : undefined;
  const boss = quest.enemies.find(({ id }) => id === hunt.bossEnemyId);
  const challenges = GUILD_GAME_CONTENT.challenges.filter(
    (challenge) => challenge.questId === quest.id,
  );
  const completedChallenges = challenges.filter((challenge) =>
    state.profile.completedChallengeIds.includes(challenge.id),
  );
  const selectedAscension = GUILD_GAME_CONTENT.ascensions.find(({ id }) => id === ascensionId);
  return (
    <article
      className="gr-hunt-card"
      data-element={hunt.element}
      data-hunt-card={quest.id}
      data-locked={!unlocked}
    >
      <header>
        <span>{cleared ? `已完成 ${record?.clears ?? 0} 次` : unlocked ? '新任務' : '未解鎖'}</span>
        <strong>{quest.name}</strong>
        <small>{boss ? `首領 · ${boss.name}` : `${quest.enemies.length} 名敵人`}</small>
      </header>
      <p>{quest.description}</p>
      <div className="gr-hunt-summary-tags">
        <span>{hunt.skillDropPool?.elements.map(elementName).join(' / ')}技能</span>
        <span>保證 {hunt.guaranteedBossDrops ?? 1} 張</span>
        <span>{hunt.coreDropIds?.length ?? 0} 核心</span>
      </div>
      <details className="gr-hunt-mastery" data-hunt-mastery={quest.id}>
        <summary>
          <strong>
            挑戰 {completedChallenges.length}/{challenges.length}
          </strong>
          <span>
            OVERKILL {record?.bestOverkill ?? 0} · 最長連鎖 {record?.bestChain ?? 0}
          </span>
        </summary>
        <ul>
          {challenges.map((challenge) => (
            <li
              data-challenge-complete={state.profile.completedChallengeIds.includes(challenge.id)}
              key={challenge.id}
            >
              <b>{state.profile.completedChallengeIds.includes(challenge.id) ? '✓' : '○'}</b>
              <span>
                <strong>{challenge.name.split(' · ').at(-1)}</strong>
                <small>{challenge.description}</small>
              </span>
            </li>
          ))}
        </ul>
      </details>
      {campaignComplete && (
        <section className="gr-ascension-picker" data-ascension-picker="true">
          <header>
            <strong>昇華再戰</strong>
            <span>{selectedAscension?.routeLabel ?? '原始難度與掉落'}</span>
          </header>
          <div>
            <button
              type="button"
              data-ascension-mode="standard"
              aria-pressed={!ascensionId}
              onClick={() => onSelectAscension(undefined)}
            >
              標準
            </button>
            {GUILD_GAME_CONTENT.ascensions.map((ascension) => (
              <button
                type="button"
                data-ascension-mode={ascension.id}
                aria-pressed={ascension.id === ascensionId}
                title={ascension.description}
                key={ascension.id}
                onClick={() => onSelectAscension(ascension.id)}
              >
                {ascension.name}
              </button>
            ))}
          </div>
        </section>
      )}
      <details>
        <summary>看敵人、攻略與掉落池</summary>
        <dl>
          <div>
            <dt>敵人</dt>
            <dd>{quest.enemies.map(({ name }) => name).join('、')}</dd>
          </div>
          <div>
            <dt>這關重點</dt>
            <dd>{hunt.counterBrief}</dd>
          </div>
          <div>
            <dt>技能特化</dt>
            <dd>{hunt.skillDropPool?.specializationIds.map(specializationName).join('、')}</dd>
          </div>
          <div>
            <dt>觸發條件</dt>
            <dd>{hunt.skillDropPool?.triggerIds.map(triggerName).join('、')}</dd>
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
        onClick={() =>
          dispatch({
            type: 'START_QUEST',
            questId: quest.id,
            ...(ascensionId ? { ascensionId } : {}),
          })
        }
      >
        {!unlocked
          ? '完成前一區解鎖'
          : selectedAscension
            ? `挑戰 ${selectedAscension.name}`
            : cleared
              ? '再次狩獵'
              : '開始狩獵'}
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
  const defaultZone =
    GUILD_GAME_CONTENT.zones.find(({ questIds }) =>
      questIds.some((id) => state.profile.unlockedQuestIds.includes(id)),
    ) ?? GUILD_GAME_CONTENT.zones[0]!;
  const [selectedZoneId, setSelectedZoneId] = useState(defaultZone.id);
  const [huntIndex, setHuntIndex] = useState(0);
  const [ascensionId, setAscensionId] = useState<string>();
  const selectedZone =
    GUILD_GAME_CONTENT.zones.find(({ id }) => id === selectedZoneId) ??
    GUILD_GAME_CONTENT.zones[0]!;
  const hunts = selectedZone.questIds
    .map((questId) => GUILD_GAME_CONTENT.hunts.find((hunt) => hunt.questId === questId))
    .filter((hunt): hunt is Hunt => Boolean(hunt));
  const completedInZone = selectedZone.questIds.filter(
    (questId) => (state.profile.questRecords[questId]?.clears ?? 0) > 0,
  ).length;
  const safeHuntIndex = Math.min(huntIndex, Math.max(0, hunts.length - 1));
  const campaignComplete = GUILD_GAME_CONTENT.quests.every(
    ({ id }) => (state.profile.questRecords[id]?.clears ?? 0) > 0,
  );

  return (
    <section className="gr-panel gr-quest-board" aria-labelledby="quest-board-title">
      <header className="gr-panel__header">
        <div>
          <p>TARGET FARM · 4 ZONES · 12 HUNTS</p>
          <h2 id="quest-board-title">選區域，再選想刷的掉落</h2>
        </div>
        <span>每區三關；任務卡會直接標示技能屬性、保證掉落與專屬核心。</span>
      </header>

      {firstSession && <FirstSessionCard state={state} dispatch={dispatch} />}

      <div className="gr-zone-browser" data-secondary-hunts="true" aria-label="四個遠征區域">
        <nav className="gr-zone-tabs">
          {GUILD_GAME_CONTENT.zones.map((zone, index) => {
            const zoneUnlocked = zone.questIds.some((id) =>
              state.profile.unlockedQuestIds.includes(id),
            );
            const cleared = zone.questIds.filter(
              (id) => (state.profile.questRecords[id]?.clears ?? 0) > 0,
            ).length;
            return (
              <button
                type="button"
                data-zone-tab={zone.id}
                aria-current={zone.id === selectedZone.id ? 'page' : undefined}
                key={zone.id}
                onClick={() => {
                  setSelectedZoneId(zone.id);
                  setHuntIndex(0);
                }}
              >
                <span>區域 {index + 1}</span>
                <strong>{zone.name}</strong>
                <small>{zoneUnlocked ? `${cleared}/3 完成` : '尚未解鎖'}</small>
              </button>
            );
          })}
        </nav>

        {!firstSession && (
          <section
            className="gr-zone-missions"
            data-zone-missions={selectedZone.id}
            aria-label={`${selectedZone.name}任務`}
          >
            <header>
              <div>
                <span>{selectedZone.subtitle}</span>
                <h3>{selectedZone.name}</h3>
                <p>{selectedZone.description}</p>
              </div>
              <strong>本區 3 個任務 · {completedInZone}/3 完成</strong>
            </header>
            <div className="gr-hunt-grid">
              {hunts[safeHuntIndex] && (
                <HuntCard
                  hunt={hunts[safeHuntIndex]}
                  state={state}
                  dispatch={dispatch}
                  campaignComplete={campaignComplete}
                  ascensionId={ascensionId}
                  onSelectAscension={setAscensionId}
                  key={hunts[safeHuntIndex].id}
                />
              )}
            </div>
            <nav className="gr-collection-pager" data-pager="hunts" aria-label="切換區域任務">
              <button
                type="button"
                disabled={safeHuntIndex === 0}
                onClick={() => setHuntIndex((value) => Math.max(0, value - 1))}
              >
                ←
              </button>
              <span>
                {safeHuntIndex + 1} / {hunts.length}
              </span>
              <button
                type="button"
                disabled={safeHuntIndex >= hunts.length - 1}
                onClick={() => setHuntIndex((value) => Math.min(hunts.length - 1, value + 1))}
              >
                →
              </button>
            </nav>
          </section>
        )}
      </div>
    </section>
  );
}
