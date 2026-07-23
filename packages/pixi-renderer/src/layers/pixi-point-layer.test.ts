import { Texture } from 'pixi.js';
import { describe, expect, it } from 'vitest';

import type { PointShape } from '../contracts/point-shape';
import type { VisualPoint } from '../contracts/visual-point';
import { PixiPointLayer } from './pixi-point-layer';

const textures: Readonly<Record<PointShape, Texture>> = {
  CIRCLE: Texture.EMPTY,
  SQUARE: Texture.WHITE,
  TRIANGLE: Texture.WHITE,
  DIAMOND: Texture.WHITE,
};

function points(count: number): VisualPoint[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    unitId: 'heavy',
    factionId: 'player',
    position: { x: id % 100, y: Math.floor(id / 100) },
    targetPosition: { x: id % 100, y: Math.floor(id / 100) },
    rotation: 0,
    scale: 1,
    alpha: 1,
    shape: id === 0 ? 'CIRCLE' : 'SQUARE',
    color: 0x5da9e9,
    state: 'ACTIVE',
    stateAgeSeconds: 0,
    animationSeed: id,
  }));
}

describe('PixiPointLayer', () => {
  it('syncs 2,000 points through one ParticleContainer', () => {
    const layer = new PixiPointLayer(textures);

    layer.sync(points(2_000));

    expect(layer.size).toBe(2_000);
    expect(layer.container.particleChildren).toHaveLength(2_000);
    expect(layer.container.particleChildren[0]?.texture).toBe(Texture.EMPTY);
  });

  it('updates existing particles and removes missing ids', () => {
    const layer = new PixiPointLayer(textures);
    const initial = points(2_000);
    layer.sync(initial);
    const firstParticle = layer.container.particleChildren[0];

    layer.sync(
      initial.slice(0, 1_900).map((point) => ({
        ...point,
        position: { x: point.position.x + 10, y: point.position.y },
      })),
    );

    expect(layer.size).toBe(1_900);
    expect(layer.container.particleChildren).toHaveLength(1_900);
    expect(layer.container.particleChildren[0]).toBe(firstParticle);
    expect(layer.container.particleChildren[0]?.x).toBe(10);
  });

  it('clears ownership on destroy', () => {
    const layer = new PixiPointLayer(textures);
    layer.sync(points(10));

    layer.destroy();

    expect(layer.size).toBe(0);
    expect(layer.container.destroyed).toBe(true);
  });
});
