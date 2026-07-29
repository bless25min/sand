import { Application, Container, RendererType } from 'pixi.js';

import { createCombatEffectPlan } from './combat-effect-plan';
import { createCombatMotion } from './combat-motion-plan';
import type { GuildCombatScene } from './contracts';
import { drawCombatBackground, type AmbientNode } from './draw-background';
import { drawCombatEffects, type EffectNodes } from './draw-effects';
import { drawCombatUnits, type UnitNode } from './draw-units';
import { fitCombatViewport } from './fit-combat-viewport';

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
  cameraX: number;
  cameraY: number;
  baseScale: number;
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
  let viewport = { width: currentScene.width, height: currentScene.height };
  let nodes: RenderNodes;

  const fitWorld = (world: Container, scene: GuildCombatScene) => {
    const fit = fitCombatViewport(scene, viewport);
    const cameraX = fit.x + (scene.width * fit.scale) / 2;
    const cameraY = fit.y + (scene.height * fit.scale) / 2;
    world.pivot.set(scene.width / 2, scene.height / 2);
    world.position.set(cameraX, cameraY);
    world.scale.set(fit.scale);
    return { cameraX, cameraY, baseScale: fit.scale };
  };

  const draw = (scene: GuildCombatScene): RenderNodes => {
    app.stage.removeChildren().forEach((child) => child.destroy({ children: true }));
    const world = new Container();
    const plan = createCombatEffectPlan(scene);
    app.stage.addChild(world);
    const ambient = drawCombatBackground(world, scene, plan.ambientParticles);
    const units = drawCombatUnits(world, scene);
    const effects = drawCombatEffects(world, scene, plan);
    const camera = fitWorld(world, scene);
    return { world, ambient, units, effects, effectStartedAt: performance.now(), ...camera };
  };

  nodes = draw(currentScene);

  const resizeToHost = () => {
    const bounds = input.host.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    viewport = { width: bounds.width, height: bounds.height };
    app.renderer.resize(bounds.width, bounds.height);
    Object.assign(nodes, fitWorld(nodes.world, currentScene));
  };
  const observer = new ResizeObserver(resizeToHost);
  observer.observe(input.host);
  resizeToHost();

  const tick = () => {
    const now = performance.now();
    const elapsed = (now - nodes.effectStartedAt) / 1_000;
    const duration = Math.max(0.12, (currentScene.event?.durationMs ?? 180) / 1_000);
    const holdsImpact =
      currentScene.event?.phase === 'impact' || currentScene.event?.phase === 'finisher';
    const hitStop = holdsImpact ? Math.min(duration - 0.05, currentPlan.hitStopMs / 1_000) : 0;
    const effectElapsed = Math.max(0, elapsed - hitStop);
    const activeDuration = Math.max(0.05, duration - hitStop);
    const progress = Math.min(1, effectElapsed / activeDuration);
    if (!input.reducedMotion) {
      const cameraPunch =
        holdsImpact && currentScene.event?.camera !== 'none'
          ? Math.sin(Math.min(1, progress) * Math.PI)
          : 0;
      nodes.world.scale.set(nodes.baseScale * (1 + (currentPlan.cameraZoom - 1) * cameraPunch));
      for (const ambient of nodes.ambient) {
        ambient.node.position.set(
          ambient.baseX + Math.sin(elapsed * 0.7 + ambient.phase) * ambient.drift,
          ambient.baseY - ((elapsed * ambient.drift) % 72),
        );
      }
      for (const [index, unit] of nodes.units.entries()) {
        const sceneUnit = currentScene.units.find(({ id }) => id === unit.id);
        const activeBoost = unit.state === 'acting' ? 4.5 : unit.state === 'next' ? 2.4 : 1.2;
        const motion = createCombatMotion({
          side: sceneUnit?.side ?? 'heroes',
          state: unit.state,
          ...(currentScene.event?.phase ? { phase: currentScene.event.phase } : {}),
          relay: currentScene.event?.causalDepth ?? currentScene.event?.relay ?? currentScene.relay,
          progress,
          finisher: currentPlan.finisher && currentScene.event?.phase === 'finisher',
          ...(sceneUnit?.hero?.weapon ? { weapon: sceneUnit.hero.weapon } : {}),
        });
        unit.node.position.set(
          unit.baseX + motion.x,
          unit.baseY + motion.y + Math.sin(effectElapsed * 2.2 + index) * activeBoost,
        );
        unit.node.scale.set(motion.scale);
        unit.node.rotation = motion.rotation;
      }
      if (currentPlan.shakePx > 0 && currentScene.event?.camera !== 'none') {
        const decay = 1 - progress;
        nodes.world.position.set(
          nodes.cameraX + Math.sin(effectElapsed * 64) * currentPlan.shakePx * decay,
          nodes.cameraY + Math.cos(effectElapsed * 53) * currentPlan.shakePx * decay,
        );
      }
    }
    if (nodes.effects.projectile && currentPlan.route.length > 1) {
      const position = routePosition(currentPlan.route, progress);
      nodes.effects.projectile.position.set(position.x, position.y);
      nodes.effects.projectile.rotation += 0.18;
    }
    for (const [index, afterimage] of nodes.effects.afterimages.entries()) {
      const echo = 0.62 + Math.sin(Math.min(1, progress) * Math.PI) * 0.45;
      afterimage.scale.set(echo + index * 0.035);
      afterimage.alpha = Math.max(
        0,
        (0.2 + (index / Math.max(1, nodes.effects.afterimages.length)) * 0.42) *
          (1 - progress * 0.78),
      );
    }
    for (const flash of nodes.effects.flashes) {
      flash.scale.set(currentPlan.impactScale * (0.42 + progress * 0.82));
      flash.alpha = Math.max(0, 0.9 - progress * 2.6);
    }
    if (nodes.effects.screenFlash) {
      nodes.effects.screenFlash.alpha =
        currentPlan.screenFlashAlpha * Math.max(0, 1 - progress * 3.4);
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
    for (const [index, mark] of nodes.effects.marks.entries()) {
      const direction = index % 2 === 0 ? 1 : -1;
      mark.rotation += direction * (0.008 + currentScene.relay * 0.002);
      mark.scale.set(0.78 + Math.sin(Math.min(1, progress) * Math.PI) * 0.38);
      mark.alpha = Math.max(0.08, 1 - progress * 0.9);
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
      resizeToHost();
    },
    destroy() {
      observer.disconnect();
      app.ticker.remove(tick);
      app.destroy({ removeView: true });
      if (canvas.parentElement === input.host) canvas.remove();
    },
  };
}
