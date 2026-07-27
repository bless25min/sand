import { GUILD_GAME_CONTENT } from '@expedition/game-data';

import { elementName } from '../content-labels';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';

export function FirstSessionCard({
  state,
  dispatch,
}: {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}) {
  const hunt = GUILD_GAME_CONTENT.hunts[0]!;
  const quest = GUILD_GAME_CONTENT.quests.find(({ id }) => id === hunt.questId)!;
  return (
    <article className="gr-first-session" data-first-session="true">
      <div>
        <span>FIRST MISSION · 約 2 分鐘</span>
        <h3>先打一場，再理解整套 RPG</h3>
        <p>
          不必先讀角色、裝備與技能庫。這場會讓你親手完成六名角色的即時接力，
          勝利後再一步一步建立自己的刷寶組合。
        </p>
        <ol>
          <li>
            <b>1. 鎖定敵人</b>
            <small>點選仍存活的目標</small>
          </li>
          <li>
            <b>2. 選擇技能</b>
            <small>每位角色都有六招</small>
          </li>
          <li>
            <b>3. 完成六棒接力</b>
            <small>每一棒都會立即演出</small>
          </li>
        </ol>
      </div>
      <div className="gr-first-session__mission" data-element={hunt.element}>
        <span>推薦任務</span>
        <strong>{quest.name}</strong>
        <small>{quest.description}</small>
        <p>
          {hunt.skillDropPool?.elements.map(elementName).join(' / ')}技能 ·
          {hunt.guaranteedBossDrops ?? 1} 張技能保證 · {hunt.coreDropIds?.length ?? 0} 種核心
        </p>
        <button
          type="button"
          className="gr-primary-action"
          data-guide-id="hunt:start"
          data-guide-active={state.preferences.tutorial === 'active'}
          onClick={() => dispatch({ type: 'START_QUEST', questId: quest.id })}
        >
          開始第一場教學戰
        </button>
      </div>
    </article>
  );
}
