import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { GuildCodexCategory } from '@expedition/shared-types';
import { useState } from 'react';

import { formatTime } from '../presenters';
import {
  CODEX_CATEGORY_LABEL,
  createArchiveModel,
  isCodexEntryComplete,
} from '../presentation/archive-model';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';

interface ArchiveCommandCenterProps {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
  onClose?: () => void;
}

export function ArchiveCommandCenter({ state, dispatch, onClose }: ArchiveCommandCenterProps) {
  const model = createArchiveModel(state.profile, GUILD_GAME_CONTENT);
  const [questId, setQuestId] = useState(
    state.profile.unlockedQuestIds.at(-1) ?? GUILD_GAME_CONTENT.quests[0]!.id,
  );
  const [codexCategory, setCodexCategory] = useState<GuildCodexCategory>('enemy');
  const hunt = GUILD_GAME_CONTENT.hunts.find((candidate) => candidate.questId === questId)!;
  const challenges = GUILD_GAME_CONTENT.challenges.filter((entry) => entry.huntId === hunt.id);
  const codexEntries = GUILD_GAME_CONTENT.codexEntries.filter(
    (entry) => entry.category === codexCategory,
  );

  return (
    <section className="gr-longterm-panel gr-archive" aria-labelledby="archive-title">
      <header>
        <div>
          <p>
            ARCHIVE · COLLECTION {model.complete}/{model.total}
          </p>
          <h3 id="archive-title">遠征檔案館</h3>
        </div>
        <span>紀錄、挑戰、收藏與 Ascended 重刷都從同一個指揮中心繼續。</span>
      </header>
      <div className="gr-record-grid">
        <div>
          <span>最快殲滅</span>
          <strong>{formatTime(model.records.fastestClearMs)}</strong>
        </div>
        <div>
          <span>最高 Overkill</span>
          <strong>{model.records.bestOverkill}</strong>
        </div>
        <div>
          <span>最佳連鎖</span>
          <strong>{model.records.bestChain} 張</strong>
        </div>
        <div>
          <span>最高品質</span>
          <strong>{model.records.bestItemQuality}</strong>
        </div>
        <div>
          <span>挑戰</span>
          <strong>
            挑戰 {state.profile.completedChallengeIds.length}/{GUILD_GAME_CONTENT.challenges.length}
          </strong>
        </div>
        <div>
          <span>Ascended 制霸</span>
          <strong>{model.records.ascendedClears}</strong>
        </div>
      </div>
      <div className="gr-codex-grid">
        {model.categories.map((category) => (
          <div key={category.category}>
            <span>{category.label}</span>
            <strong>
              {category.complete}/{category.total}
            </strong>
            <i>
              <span style={{ width: `${(category.complete / category.total) * 100}%` }} />
            </i>
          </div>
        ))}
      </div>
      <div className="gr-codex-browser">
        <label>
          圖鑑條目
          <select
            value={codexCategory}
            onChange={(event) => setCodexCategory(event.target.value as GuildCodexCategory)}
          >
            {model.categories.map((category) => (
              <option value={category.category} key={category.category}>
                {CODEX_CATEGORY_LABEL[category.category]} {category.complete}/{category.total}
              </option>
            ))}
          </select>
        </label>
        <div>
          {codexEntries.map((entry) => {
            const complete = isCodexEntryComplete(entry, state.profile, GUILD_GAME_CONTENT);
            return (
              <article data-complete={complete} key={entry.id}>
                <span>{complete ? '已收錄' : '待征服'}</span>
                <strong>{entry.name}</strong>
                <small>{entry.description}</small>
              </article>
            );
          })}
        </div>
      </div>
      <div className="gr-archive__mission">
        <label>
          重刷戰場
          <select value={questId} onChange={(event) => setQuestId(event.target.value)}>
            {GUILD_GAME_CONTENT.quests.map((quest) => (
              <option value={quest.id} key={quest.id}>
                {quest.name}
              </option>
            ))}
          </select>
        </label>
        <div className="gr-challenge-list">
          {challenges.map((challenge) => (
            <div
              data-complete={state.profile.completedChallengeIds.includes(challenge.id)}
              key={challenge.id}
            >
              <b>{challenge.rewardLabel}</b>
              <span>{challenge.description}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="gr-ascension-grid">
        {GUILD_GAME_CONTENT.ascensions.map((ascension) => (
          <article data-motif={ascension.motif} key={ascension.id}>
            <p>ASCENDED · {ascension.routeLabel}</p>
            <h4>{ascension.name}</h4>
            <span>{ascension.description}</span>
            <button
              type="button"
              disabled={!model.campaignComplete}
              onClick={() => dispatch({ type: 'START_QUEST', questId, ascensionId: ascension.id })}
            >
              {model.campaignComplete ? 'ASCENDED 遠征' : '全戰役通關後解鎖'}
            </button>
          </article>
        ))}
      </div>
      {onClose && (
        <footer>
          <button type="button" onClick={onClose}>
            關閉檔案館
          </button>
        </footer>
      )}
    </section>
  );
}
