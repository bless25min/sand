import { mountPointCloud, type MountedPointCloud, type VisualPoint } from '@expedition/pixi-renderer';
import { useEffect, useRef, useState, type RefObject } from 'react';

export interface PointCloudStatus {
  readonly pointCount: number;
  readonly rendererType: string;
  readonly initializationMs: number;
}

export function usePointCloud(
  hostRef: RefObject<HTMLDivElement | null>,
  points: readonly VisualPoint[],
) {
  const mountedRef = useRef<MountedPointCloud>();
  const latestPointsRef = useRef(points);
  const [status, setStatus] = useState<PointCloudStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) return;

    const controller = new AbortController();
    let disposed = false;

    void mountPointCloud({
      host,
      points: latestPointsRef.current,
      width: 1_100,
      height: 620,
      backgroundColor: 0x07120f,
      signal: controller.signal,
    })
      .then((result) => {
        if (disposed) {
          result.destroy();
          return;
        }
        mountedRef.current = result;
        result.setPoints(latestPointsRef.current);
        setStatus({
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
      disposed = true;
      controller.abort();
      mountedRef.current?.destroy();
      mountedRef.current = undefined;
    };
  }, [hostRef]);

  useEffect(() => {
    latestPointsRef.current = points;
    mountedRef.current?.setPoints(points);
  }, [points]);

  return { status, error };
}
