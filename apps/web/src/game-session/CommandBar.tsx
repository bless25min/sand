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
  return (
    <div className="command-bar" aria-label="固定軍令">
      <button type="button" onClick={() => onOrder('ADVANCE')}>
        推進
      </button>
      <button type="button" onClick={() => onOrder('HOLD')}>
        固守
      </button>
      <button type="button" className="command-primary" onClick={() => onOrder('ATTACK')}>
        攻擊
      </button>
      <button
        type="button"
        onClick={() => onOrder('CHANGE_FORMATION', nextFormation(unit.formation))}
      >
        變換陣形
      </button>
      <button type="button" className="command-danger" onClick={() => onOrder('RETREAT')}>
        撤退
      </button>
    </div>
  );
}
