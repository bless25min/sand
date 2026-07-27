import { Graphics } from 'pixi.js';
import type { Container } from 'pixi.js';

import type { GuildCombatScene } from './contracts';

export interface AmbientNode {
  node: Graphics;
  baseX: number;
  baseY: number;
  drift: number;
  phase: number;
}

const mix = (from: number, to: number, amount: number) => {
  const channel = (shift: number) =>
    Math.round(((from >> shift) & 0xff) * (1 - amount) + ((to >> shift) & 0xff) * amount);
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
};

const pseudo = (index: number, salt: number) => {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43_758.5453;
  return value - Math.floor(value);
};

function drawLandmarks(container: Container, scene: GuildCombatScene) {
  const { width, height, zone } = scene;
  const landmarks = new Graphics();
  if (zone.atmosphere === 'moon-mist') {
    landmarks.circle(width * 0.78, 105, 54).fill({ color: 0xe8e2be, alpha: 0.2 });
    landmarks.circle(width * 0.78, 105, 43).fill({ color: 0xf8edc4, alpha: 0.18 });
    for (let index = 0; index < 9; index += 1) {
      const x = index * 135 - 40;
      const heightOffset = 55 + (index % 3) * 26;
      landmarks
        .poly([x, 390, x + 78, 390 - heightOffset, x + 150, 390])
        .fill({ color: 0x0c1d1b, alpha: 0.9 });
    }
  } else if (zone.atmosphere === 'ore-dust') {
    for (let index = 0; index < 8; index += 1) {
      const x = index * 150 - 30;
      landmarks
        .poly([x, 365, x + 45, 180 + (index % 2) * 45, x + 95, 365])
        .fill({ color: 0x182019, alpha: 0.95 });
      landmarks
        .rect(x + 39, 210 + (index % 2) * 45, 12, 155)
        .fill({ color: zone.accent, alpha: 0.1 });
    }
  } else if (zone.atmosphere === 'ember-ash') {
    landmarks
      .poly([0, 390, 150, 290, 270, 350, 430, 180, 610, 350, 790, 225, 1_000, 390])
      .fill({ color: 0x1d0d15, alpha: 0.96 });
    for (let index = 0; index < 6; index += 1) {
      const x = 65 + index * 175;
      landmarks
        .poly([x, 365, x + 35, 250 - (index % 2) * 40, x + 70, 365])
        .fill({ color: 0x2d1217, alpha: 0.9 });
      landmarks.circle(x + 35, 270 - (index % 2) * 40, 8).fill({
        color: zone.accent,
        alpha: 0.38,
      });
    }
  } else {
    for (let index = 0; index < 7; index += 1) {
      const x = 40 + index * 155;
      const towerHeight = 100 + (index % 3) * 34;
      landmarks.rect(x, 375 - towerHeight, 72, towerHeight).fill({ color: 0x101d33, alpha: 0.95 });
      landmarks
        .poly([x - 8, 375 - towerHeight, x + 36, 240 - towerHeight / 3, x + 80, 375 - towerHeight])
        .fill({ color: 0x172947, alpha: 0.96 });
    }
  }
  container.addChild(landmarks);

  const ground = new Graphics();
  ground.rect(0, height * 0.66, width, height * 0.34).fill({ color: zone.ground, alpha: 1 });
  for (let index = 0; index < 7; index += 1) {
    ground
      .ellipse(width * 0.52, height * (0.68 + index * 0.045), width * (0.48 - index * 0.045), 6)
      .stroke({ color: zone.accent, width: 1, alpha: 0.08 + index * 0.015 });
  }
  container.addChild(ground);
}

export function drawCombatBackground(
  container: Container,
  scene: GuildCombatScene,
  particleCount: number,
): readonly AmbientNode[] {
  for (let index = 0; index < 9; index += 1) {
    const band = new Graphics()
      .rect(0, (scene.height / 9) * index, scene.width, scene.height / 9 + 1)
      .fill({ color: mix(scene.zone.skyTop, scene.zone.skyBottom, index / 8) });
    container.addChild(band);
  }
  drawLandmarks(container, scene);

  const particles: AmbientNode[] = [];
  for (let index = 0; index < particleCount; index += 1) {
    const baseX = pseudo(index, scene.relay) * scene.width;
    const baseY = 45 + pseudo(index, scene.relay + 4) * (scene.height - 100);
    const radius = 1 + pseudo(index, 9) * (scene.relay >= 5 ? 3.4 : 2.1);
    const node = new Graphics()
      .circle(0, 0, radius)
      .fill({ color: scene.zone.accent, alpha: 0.16 + pseudo(index, 3) * 0.4 });
    node.position.set(baseX, baseY);
    container.addChild(node);
    particles.push({
      node,
      baseX,
      baseY,
      drift: 10 + pseudo(index, 6) * 26,
      phase: pseudo(index, 8) * Math.PI * 2,
    });
  }
  return particles;
}
