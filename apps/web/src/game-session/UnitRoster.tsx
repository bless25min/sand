import type { UnitState } from '@expedition/shared-types';

import { formationLabel, roleLabel } from './tactical-labels';

interface UnitRosterProps {
  readonly units: readonly UnitState[];
  readonly selectedUnitId: string;
  readonly onSelect: (unitId: string) => void;
}

export function UnitRoster({ units, selectedUnitId, onSelect }: UnitRosterProps) {
  return (
    <div className="unit-roster" aria-label="遠征軍部隊">
      {units.map((unit) => (
        <button
          type="button"
          className="unit-select"
          data-testid="unit-select"
          aria-pressed={unit.id === selectedUnitId}
          key={unit.id}
          onClick={() => onSelect(unit.id)}
        >
          <span className="unit-select__heading">
            <strong>{unit.name}</strong>
            <b>{roleLabel(unit.unitType)}</b>
          </span>
          <span className="unit-select__strength">
            <strong>{unit.troopCount.toLocaleString()}</strong>
            <small> / {unit.initialTroopCount.toLocaleString()}</small>
          </span>
          <small>
            {formationLabel(unit.formation)} · 士氣 {Math.round(unit.morale * 100)}%
          </small>
          {unit.appearanceIds.includes('HORNPLATE_SHIELD') ? (
            <small className="unit-equipment">角甲重盾</small>
          ) : null}
        </button>
      ))}
    </div>
  );
}
