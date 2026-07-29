import {
  createCombatEffectPlan,
  createStatusAuraPlan,
  mountGuildCombatStage,
  type GuildCombatScene,
  type MountedGuildCombatStage,
} from '@expedition/pixi-renderer';
import { useEffect, useRef, useState } from 'react';

const statusAuraSummary = (scene: GuildCombatScene) =>
  scene.units
    .flatMap((unit) => {
      const layers = createStatusAuraPlan(unit).layers.map(
        ({ kind, tier, projectedTier }) =>
          `${kind}-${tier}${tier === projectedTier ? '' : `>${projectedTier}`}`,
      );
      return layers.length > 0 ? [`${unit.id}:${layers.join(',')}`] : [];
    })
    .join(';');

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
  const actingUnit = scene.units.find(({ id }) => id === scene.event?.actorId);
  const effectPlan = createCombatEffectPlan(scene);
  const auraSummary = statusAuraSummary(scene);

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
      data-effect-delivery={actingUnit?.hero?.weapon ?? (actingUnit?.enemy ? 'enemy' : undefined)}
      data-effect-phase={scene.event?.phase}
      data-enemy-reaction={effectPlan.enemyReaction.kind}
      data-enemy-attack={effectPlan.enemyAttack.active ? effectPlan.enemyAttack.motif : undefined}
      data-enemy-attack-phase={
        effectPlan.enemyAttack.active ? effectPlan.enemyAttack.phase : undefined
      }
      data-enemy-attack-outcome={
        effectPlan.enemyAttack.active ? effectPlan.enemyAttack.outcome : undefined
      }
      data-reaction-targets={effectPlan.enemyReaction.targetIds.join(',')}
      data-reaction-force={effectPlan.enemyReaction.force}
      data-preview-total={scene.preview?.totalDamage}
      data-preview-targets={scene.preview?.targetIds.length}
      data-status-auras={auraSummary || undefined}
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
