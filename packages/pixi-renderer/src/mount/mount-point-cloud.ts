import { Application, RendererType } from 'pixi.js';

import type { VisualPoint } from '../contracts/visual-point';
import { PixiPointLayer } from '../layers/pixi-point-layer';
import { advanceVisualPoint } from '../points/advance-visual-point';
import { createPointTextures } from '../textures/create-point-textures';

export interface MountPointCloudInput {
  readonly host: HTMLElement;
  readonly points: readonly VisualPoint[];
  readonly width: number;
  readonly height: number;
  readonly backgroundColor?: number;
  readonly signal?: AbortSignal;
}

export interface MountedPointCloud {
  readonly pointCount: number;
  readonly rendererType: string;
  readonly initializationMs: number;
  setPoints(points: readonly VisualPoint[]): void;
  destroy(): void;
}

export async function mountPointCloud(input: MountPointCloudInput): Promise<MountedPointCloud> {
  const startedAt = performance.now();
  const application = new Application();
  await application.init({
    width: input.width,
    height: input.height,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    preference: 'webgl',
    backgroundColor: input.backgroundColor ?? 0x07120f,
  });

  if (input.signal?.aborted === true) {
    application.destroy({ removeView: true });
    throw new DOMException('Point cloud mount aborted', 'AbortError');
  }

  const textureSet = createPointTextures();
  const layer = new PixiPointLayer(textureSet.textures);
  const canvas = application.canvas;
  canvas.style.width = '100%';
  canvas.style.height = 'auto';
  let points = [...input.points];
  layer.sync(points);
  application.stage.addChild(layer.container);
  input.host.replaceChildren(canvas);

  const onTick = () => {
    const deltaSeconds = application.ticker.deltaMS / 1_000;
    points = points
      .map((point) =>
        advanceVisualPoint({
          point,
          deltaSeconds,
          interpolationRate: 0.35,
          casualtyFadeSeconds: 4,
          ...(point.state === 'ROUTING' ? { routingFlow: { x: -8, y: 1.5 } } : {}),
        }),
      )
      .filter((point) => point.alpha > 0);
    layer.sync(points);
  };
  application.ticker.add(onTick);

  const mounted: MountedPointCloud = {
    pointCount: points.length,
    rendererType:
      application.renderer.type === RendererType.WEBGL
        ? 'WebGL'
        : application.renderer.type === RendererType.WEBGPU
          ? 'WebGPU'
          : 'Canvas',
    initializationMs: performance.now() - startedAt,
    setPoints(nextPoints) {
      points = [...nextPoints];
      layer.sync(points);
    },
    destroy() {
      application.ticker.remove(onTick);
      application.stage.removeChild(layer.container);
      layer.destroy();
      textureSet.destroy();
      application.destroy({ removeView: true });
      if (canvas.parentElement === input.host) {
        canvas.remove();
      }
    },
  };

  return mounted;
}
