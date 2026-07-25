import type { BattleUnit } from '@expedition/shared-types';

import { ROLE_LABEL } from '../presenters';

interface BattleUnitCardProps {
  unit: BattleUnit;
  selected: boolean;
  onSelect?: () => void;
}

export function BattleUnitCard({ unit, selected, onSelect }: BattleUnitCardProps) {
  const hpRatio = Math.max(0, (unit.currentHp / unit.stats.hp) * 100);
  const content = (
    <>
      <header>
        <div>
          <span>{unit.role ? ROLE_LABEL[unit.role] : '敵對軍勢'}</span>
          <h3>{unit.name}</h3>
        </div>
        {unit.isLeader && <b>隊長</b>}
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
      {(unit.side === 'enemies' || unit.guarding || unit.currentHp <= 0) && (
        <footer>
          {unit.side === 'enemies' && <span>壓力 {Math.floor(unit.gauge)}%</span>}
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
      onClick={onSelect}
      disabled={unit.currentHp <= 0}
      aria-pressed={selected}
    >
      {content}
    </button>
  ) : (
    <article className={`gr-unit ${unit.currentHp <= 0 ? 'is-defeated' : ''}`}>{content}</article>
  );
}
