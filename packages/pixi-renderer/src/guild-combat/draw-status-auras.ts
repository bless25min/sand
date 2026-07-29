import { Container, Graphics } from 'pixi.js';

import type { GuildCombatSceneUnit } from './contracts';
import {
  createStatusAuraPlan,
  type StatusAuraKind,
  type StatusAuraLayerPlan,
} from './status-aura-plan';

export interface StatusAuraNode {
  kind: StatusAuraKind;
  node: Container;
  baseY: number;
  phase: number;
  preview: boolean;
}

const markState = (
  layer: StatusAuraLayerPlan,
  index: number,
): 'active' | 'preview' | 'consumed' => {
  const activeMarks = layer.tier === 0 ? 0 : layer.tier * 2 + 1;
  const projectedMarks = layer.projectedTier === 0 ? 0 : layer.projectedTier * 2 + 1;
  if (index < Math.min(activeMarks, projectedMarks)) return 'active';
  return projectedMarks > activeMarks ? 'preview' : 'consumed';
};

const stateAlpha = (state: ReturnType<typeof markState>) =>
  state === 'active' ? 0.68 : state === 'preview' ? 0.38 : 0.18;

const drawFlames = (layer: StatusAuraLayerPlan) => {
  const root = new Container();
  root.position.y = -7;
  for (let index = 0; index < layer.marks; index += 1) {
    const state = markState(layer, index);
    const lane = index - (layer.marks - 1) / 2;
    const x = lane * 15;
    const height = 24 + ((index * 7) % 13) + layer.projectedTier * 7;
    const width = 9 + (index % 2) * 2;
    const flame = new Graphics()
      .poly([x - width, 9, x - width * 0.35, -height * 0.38, x, -height, x + width, 9])
      .fill({ color: 0xff5a32, alpha: stateAlpha(state) })
      .poly([x - width * 0.46, 7, x, -height * 0.58, x + width * 0.46, 7])
      .fill({ color: state === 'preview' ? 0xfff0a6 : 0xffc43d, alpha: stateAlpha(state) });
    if (state !== 'active') {
      flame.stroke({
        color: state === 'preview' ? 0xffffff : 0xff805f,
        width: state === 'preview' ? 2 : 1,
        alpha: 0.62,
      });
    }
    root.addChild(flame);
  }
  return root;
};

const drawSpores = (layer: StatusAuraLayerPlan) => {
  const root = new Container();
  root.position.y = -48;
  const fogAlpha = 0.08 + layer.projectedTier * 0.035;
  root.addChild(
    new Graphics()
      .ellipse(-16, 12, 48 + layer.projectedTier * 10, 25 + layer.projectedTier * 4)
      .fill({ color: 0x6acb52, alpha: fogAlpha })
      .ellipse(20, -8, 38 + layer.projectedTier * 8, 21 + layer.projectedTier * 3)
      .fill({ color: 0xb4ef67, alpha: fogAlpha * 0.78 }),
  );
  for (let index = 0; index < layer.marks; index += 1) {
    const state = markState(layer, index);
    const angle = (index / Math.max(1, layer.marks)) * Math.PI * 2;
    const radius = 40 + (index % 2) * 18 + layer.projectedTier * 3;
    const size = 4 + (index % 3);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.62;
    root.addChild(
      new Graphics()
        .circle(x, y, size + 3)
        .fill({ color: 0x67d459, alpha: stateAlpha(state) * 0.18 })
        .circle(x, y, size)
        .fill({
          color: state === 'preview' ? 0xf1ffb8 : 0x9be45d,
          alpha: stateAlpha(state),
        })
        .circle(x - 1, y - 1, Math.max(1, size * 0.34))
        .fill({ color: 0xffffff, alpha: state === 'consumed' ? 0.12 : 0.68 }),
    );
  }
  return root;
};

const drawRipples = (layer: StatusAuraLayerPlan) => {
  const root = new Container();
  root.position.y = 3;
  const count = Math.max(layer.tier, layer.projectedTier);
  for (let index = 0; index < count; index += 1) {
    const active = index < layer.tier;
    const projected = index < layer.projectedTier;
    const state = active && projected ? 'active' : projected ? 'preview' : 'consumed';
    const width = 62 + index * 28;
    const height = 17 + index * 7;
    root.addChild(
      new Graphics()
        .ellipse(0, 0, width, height)
        .stroke({
          color: state === 'preview' ? 0xe8ffff : 0x65d9ef,
          width: state === 'active' ? 5 - index * 0.65 : 3,
          alpha: stateAlpha(state),
        })
        .arc(0, -52, 38 + index * 10, Math.PI * 0.08, Math.PI * 0.92)
        .stroke({
          color: 0x8defff,
          width: 2,
          alpha: stateAlpha(state) * 0.48,
        }),
    );
  }
  return root;
};

export function drawStatusAuras(
  root: Container,
  unit: GuildCombatSceneUnit,
): readonly StatusAuraNode[] {
  return createStatusAuraPlan(unit).layers.map((layer, index) => {
    const node =
      layer.motif === 'flame'
        ? drawFlames(layer)
        : layer.motif === 'spore'
          ? drawSpores(layer)
          : drawRipples(layer);
    const preview = layer.previewDelta !== 0;
    node.alpha = preview ? 0.92 : 1;
    root.addChild(node);
    return {
      kind: layer.kind,
      node,
      baseY: node.position.y,
      phase: index * 1.9 + unit.x * 0.013,
      preview,
    };
  });
}
