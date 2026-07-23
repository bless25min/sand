import type { VisualUnitSource } from '@expedition/pixi-renderer';
import type { FixedOrderAction } from '@expedition/shared-types';
import { useMemo, useRef } from 'react';

import type { BattlefieldHudModel } from '../game-session/create-battlefield-hud';
import { BattlefieldHud } from './BattlefieldHud';
import { BattlefieldOverlay } from './BattlefieldOverlay';
import { createBattlefieldOverlay } from './create-battlefield-overlay';
import { createBattlefieldPoints } from './create-battlefield-points';
import { usePointCloud } from './use-point-cloud';
import './battlefield-feedback.css';

interface BattlefieldDemoProps {
  readonly sources: readonly VisualUnitSource[];
  readonly battleLabel: string;
  readonly selectedUnitId: string;
  readonly action?: FixedOrderAction | undefined;
  readonly hud: BattlefieldHudModel;
}

export function BattlefieldDemo({
  sources,
  battleLabel,
  selectedUnitId,
  action,
  hud,
}: BattlefieldDemoProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const points = useMemo(() => createBattlefieldPoints(sources), [sources]);
  const overlay = useMemo(
    () => createBattlefieldOverlay({ sources, selectedUnitId, action }),
    [action, selectedUnitId, sources],
  );
  const { status: diagnostics, error } = usePointCloud(hostRef, points);

  return (
    <section className="battlefield-panel" aria-labelledby="battlefield-title">
      <div className="battlefield-heading">
        <div>
          <p className="section-kicker">灰牙古道 · 即時戰術投影</p>
          <h2 id="battlefield-title">{battleLabel}</h2>
        </div>
        <span className="live-indicator">
          <span aria-hidden="true" />
          模擬投影中
        </span>
      </div>

      <div className="battlefield-frame">
        <div
          ref={hostRef}
          className="battlefield-canvas"
          role="img"
          aria-label="兩千個 PixiJS 視覺點構成的遠征軍與灰牙狼群戰術沙盤"
          data-testid="battlefield-canvas-host"
          data-point-count={diagnostics?.pointCount ?? 'loading'}
          data-renderer={diagnostics?.rendererType ?? 'loading'}
        />
        <BattlefieldOverlay overlay={overlay} />
        <BattlefieldHud model={hud} />
        <div className="grid-overlay" aria-hidden="true" />
        <div className="map-label map-label--north">灰牙稜線</div>
        <div className="map-label map-label--south">林間道路</div>
        {error === null ? null : (
          <p className="render-error" role="alert">
            WebGL 初始化失敗：{error}
          </p>
        )}
      </div>
    </section>
  );
}
