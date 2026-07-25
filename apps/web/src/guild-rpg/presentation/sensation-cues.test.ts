import type { ComboEvent } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { createSensationCueTracker, projectSensationCues } from './sensation-cues';

describe('sensation cue projection', () => {
  it('projects an ordered, bounded identity for every visible causal milestone', () => {
    const events: readonly ComboEvent[] = [
      { id: 0, causalId: 'card', kind: 'card_played', message: '起手' },
      { id: 1, causalId: 'shield', kind: 'shield', message: '格擋' },
      { id: 2, causalId: 'rule', kind: 'rule_triggered', message: '觸發' },
      { id: 3, causalId: 'hit-a', kind: 'damage', message: '命中' },
      { id: 4, causalId: 'hit-b', kind: 'damage', message: '再次命中' },
      { id: 5, causalId: 'kill', kind: 'unit_defeated', message: '擊破' },
      {
        id: 6,
        causalId: 'phase',
        kind: 'boss_phase',
        message: '處刑窗',
        phaseId: 'alpha-execution',
      },
      { id: 7, causalId: 'overkill', kind: 'overkill', message: '溢傷' },
      { id: 8, causalId: 'victory', kind: 'victory', message: '全滅' },
    ];

    expect(
      projectSensationCues({
        events,
        lootRevealed: true,
        ruleOnline: true,
      }),
    ).toEqual([
      'stack',
      'block',
      'trigger',
      'hit',
      'break',
      'kill',
      'boss-execution',
      'overkill',
      'annihilation',
      'loot',
      'rule-online',
    ]);
  });

  it('does not emit cues for pressure bookkeeping or duplicate the same cue in one frame', () => {
    expect(
      projectSensationCues({
        events: [
          { id: 0, causalId: 'pressure', kind: 'enemy_pressure', message: '壓力' },
          { id: 1, causalId: 'hit-a', kind: 'damage', message: '命中' },
          { id: 2, causalId: 'hit-b', kind: 'damage', message: '命中' },
        ],
      }),
    ).toEqual(['hit']);
  });

  it('emits only newly visible events, reward entry, and newly activated rules', () => {
    const tracker = createSensationCueTracker();
    const events: readonly ComboEvent[] = [
      { id: 0, causalId: 'card', kind: 'card_played', message: '起手' },
      { id: 1, causalId: 'hit', kind: 'damage', message: '命中' },
      { id: 2, causalId: 'kill', kind: 'unit_defeated', message: '擊破' },
    ];

    expect(
      tracker.next({
        sessionId: 'hunt-a',
        screen: 'playback',
        visibleEvents: events.slice(0, 2),
        activatedRuleIds: [],
      }),
    ).toEqual(['stack', 'hit']);
    expect(
      tracker.next({
        sessionId: 'hunt-a',
        screen: 'playback',
        visibleEvents: events.slice(0, 2),
        activatedRuleIds: [],
      }),
    ).toEqual([]);
    expect(
      tracker.next({
        sessionId: 'hunt-a',
        screen: 'playback',
        visibleEvents: events,
        activatedRuleIds: [],
      }),
    ).toEqual(['break', 'kill']);
    expect(
      tracker.next({
        sessionId: 'hunt-a',
        screen: 'rewards',
        visibleEvents: events,
        activatedRuleIds: ['steel-echo'],
      }),
    ).toEqual(['loot', 'rule-online']);
    expect(
      tracker.next({
        sessionId: 'hunt-a',
        screen: 'rewards',
        visibleEvents: events,
        activatedRuleIds: ['steel-echo'],
      }),
    ).toEqual([]);

    expect(
      tracker.next({
        sessionId: 'hunt-a',
        screen: 'playback',
        visibleEvents: [
          ...events,
          { id: 3, causalId: 'hit', kind: 'damage', message: '第二次釋放仍然命中' },
        ],
        activatedRuleIds: [],
      }),
    ).toEqual(['hit']);
  });
});
