import { GUILD_GAME_CONTENT } from '@expedition/game-data';

import { formatTime } from '../presenters';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { BuildWorkbench } from '../dev/BuildWorkbench';
import { AdventurerCard } from './AdventurerCard';
import { GuildMobileStage } from './GuildMobileStage';
import { Inventory } from './Inventory';

interface GuildScreenProps {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}

export function GuildScreen({ state, dispatch }: GuildScreenProps) {
  const materialCount = Object.values(state.profile.materials).reduce(
    (total, quantity) => total + quantity,
    0,
  );
  return (
    <main className="gr-shell">
      <header className="gr-topbar">
        <a className="gr-brand" href="/" aria-label="遠征者公會首頁">
          <span>EXPEDITION GUILD</span>
          <strong>遠征者公會</strong>
        </a>
        <div className="gr-resources">
          <span>金幣</span>
          <strong>{state.profile.gold}</strong>
          <span>背包</span>
          <strong>{state.profile.inventory.length}/20</strong>
          <span>材料</span>
          <strong>{materialCount}</strong>
        </div>
      </header>

      <section className="gr-hero" aria-labelledby="guild-title">
        <div>
          <p className="gr-eyebrow">PREPARE · QUEST · LOOT · REPEAT</p>
          <h1 id="guild-title">三人小隊，一次更好的遠征。</h1>
          <p>
            切換軍令引擎，讓三名冒險者的卡牌與裝備規則連成同一條因果鏈。
            反覆攻略、換裝重組，讓下一次釋放更快進入 Overkill。
          </p>
        </div>
        <aside>
          <span>公會戰報</span>
          <strong>{state.message}</strong>
        </aside>
      </section>

      <GuildMobileStage state={state} dispatch={dispatch} />

      <div className="gr-guild-desktop">
        <BuildWorkbench state={state} dispatch={dispatch} />
        <section className="gr-section" aria-labelledby="party-title">
          <div className="gr-section__heading">
            <div>
              <p>ACTIVE PARTY</p>
              <h2 id="party-title">遠征隊伍</h2>
            </div>
            <span>裝備可加入新的規則節點；隊長仍代表隊伍視角</span>
          </div>
          <div className="gr-party-grid">
            {state.profile.party.map((member) => {
              const definition = GUILD_GAME_CONTENT.adventurers.find(
                (candidate) => candidate.id === member.definitionId,
              )!;
              return (
                <AdventurerCard
                  key={member.definitionId}
                  adventurer={member}
                  definition={definition}
                  isLeader={state.profile.leaderId === member.definitionId}
                  onSetLeader={() =>
                    dispatch({ type: 'SET_LEADER', adventurerId: member.definitionId })
                  }
                />
              );
            })}
          </div>
        </section>

        <section className="gr-section" aria-labelledby="quest-title">
          <div className="gr-section__heading">
            <div>
              <p>QUEST BOARD</p>
              <h2 id="quest-title">遠征委託</h2>
            </div>
            <span>首勝解鎖下一關；重刷追求裝備與最佳時間</span>
          </div>
          <div className="gr-quest-grid">
            {GUILD_GAME_CONTENT.quests.map((quest, index) => {
              const unlocked = state.profile.unlockedQuestIds.includes(quest.id);
              const record = state.profile.questRecords[quest.id];
              return (
                <article
                  className={`gr-card gr-quest ${unlocked ? '' : 'is-locked'}`}
                  key={quest.id}
                >
                  <span className="gr-quest__index">0{index + 1}</span>
                  <p>{unlocked ? `建議 Lv.${quest.recommendedLevel}` : '尚未解鎖'}</p>
                  <h3>{quest.name}</h3>
                  <p>{quest.description}</p>
                  <dl>
                    <div>
                      <dt>敵軍</dt>
                      <dd>{quest.enemies.length} 隊</dd>
                    </div>
                    <div>
                      <dt>獎勵</dt>
                      <dd>{quest.rewardGold} G</dd>
                    </div>
                    <div>
                      <dt>通關</dt>
                      <dd>{record?.clears ?? 0}</dd>
                    </div>
                    <div>
                      <dt>最佳</dt>
                      <dd>{formatTime(record?.bestClearMs)}</dd>
                    </div>
                    <div>
                      <dt>最高溢傷</dt>
                      <dd>{record?.bestOverkill ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>掉落效率</dt>
                      <dd>
                        {record?.bestLootMultiplier
                          ? `×${record.bestLootMultiplier.toFixed(2)}`
                          : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt>最高品質</dt>
                      <dd>{record?.bestItemQuality ?? '—'}</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    className="gr-button gr-button--primary"
                    disabled={!unlocked}
                    title={unlocked ? undefined : '先完成上一個遠征委託'}
                    onClick={() => dispatch({ type: 'START_QUEST', questId: quest.id })}
                  >
                    {unlocked ? '開始遠征' : '需要前置勝利'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <Inventory state={state} dispatch={dispatch} />
      </div>
    </main>
  );
}
