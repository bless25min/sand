import { Particle, ParticleContainer, type Texture } from 'pixi.js';

import type { PointShape } from '../contracts/point-shape';
import type { VisualPoint } from '../contracts/visual-point';

export type PointTextureMap = Readonly<Record<PointShape, Texture>>;

export class PixiPointLayer {
  readonly container = new ParticleContainer<Particle>({
    dynamicProperties: {
      position: true,
      rotation: true,
      vertex: true,
      uvs: true,
      color: true,
    },
  });

  private readonly particlesById = new Map<number, Particle>();

  constructor(private readonly textures: PointTextureMap) {}

  get size(): number {
    return this.particlesById.size;
  }

  sync(points: readonly VisualPoint[]): void {
    if (this.container.destroyed) {
      throw new Error('cannot sync a destroyed PixiPointLayer');
    }

    const activeIds = new Set<number>();

    for (const point of points) {
      if (activeIds.has(point.id)) {
        throw new RangeError(`duplicate visual point id ${point.id}`);
      }
      activeIds.add(point.id);

      const texture = this.textures[point.shape];
      let particle = this.particlesById.get(point.id);

      if (particle === undefined) {
        particle = new Particle({
          texture,
          anchorX: 0.5,
          anchorY: 0.5,
        });
        this.particlesById.set(point.id, particle);
        this.container.addParticle(particle);
      }

      particle.texture = texture;
      particle.x = point.position.x;
      particle.y = point.position.y;
      particle.scaleX = point.scale;
      particle.scaleY = point.scale;
      particle.rotation = point.rotation;
      particle.tint = point.color;
      particle.alpha = point.alpha;
    }

    for (const [id, particle] of this.particlesById) {
      if (!activeIds.has(id)) {
        this.container.removeParticle(particle);
        this.particlesById.delete(id);
      }
    }

    this.container.update();
  }

  destroy(): void {
    if (!this.container.destroyed) {
      this.container.removeParticles();
      this.container.destroy();
    }
    this.particlesById.clear();
  }
}
