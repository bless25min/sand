import {
  mountGuildCombatStage,
  type GuildCombatScene,
  type MountedGuildCombatStage,
} from '@expedition/pixi-renderer';
import { useEffect, useRef, useState } from 'react';

export function PixiCombatStage({
  scene,
  reducedMotion,
}: {
  scene: GuildCombatScene;
  reducedMotion: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef<MountedGuildCombatStage | undefined>(undefined);
  const latestSceneRef = useRef(scene);
  const [renderer, setRenderer] = useState<string>();
  const [error, setError] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const controller = new AbortController();
    let disposed = false;
    void mountGuildCombatStage({
      host,
      scene: latestSceneRef.current,
      reducedMotion,
      signal: controller.signal,
    })
      .then((mounted) => {
        if (disposed) {
          mounted.destroy();
          return;
        }
        mountedRef.current = mounted;
        mounted.setScene(latestSceneRef.current);
        setRenderer(mounted.rendererType);
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === 'AbortError')) setError(true);
      });
    return () => {
      disposed = true;
      controller.abort();
      mountedRef.current?.destroy();
      mountedRef.current = undefined;
    };
  }, [reducedMotion]);

  useEffect(() => {
    latestSceneRef.current = scene;
    mountedRef.current?.setScene(scene);
  }, [scene]);

  return (
    <div
      className="gr-pixi-combat-stage"
      data-pixi-combat-stage="true"
      data-renderer={renderer ?? 'loading'}
      data-render-error={error}
      data-effect-element={scene.event?.element}
      data-effect-specialization={scene.event?.specializationId}
      data-effect-phase={scene.event?.phase}
      data-preview-total={scene.preview?.totalDamage}
      data-preview-targets={scene.preview?.targetIds.length}
    >
      <div ref={hostRef} data-combat-canvas-host="true" />
      {error && (
        <p className="gr-render-fallback" role="status">
          戰場動畫已降級；目標與技能仍可正常操作。
        </p>
      )}
    </div>
  );
}
