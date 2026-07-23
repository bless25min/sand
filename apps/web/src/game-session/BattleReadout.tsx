import type { PlayableSessionState } from './playable-session-types';

const EVENT_LABELS: Readonly<Record<string, string>> = {
  BATTLE_STARTED: '戰鬥開始',
  ORDER_ISSUED: '軍令下達',
  UNIT_MOVED: '戰線移動',
  FORMATION_CHANGED: '陣形變更',
  CASUALTIES_APPLIED: '接敵傷亡',
  BATTLE_ENDED: '戰鬥結束',
};

export function BattleReadout({ state }: { readonly state: PlayableSessionState }) {
  const monster = state.battle.monsterGroup;
  const recentEvents = state.battle.events.slice(-6).reverse();

  return (
    <div className="battle-readout" aria-live="polite">
      <dl>
        <div>
          <dt>戰鬥</dt>
          <dd>第 {state.battleNumber} 戰</dd>
        </div>
        <div>
          <dt>Tick</dt>
          <dd>{state.battle.tick}</dd>
        </div>
        <div>
          <dt>狼群兵力</dt>
          <dd>
            {monster.troopCount}/{monster.initialTroopCount}
          </dd>
        </div>
        <div>
          <dt>狼群士氣</dt>
          <dd>{Math.round(monster.morale * 100)}%</dd>
        </div>
      </dl>
      <ol aria-label="最近戰鬥事件">
        {recentEvents.map((event) => (
          <li key={event.id}>
            <span>T{event.tick}</span>
            {EVENT_LABELS[event.type] ?? event.type}
          </li>
        ))}
      </ol>
    </div>
  );
}
