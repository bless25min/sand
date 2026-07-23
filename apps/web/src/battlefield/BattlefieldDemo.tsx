import type { VisualUnitSource } from '@expedition/pixi-renderer';
import type { FixedOrderAction } from '@expedition/shared-types';
import { useMemo, useRef } from 'react';

import { BattlefieldOverlay } from './BattlefieldOverlay';
import { createBattlefieldOverlay } from './create-battlefield-overlay';
import { createBattlefieldPoints } from './create-battlefield-points';
import { usePointCloud } from './use-point-cloud';
import './battlefield-feedback.css';

interface BattlefieldDemoProps {
  readonly sources: readonly VisualUnitSource[];
  readonly battleLabel: string;
  readonly selectedUnitId: string;
  readonly action?: FixedOrderAction;
}

export function BattlefieldDemo({
  sources,
  battleLabel,
  selectedUnitId,
  action,
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
          <p className="section-kicker">LIVE TACTICAL PROJECTION</p>
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
        />
        <BattlefieldOverlay overlay={overlay} />
        <div className="grid-overlay" aria-hidden="true" />
        <div className="map-label map-label--north">灰牙稜線</div>
        <div className="map-label map-label--south">林間道路</div>
        {error === null ? null : (
          <p className="render-error" role="alert">
            WebGL 初始化失敗：{error}
          </p>
        )}
      </div>

      <div className="diagnostic-grid" aria-label="視覺投影診斷">
        <div>
          <span>視覺點</span>
          <strong>{diagnostics?.pointCount.toLocaleString() ?? '—'}</strong>
        </div>
        <div>
          <span>Renderer</span>
          <strong>{diagnostics?.rendererType ?? '初始化中'}</strong>
        </div>
        <div>
          <span>初始化</span>
          <strong>
            {diagnostics === null ? '—' : `${diagnostics.initializationMs.toFixed(1)} ms`}
          </strong>
        </div>
        <div>
          <span>規則所有權</span>
          <strong>Simulation Core</strong>
        </div>
      </div>

      <ul className="battlefield-legend" aria-label="戰場圖例">
        <li>
          <span className="legend-shape legend-shape--heavy" />
          角甲重盾兵 · Dense Block
        </li>
        <li>
          <span className="legend-shape legend-shape--archer" />
          弓兵 · Line
        </li>
        <li>
          <span className="legend-shape legend-shape--cavalry" />
          騎兵 · Wedge
        </li>
        <li>
          <span className="legend-shape legend-shape--wolf" />
          灰牙狼群 · Loose / Routing
        </li>
      </ul>
    </section>
  );
}
