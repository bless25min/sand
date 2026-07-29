import { describe, expect, it } from 'vitest';

import type { CombatBeat } from './combat-beats';
import { createCombatBeatCue } from './combat-beat-cue';

const beat = (overrides: Partial<CombatBeat>): CombatBeat => ({
  id: 'beat',
  sourceEventIds: [1],
  kind: 'hit',
  label: '造成 1 傷害',
  relay: 2,
  delayMs: 170,
  eventKind: 'damage',
  visual: {
    id: 'visual',
    sourceEventId: 1,
    eventKind: 'damage',
    phase: 'impact',
    headline: '重擊',
    detail: '造成 1 傷害',
    relay: 2,
    intensity: 30,
    durationMs: 170,
    polarity: 'damage',
    route: 'direct',
    camera: 'punch',
    number: -1,
  },
  ...overrides,
});

describe('combat beat cue', () => {
  it('labels combo damage as an ordered triggered chase instead of an ambiguous number', () => {
    expect(
      createCombatBeatCue(
        beat({
          kind: 'chain',
          comboIndex: 3,
          visual: {
            ...beat({}).visual,
            comboIndex: 3,
            triggerId: 'on_repeat_hit',
          },
        }),
      ),
    ).toEqual({
      tone: 'chain',
      eyebrow: '命中觸發',
      label: '追擊第 3 擊',
    });
  });

  it('keeps totals, statuses, and relay advances semantically distinct', () => {
    expect(createCombatBeatCue(beat({ kind: 'total' }))).toMatchObject({
      tone: 'total',
      label: '本棒合計',
    });
    expect(
      createCombatBeatCue(
        beat({
          kind: 'status',
          visual: { ...beat({}).visual, status: 'burn' },
        }),
      ),
    ).toMatchObject({ tone: 'status', label: '燃燒疊層' });
    expect(createCombatBeatCue(beat({ kind: 'relay', relay: 4 }))).toMatchObject({
      tone: 'relay',
      label: '接力 4 / 6',
    });
  });
});
