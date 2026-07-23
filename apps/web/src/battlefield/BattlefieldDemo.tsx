import {
  createVisualPoints,
  mountPointCloud,
  type MountedPointCloud,
} from '@expedition/pixi-renderer';
import { useEffect, useMemo, useRef, useState } from 'react';

import { createDemoSources } from './create-demo-sources';

interface Diagnostics {
  readonly pointCount: number;
  readonly rendererType: string;
  readonly initializationMs: number;
}

interface BattlefieldDemoProps {
  readonly heavyAppearanceIds: readonly string[];
}

export function BattlefieldDemo({ heavyAppearanceIds }: BattlefieldDemoProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const points = useMemo(
    () =>
      createVisualPoints({
        sources: createDemoSources(heavyAppearanceIds),
        pointBudget: 2_000,
        spacing: 4,
      }).map((point, index) =>
        index > 0 && index % 89 === 0 ? { ...point, state: 'CASUALTY' as const } : point,
      ),
    [heavyAppearanceIds],
  );

  useEffect(() => {
    const host = hostRef.current;

    if (host === null) {
      return;
    }

    const controller = new AbortController();
    let mounted: MountedPointCloud | undefined;

    void mountPointCloud({
      host,
      points,
      width: 1_100,
      height: 620,
      backgroundColor: 0x07120f,
      signal: controller.signal,
    })
      .then((result) => {
        mounted = result;
        setDiagnostics({
          pointCount: result.pointCount,
          rendererType: result.rendererType,
          initializationMs: result.initializationMs,
        });
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
          setError(reason instanceof Error ? reason.message : '未知渲染錯誤');
        }
      });

    return () => {
      controller.abort();
      mounted?.destroy();
    };
  }, [points]);

  return (
    <section className="battlefield-panel" aria-labelledby="battlefield-title">
      <div className="battlefield-heading">
        <div>
          <p className="section-kicker">LIVE TACTICAL PROJECTION</p>
          <h2 id="battlefield-title">灰牙森林 · 接觸線 07</h2>
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
