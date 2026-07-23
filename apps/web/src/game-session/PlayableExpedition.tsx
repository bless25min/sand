import { useMemo, useReducer } from 'react';

import { BattlefieldDemo } from '../battlefield/BattlefieldDemo';
import { BattleReadout } from './BattleReadout';
import { CommandBar } from './CommandBar';
import { createBattlefieldSources } from './create-battlefield-sources';
import { createPlayableSession } from './create-playable-session';
import { ProgressionActions } from './ProgressionActions';
import { reducePlayableSession } from './reduce-playable-session';
import { UnitRoster } from './UnitRoster';
import './game-session.css';

export function PlayableExpedition() {
  const [state, dispatch] = useReducer(reducePlayableSession, undefined, () =>
    createPlayableSession(),
  );
  const sources = useMemo(() => createBattlefieldSources(state.battle), [state.battle]);
  const selectedUnit =
    state.battle.units.find((unit) => unit.id === state.selectedUnitId) ?? state.battle.units[0];
  if (selectedUnit === undefined) {
    throw new Error('playable expedition requires at least one player unit');
  }

  return (
    <section className="playable-expedition" data-testid="playable-expedition">
      <header className="playable-heading">
        <div>
          <p className="section-kicker">PLAYABLE PHASE 04R</p>
          <h2>可玩遠征 · 灰牙森林</h2>
          <p>戰鬥 → 掉落 → 製造 → 裝備 → 再戰</p>
        </div>
        <button
          type="button"
          className="reset-session"
          onClick={() => dispatch({ type: 'RESET_SESSION' })}
        >
          重設相同 Seed
        </button>
      </header>

      <BattlefieldDemo
        sources={sources}
        battleLabel={`灰牙森林 · 林間道路 · 第 ${state.battleNumber} 戰`}
      />

      <div className="playable-console">
        <section>
          <h3>選擇部隊</h3>
          <UnitRoster
            units={state.battle.units}
            selectedUnitId={state.selectedUnitId}
            onSelect={(unitId) => dispatch({ type: 'SELECT_UNIT', unitId })}
          />
        </section>

        <section>
          <h3>固定軍令</h3>
          {state.phase === 'BATTLE' ? (
            <CommandBar
              unit={selectedUnit}
              onOrder={(action, formation) => {
                if (action === 'CHANGE_FORMATION') {
                  if (formation === undefined) {
                    throw new Error('formation command requires a formation');
                  }
                  dispatch({ type: 'ISSUE_ORDER', action, formation });
                  return;
                }
                dispatch({ type: 'ISSUE_ORDER', action });
              }}
            />
          ) : (
            <p className="phase-complete">戰鬥階段已結束，請完成下一步。</p>
          )}
          <BattleReadout state={state} />
        </section>

        <ProgressionActions state={state} dispatch={dispatch} />
      </div>
    </section>
  );
}
