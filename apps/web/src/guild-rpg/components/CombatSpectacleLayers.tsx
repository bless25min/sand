import type {
  EnemySpectacleIdentity,
  HuntSpectacleCue,
  SpectacleMotifId,
} from '@expedition/shared-types';
import type { CSSProperties } from 'react';

import type { PlaybackImpact } from '../playback/playback-model';
import { SPECTACLE_CUE_REGISTRY, SPECTACLE_MOTIFS } from '../presentation/spectacle-registry';

interface CombatSpectacleLayersProps {
  impact: PlaybackImpact;
  motif: SpectacleMotifId;
  enemyIdentity?: EnemySpectacleIdentity | undefined;
  huntCue?: HuntSpectacleCue | undefined;
}

export function CombatSpectacleLayers({
  impact,
  motif,
  enemyIdentity,
  huntCue,
}: CombatSpectacleLayersProps) {
  const cue = SPECTACLE_CUE_REGISTRY[impact.kind];
  const buildMotif = SPECTACLE_MOTIFS[motif];
  const trailCount = cue.trail === 'none' ? 0 : Math.min(3, cue.intensity);
  const number =
    impact.amount === undefined || cue.numberTone === 'none'
      ? undefined
      : cue.numberTone === 'heal'
        ? `+${impact.amount}`
        : cue.numberTone === 'overkill'
          ? impact.label
          : `${impact.amount}`;
  const style = {
    '--spectacle-primary': buildMotif.primary,
    '--spectacle-secondary': buildMotif.secondary,
    '--spectacle-shake': `${cue.shakePx}px`,
    '--spectacle-hit-stop': `${cue.hitStopMs}ms`,
    ...(enemyIdentity ? { '--enemy-palette': enemyIdentity.palette } : {}),
  } as CSSProperties;

  return (
    <div
      className="gr-combat-spectacle"
      data-spectacle-cue={cue.id}
      data-intensity={cue.intensity}
      data-backdrop={cue.backdrop}
      data-flash={cue.flash}
      data-trail={cue.trail}
      data-enemy-family={enemyIdentity?.family}
      data-enemy-role={enemyIdentity?.role}
      data-enemy-aura={enemyIdentity?.aura}
      data-enemy-defeat={enemyIdentity?.defeat}
      data-hunt-cue={huntCue?.id}
      data-hunt-palette={huntCue?.palette}
      style={style}
      aria-hidden="true"
    >
      {cue.backdrop !== 'none' && <div className="gr-spectacle__backdrop" />}
      {cue.flash !== 'none' && <div className="gr-spectacle__flash" />}
      <div className="gr-spectacle__trails">
        {Array.from({ length: trailCount }, (_, index) => (
          <span
            className="gr-spectacle__trail"
            style={{ '--trail-index': index } as CSSProperties}
            key={index}
          />
        ))}
      </div>
      {number && (
        <strong className="gr-spectacle__number" data-number-tone={cue.numberTone}>
          {number}
        </strong>
      )}
      <b className="gr-spectacle__label">{impact.label}</b>
    </div>
  );
}
