import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { GuildCombatScene } from '@expedition/pixi-renderer';

import { PixiCombatStage } from './PixiCombatStage';

const scene = (): GuildCombatScene => ({
  width: 600,
  height: 900,
  layout: 'portrait',
  questId: 'border_pack',
  relay: 4,
  zone: {
    id: 'greyfang_frontier',
    skyTop: 0x081b1d,
    skyBottom: 0x183237,
    ground: 0x142923,
    accent: 0xe1b568,
    atmosphere: 'moon-mist',
    weather: 'cloud-drift',
  },
  units: [
    {
      id: 'brann',
      name: '布蘭',
      side: 'heroes',
      x: 100,
      y: 650,
      hpRatio: 1,
      state: 'acting',
      selected: false,
      statusLayers: { burn: 0, poison: 0, tide: 0 },
      hero: {
        id: 'brann',
        sigil: '盾',
        primary: 0xc1533b,
        secondary: 0x4c2624,
        accent: 0xffc46b,
        weapon: 'shield',
      },
    },
    {
      id: 'wolf',
      name: '灰牙首領',
      side: 'enemies',
      x: 300,
      y: 330,
      hpRatio: 0.18,
      state: 'hit',
      selected: true,
      statusLayers: { burn: 3, poison: 0, tide: 0 },
      enemy: {
        id: 'wolf',
        family: 'greyfang',
        archetype: 'boss',
        primary: 0xb8793a,
        secondary: 0x332315,
        accent: 0xffd36a,
        scale: 1.14,
        crowned: true,
      },
    },
  ],
  event: {
    id: 'visual:damage',
    sourceEventId: 90,
    eventKind: 'damage',
    phase: 'impact',
    headline: '命中',
    detail: '命中',
    relay: 4,
    intensity: 68,
    durationMs: 170,
    polarity: 'damage',
    route: 'direct',
    camera: 'punch',
    actorId: 'brann',
    targetId: 'wolf',
    number: -5,
  },
});

describe('PixiCombatStage enemy reaction output', () => {
  it('exposes the current reaction and targets on the visible stage', () => {
    const markup = renderToStaticMarkup(<PixiCombatStage scene={scene()} reducedMotion={false} />);

    expect(markup).toContain('data-enemy-reaction="stagger"');
    expect(markup).toContain('data-reaction-targets="wolf"');
  });
});
