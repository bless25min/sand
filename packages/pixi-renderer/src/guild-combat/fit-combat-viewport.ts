interface Size {
  width: number;
  height: number;
}

export interface CombatViewportFit {
  scale: number;
  x: number;
  y: number;
}

export function fitCombatViewport(scene: Size, viewport: Size): CombatViewportFit {
  const scale = Math.min(viewport.width / scene.width, viewport.height / scene.height);
  return {
    scale,
    x: (viewport.width - scene.width * scale) / 2,
    y: (viewport.height - scene.height * scale) / 2,
  };
}
