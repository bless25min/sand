import type { BattleUnit, SpectacleMotifId } from '@expedition/shared-types';

interface TacticalImpact {
  kind: string;
  targetId?: string | undefined;
}

interface BattlefieldTacticalLayerProps {
  units: readonly BattleUnit[];
  selectedTargetId?: string | undefined;
  impact?: TacticalImpact | undefined;
  motif: SpectacleMotifId;
  mode: 'command' | 'playback';
}

const SOLDIER_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
const ROUTE_BY_MOTIF: Readonly<Record<SpectacleMotifId, string>> = {
  ember: 'retaliation',
  storm: 'ricochet',
  radiance: 'status-storm',
  command: 'execution',
};

export function BattlefieldTacticalLayer({
  units,
  selectedTargetId,
  impact,
  motif,
  mode,
}: BattlefieldTacticalLayerProps) {
  const sideSlots = { heroes: 0, enemies: 0 };

  return (
    <div
      className="gr-tactical-battlefield"
      data-mode={mode}
      data-motif={motif}
      data-tactical-route={ROUTE_BY_MOTIF[motif]}
      aria-hidden="true"
    >
      <svg
        className="gr-tactical-battlefield__routes"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path className="gr-tactical-route gr-tactical-route--main" d="M 22 73 Q 50 45 78 28" />
        <path className="gr-tactical-route gr-tactical-route--branch" d="M 50 46 Q 65 62 82 69" />
        <path className="gr-tactical-route gr-tactical-route--branch" d="M 50 46 Q 61 28 77 14" />
      </svg>
      {units.slice(0, 6).map((unit) => {
        const slot = sideSlots[unit.side]++;
        const impacted = unit.id === impact?.targetId;
        return (
          <div
            className={`gr-tactical-formation gr-tactical-formation--${unit.side}`}
            data-tactical-formation={unit.side}
            data-side={unit.side}
            data-slot={slot}
            data-selected={unit.id === selectedTargetId}
            data-unit-id={unit.id}
            data-impacted={impacted}
            data-impact-kind={impacted ? impact?.kind : undefined}
            data-defeated={unit.currentHp <= 0}
            key={unit.id}
          >
            <span className="gr-tactical-formation__core" />
            <span className="gr-tactical-formation__reticle" />
            <span className="gr-tactical-formation__soldiers">
              {SOLDIER_INDICES.map((soldierIndex) => (
                <i
                  data-tactical-soldier={soldierIndex}
                  data-rank={Math.floor(soldierIndex / 3)}
                  key={soldierIndex}
                />
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}
