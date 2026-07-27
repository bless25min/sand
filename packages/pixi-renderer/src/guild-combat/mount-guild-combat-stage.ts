import { Application, Container, RendererType } from 'pixi.js';

import { createCombatEffectPlan } from './combat-effect-plan';
import type { GuildCombatScene } from './contracts';
import { drawCombatBackground, type AmbientNode } from './draw-background';
import { drawCombatEffects, type EffectNodes } from './draw-effects';
import { drawCombatUnits, type UnitNode } from './draw-units';

export interface MountGuildCombatStageInput {
  host: HTMLElement;
  scene: GuildCombatScene;
  reducedMotion?: boolean;
  signal?: AbortSignal;
}

export interface MountedGuildCombatStage {
  rendererType: string;
  initializationMs: number;
  setScene(scene: GuildCombatScene): void;
  destroy(): void;
}

interface RenderNodes {
  world: Container;
  ambient: readonly AmbientNode[];
  units: readonly UnitNode[];
  effects: EffectNodes;
  effectStartedAt: number;
}

const routePosition = (
  route: readonly { x: number; y: number }[],
  progress: number,
): { x: number; y: number } => {
  if (route.length === 0) return { x: 0, y: 0 };
  const segments = route.length - 1;
  const scaled = Math.min(0.999, Math.max(0, progress)) * segments;
  const index = Math.floor(scaled);
  const local = scaled - index;
  const from = route[index]!;
  const to = route[Math.min(route.length - 1, index + 1)]!;
  return { x: from.x + (to.x - from.x) * local, y: from.y + (to.y - from.y) * local };
};

export async function mountGuildCombatStage(
  input: MountGuildCombatStageInput,
): Promise<MountedGuildCombatStage> {
  const startedAt = performance.now();
  const app = new Application();
  await app.init({
    width: input.scene.width,
    height: input.scene.height,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    preference: 'webgl',
    backgroundAlpha: 0,
  });
  if (input.signal?.aborted === true) {
    app.destroy({ removeView: true });
    throw new DOMException('Guild combat stage mount aborted', 'AbortError');
  }

  const canvas = app.canvas;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvas.setAttribute('aria-hidden', 'true');
  input.host.replaceChildren(canvas);

  let currentScene = input.scene;
  let currentPlan = createCombatEffectPlan(currentScene);
  let nodes: RenderNodes;

  const draw = (scene: GuildCombatScene): RenderNodes => {
    app.stage.removeChildren().forEach((child) => child.destroy({ children: true }));
    const world = new Container();
    world.pivot.set(scene.width / 2, scene.height / 2);
    world.position.set(scene.width / 2, scene.height / 2);
    const plan = createCombatEffectPlan(scene);
    world.scale.set(plan.cameraZoom);
    app.stage.addChild(world);
    const ambient = drawCombatBackground(world, scene, plan.ambientParticles);
    const units = drawCombatUnits(world, scene);
    const effects = drawCombatEffects(world, scene, plan);
    return { world, ambient, units, effects, effectStartedAt: performance.now() };
  };

  nodes = draw(currentScene);

  const tick = () => {
    const now = performance.now();
    const elapsed = (now - nodes.effectStartedAt) / 1_000;
    const duration = Math.max(0.12, (currentScene.event?.durationMs ?? 180) / 1_000);
    const progress = Math.min(1, elapsed / duration);
    if (!input.reducedMotion) {
      for (const ambient of nodes.ambient) {
        ambient.node.position.set(
          ambient.baseX + Math.sin(elapsed * 0.7 + ambient.phase) * ambient.drift,
          ambient.baseY - ((elapsed * ambient.drift) % 72),
        );
      }
      for (const [index, unit] of nodes.units.entries()) {
        const activeBoost = unit.state === 'acting' ? 4.5 : unit.state === 'next' ? 2.4 : 1.2;
        unit.node.position.y = unit.baseY + Math.sin(elapsed * 2.2 + index) * activeBoost;
      }
      if (currentPlan.shakePx > 0 && currentScene.event?.camera !== 'none') {
        const decay = 1 - progress;
        nodes.world.position.set(
          currentScene.width / 2 + Math.sin(elapsed * 64) * currentPlan.shakePx * decay,
          currentScene.height / 2 + Math.cos(elapsed * 53) * currentPlan.shakePx * decay,
        );
      }
    }
    if (nodes.effects.projectile && currentPlan.route.length > 1) {
      const position = routePosition(currentPlan.route, progress);
      nodes.effects.projectile.position.set(position.x, position.y);
      nodes.effects.projectile.rotation += 0.18;
    }
    for (const [index, ring] of nodes.effects.rings.entries()) {
      const ringProgress = Math.min(1, Math.max(0, progress * 1.3 - index * 0.04));
      ring.scale.set(0.55 + ringProgress * (1.2 + index * 0.04));
      ring.alpha = Math.max(0, 1 - ringProgress);
    }
    for (const [index, particle] of nodes.effects.burst.entries()) {
      const angle = (index / Math.max(1, nodes.effects.burst.length)) * Math.PI * 2;
      particle.x += Math.cos(angle) * (0.6 + currentScene.relay * 0.15);
      particle.y += Math.sin(angle) * (0.6 + currentScene.relay * 0.15);
      particle.alpha = Math.max(0, 1 - progress);
    }
    if (nodes.effects.number) {
      nodes.effects.number.y -= 0.35 + currentScene.relay * 0.05;
      nodes.effects.number.scale.set(0.82 + Math.sin(Math.min(1, progress) * Math.PI) * 0.28);
      nodes.effects.number.alpha = Math.max(0.18, 1 - progress * 0.78);
    }
  };
  app.ticker.add(tick);

  return {
    rendererType:
      app.renderer.type === RendererType.WEBGL
        ? 'WebGL'
        : app.renderer.type === RendererType.WEBGPU
          ? 'WebGPU'
          : 'Canvas',
    initializationMs: performance.now() - startedAt,
    setScene(scene) {
      currentScene = scene;
      currentPlan = createCombatEffectPlan(scene);
      nodes = draw(scene);
    },
    destroy() {
      app.ticker.remove(tick);
      app.destroy({ removeView: true });
      if (canvas.parentElement === input.host) canvas.remove();
    },
  };
}
