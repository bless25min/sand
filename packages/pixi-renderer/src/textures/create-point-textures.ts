import { Rectangle, Texture } from 'pixi.js';

import type { PointShape } from '../contracts/point-shape';
import type { PointTextureMap } from '../layers/pixi-point-layer';

const FRAME_SIZE = 32;
const SHAPES: readonly PointShape[] = ['CIRCLE', 'SQUARE', 'TRIANGLE', 'DIAMOND'];

export interface PointTextureSet {
  readonly textures: PointTextureMap;
  destroy(): void;
}

function drawShape(context: CanvasRenderingContext2D, shape: PointShape, frameIndex: number): void {
  const centerX = frameIndex * FRAME_SIZE + FRAME_SIZE / 2;
  const centerY = FRAME_SIZE / 2;
  const radius = 5;
  context.beginPath();

  switch (shape) {
    case 'CIRCLE':
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      break;
    case 'SQUARE':
      context.rect(centerX - radius, centerY - radius, radius * 2, radius * 2);
      break;
    case 'TRIANGLE':
      context.moveTo(centerX, centerY - radius - 1);
      context.lineTo(centerX + radius + 1, centerY + radius);
      context.lineTo(centerX - radius - 1, centerY + radius);
      context.closePath();
      break;
    case 'DIAMOND':
      context.moveTo(centerX, centerY - radius - 1);
      context.lineTo(centerX + radius + 1, centerY);
      context.lineTo(centerX, centerY + radius + 1);
      context.lineTo(centerX - radius - 1, centerY);
      context.closePath();
      break;
  }

  context.fill();
}

export function createPointTextures(): PointTextureSet {
  const canvas = document.createElement('canvas');
  canvas.width = FRAME_SIZE * SHAPES.length;
  canvas.height = FRAME_SIZE;
  const context = canvas.getContext('2d');

  if (context === null) {
    throw new Error('2D canvas context is required to create point textures');
  }

  context.fillStyle = '#ffffff';
  SHAPES.forEach((shape, index) => drawShape(context, shape, index));

  const atlas = Texture.from(canvas);
  const textures = Object.fromEntries(
    SHAPES.map((shape, index) => [
      shape,
      new Texture({
        source: atlas.source,
        frame: new Rectangle(index * FRAME_SIZE, 0, FRAME_SIZE, FRAME_SIZE),
        label: `expedition-point-${shape.toLowerCase()}`,
      }),
    ]),
  ) as Record<PointShape, Texture>;

  return {
    textures,
    destroy() {
      for (const texture of Object.values(textures)) {
        texture.destroy(false);
      }
      atlas.destroy(true);
    },
  };
}
