import type { BattleUnit } from '@expedition/shared-types';
import type { CSSProperties } from 'react';

import { ROLE_LABEL } from '../presenters';
import type { EnemySensation } from '../presentation/battle-sensation-model';
import { projectUnitSpectacleState } from '../presentation/unit-spectacle-state';
import type { PlaybackImpact } from '../playback/playback-model';

interface BattleUnitCardProps {
  unit: BattleUnit;
  selected: boolean;
  onSelect?: () => void;
  sensation?: EnemySensation | undefined;
  impact?: PlaybackImpact | undefined;
}

export function BattleUnitCard({
  unit,
  selected,
  onSelect,
  sensation,
  impact,
}: BattleUnitCardProps) {
  const hpRatio = Math.max(0, (unit.currentHp / unit.stats.hp) * 100);
  const unitState = projectUnitSpectacleState({
    unit,
    impact,
    executionOpen: Boolean(sensation?.executionLabel),
  });
  const identityStyle = sensation?.identity
    ? ({
        '--enemy-palette': sensation.identity.palette,
        '--enemy-aura': sensation.identity.aura,
      } as CSSProperties)
    : undefined;
  const content = (
    <>
      <header>
        <div>
          <span>{unit.role ? ROLE_LABEL[unit.role] : '敵對軍勢'}</span>
          <h3>{unit.name}</h3>
        </div>
        {selected ? <b>處刑目標</b> : unit.isLeader && <b>隊長</b>}
      </header>
      <div className="gr-unit__numbers">
        <span>
          HP {Math.ceil(unit.currentHp)} / {Math.ceil(unit.stats.hp)}
        </span>
        <span>仇恨 {Math.round(unit.threat)}</span>
      </div>
      <div className="gr-meter gr-meter--hp">
        <span style={{ width: `${hpRatio}%` }} />
      </div>
      {unit.huntTraits?.map((trait) => (
        <div className="gr-unit__trait" key={trait.id}>
          <strong>{trait.name}</strong>
          <span>{trait.description}</span>
        </div>
      ))}
      {unit.side === 'enemies' && (
        <div className="gr-meter gr-meter--gauge">
          <span style={{ width: `${unit.gauge}%` }} />
        </div>
      )}
      {unit.side === 'enemies' && sensation && (
        <div
          className="gr-unit__intent"
          data-execution-window={sensation.executionLabel ? 'true' : undefined}
        >
          <strong>{sensation.pressureLabel}</strong>
          <span>預定攻擊 {sensation.predictedTargetName ?? '遠征隊'}</span>
          {sensation.guardedByNames.length > 0 && (
            <span>護衛連結 {sensation.guardedByNames.join('、')}</span>
          )}
          {sensation.counteredByCurrentBuild && <b>目前 Build 可破</b>}
          {sensation.executionLabel && <b>{sensation.executionLabel}</b>}
        </div>
      )}
      {(unit.side === 'enemies' || unit.guarding || unit.currentHp <= 0) && (
        <footer>
          {unit.side === 'enemies' && (
            <span>
              壓力 {Math.floor(unit.gauge)}% · {sensation?.pressureLabel ?? '蓄勢'}
              {sensation?.executionLabel ? ` · ${sensation.executionLabel}` : ''}
            </span>
          )}
          {unit.guarding && <strong>盾牆防禦</strong>}
          {unit.currentHp <= 0 && <strong>已擊倒</strong>}
        </footer>
      )}
    </>
  );

  return onSelect ? (
    <button
      type="button"
      className={`gr-unit ${selected ? 'is-selected' : ''}`}
      data-unit-state={unitState}
      data-enemy-family={sensation?.identity?.family}
      data-enemy-role={sensation?.identity?.role}
      data-enemy-palette={sensation?.identity?.palette}
      data-enemy-aura={sensation?.identity?.aura}
      data-enemy-defeat={sensation?.identity?.defeat}
      style={identityStyle}
      onClick={onSelect}
      disabled={unit.currentHp <= 0}
      aria-pressed={selected}
    >
      {content}
    </button>
  ) : (
    <article
      className={`gr-unit ${unit.currentHp <= 0 ? 'is-defeated' : ''} ${impact?.targetId === unit.id ? 'is-impact' : ''}`}
      data-impact-kind={impact?.targetId === unit.id ? impact.kind : undefined}
      data-unit-state={unitState}
      data-enemy-family={sensation?.identity?.family}
      data-enemy-role={sensation?.identity?.role}
      data-enemy-palette={sensation?.identity?.palette}
      data-enemy-aura={sensation?.identity?.aura}
      data-enemy-defeat={sensation?.identity?.defeat}
      style={identityStyle}
    >
      {content}
    </article>
  );
}
