import { GUILD_GAME_CONTENT } from '@expedition/game-data';

import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { EquipmentCard } from './EquipmentCard';
import { HuntResultSummary } from './HuntResultSummary';
import { LootRain } from './LootRain';
import { RewardThumbControls } from './RewardThumbControls';

interface RewardScreenProps {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}

export function RewardScreen({ state, dispatch }: RewardScreenProps) {
  const rewards = state.rewards!;
  const successful = rewards.successful !== false;
  const allResolved = state.resolvedItemIds.length === rewards.items.length;
  const nextQuest = successful
    ? GUILD_GAME_CONTENT.quests.find(
        (quest) =>
          state.profile.unlockedQuestIds.includes(quest.id) &&
          !state.profile.questRecords[quest.id],
      )
    : undefined;

  return (
    <main className="gr-rewards">
      <header className="gr-rewards__hero">
        <p>{successful ? 'QUEST COMPLETE' : 'HUNT RECOVERY'}</p>
        <h1>{successful ? '遠征勝利' : '撤退結算'}</h1>
        <span>{state.message}</span>
        <div>
          <strong>+{rewards.experience} EXP</strong>
          <strong>+{rewards.gold} GOLD</strong>
          <strong>{(rewards.clearMs / 1_000).toFixed(1)} SEC</strong>
        </div>
      </header>

      <HuntResultSummary rewards={rewards} />
      <LootRain rewards={rewards} />

      <section className="gr-reward-party" aria-label="隊伍成長">
        {state.profile.party.map((member) => {
          const definition = GUILD_GAME_CONTENT.adventurers.find(
            (candidate) => candidate.id === member.definitionId,
          )!;
          return (
            <div key={member.definitionId}>
              <span>{definition.name}</span>
              <strong>Lv.{member.level}</strong>
              <small>
                {member.experience}/{member.level * 80} EXP
              </small>
            </div>
          );
        })}
      </section>

      <section className="gr-reward-loot" aria-labelledby="loot-title">
        <div className="gr-section__heading">
          <div>
            <p>LOOT DECISION</p>
            <h2 id="loot-title">{rewards.items.length ? '選擇戰利品去向' : '本次沒有裝備掉落'}</h2>
          </div>
          <span>
            {rewards.items.length ? '每件都必須裝備、保留或出售' : '材料已直接存入公會倉庫'}
          </span>
        </div>
        <div className="gr-reward-grid">
          {rewards.items.map((item) => (
            <EquipmentCard item={item} state={state} dispatch={dispatch} key={item.id} />
          ))}
        </div>
        <RewardThumbControls state={state} dispatch={dispatch} />
      </section>

      <footer className="gr-rewards__footer">
        <div>
          <span>{state.message}</span>
          {nextQuest && <strong>新委託已解鎖：{nextQuest.name}</strong>}
        </div>
        <button
          type="button"
          className="gr-button gr-button--primary"
          disabled={!allResolved}
          title={allResolved ? undefined : '先決定所有戰利品的去向'}
          onClick={() => dispatch({ type: 'RETURN_GUILD' })}
        >
          {allResolved
            ? '返回公會，繼續遠征'
            : `尚有 ${rewards.items.length - state.resolvedItemIds.length} 件待處理`}
        </button>
      </footer>
    </main>
  );
}
