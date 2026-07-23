import type { FixedOrderAction, FormationType, UnitState } from '@expedition/shared-types';

interface CommandBarProps {
  readonly unit: UnitState;
  readonly onOrder: (action: FixedOrderAction, formation?: FormationType) => void;
}

const FORMATIONS: readonly FormationType[] = ['DENSE_BLOCK', 'LINE', 'WEDGE', 'LOOSE'];

function nextFormation(current: FormationType): FormationType {
  const index = FORMATIONS.indexOf(current);
  return FORMATIONS[(index + 1) % FORMATIONS.length] ?? 'DENSE_BLOCK';
}

export function CommandBar({ unit, onOrder }: CommandBarProps) {
  const attackHint =
    unit.unitType === 'ARCHER'
      ? '射程內齊射'
      : unit.unitType === 'CAVALRY'
        ? '楔形衝鋒'
        : unit.unitType === 'HERO_TEAM'
          ? '英雄突襲'
          : '壓住戰線';

  return (
    <div className="command-bar" role="group" aria-label="固定軍令">
      <button type="button" aria-label="推進" onClick={() => onOrder('ADVANCE')}>
        <strong>推進</strong>
        <small>逼近敵軍</small>
      </button>
      <button type="button" aria-label="固守" onClick={() => onOrder('HOLD')}>
        <strong>固守</strong>
        <small>誘敵靠近</small>
      </button>
      <button
        type="button"
        aria-label="攻擊"
        className="command-primary"
        onClick={() => onOrder('ATTACK')}
      >
        <strong>攻擊</strong>
        <small>{attackHint}</small>
      </button>
      <button
        type="button"
        aria-label="變換陣形"
        onClick={() => onOrder('CHANGE_FORMATION', nextFormation(unit.formation))}
      >
        <strong>變換陣形</strong>
        <small>{nextFormation(unit.formation)}</small>
      </button>
      <button
        type="button"
        aria-label="撤退"
        className="command-danger"
        onClick={() => onOrder('RETREAT')}
      >
        <strong>撤退</strong>
        <small>保存兵力</small>
      </button>
    </div>
  );
}
